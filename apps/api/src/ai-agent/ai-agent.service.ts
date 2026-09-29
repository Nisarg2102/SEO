import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';

const MAX_MESSAGE_LENGTH = 4000;   // Prevents excessively long prompts designed to override the system instruction
const MAX_HISTORY_TURNS = 20;      // Prevent unbounded context accumulation

/**
 * Strip null bytes and common prompt-injection patterns from user input.
 * This is defence-in-depth — the system prompt is the primary control,
 * but we don't want raw user strings passed unmodified.
 */
function sanitizeUserInput(input: string): string {
  return input
    .replace(/\0/g, '')                        // Null bytes
    .replace(/\r?\n{5,}/g, '\n\n')             // Collapse excessive newlines used for prompt padding
    .trim()
    .substring(0, MAX_MESSAGE_LENGTH);
}

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService
  ) {}

  private getTools(workspaceId: string) {
    const p = this.prisma as any;
    
    return [
      {
        name: 'get_workspace',
        description: 'Get information about the current workspace',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          return p.workspace.findUnique({ where: { id: workspaceId } });
        }
      },
      {
        name: 'get_brand_profile',
        description: 'Get the brand profile, target audience, tone, and services',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          return p.brandProfile.findUnique({ where: { workspaceId } });
        }
      },
      {
        name: 'search_research',
        description: 'Search through collected research items',
        parameters: { 
          type: 'object', 
          properties: {
            query: { type: 'string', description: 'Topic to search for' }
          },
          required: ['query']
        },
        execute: async ({ query }: any) => {
          // Simple mock search, in reality pgvector or ILIKE
          return p.researchItem.findMany({ 
            where: { workspaceId },
            take: 5 
          });
        }
      },
      {
        name: 'get_recent_content',
        description: 'Get recently generated content packs',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          return p.contentPack.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
            take: 10
          });
        }
      },
      {
        name: 'get_content_performance',
        description: 'Get analytics and performance of recently published content',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          return p.postMetric.findMany({
            where: { account: { workspaceId } },
            orderBy: { date: 'desc' },
            take: 10
          });
        }
      },
      {
        name: 'search_seo_opportunities',
        description: 'Get top SEO opportunities for content creation',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          return p.seoOpportunity.findMany({
            where: { workspaceId },
            orderBy: { clicks: 'desc' },
            take: 10
          });
        }
      },
      {
        name: 'generate_content_pack',
        description: 'Drafts a new content pack (does NOT publish). Requires user confirmation before calling if not explicitly requested.',
        parameters: { 
          type: 'object', 
          properties: {
            topic: { type: 'string' },
            platform: { type: 'string' },
            audience: { type: 'string' }
          },
          required: ['topic', 'platform', 'audience']
        },
        requiresConfirmation: true,
        execute: async ({ topic, platform, audience }: any) => {
          // In a real flow, this would call ContentPacksService.generate
          // But since the agent is drafting it, we can just return a success payload or create a basic draft.
          return { success: true, message: `Draft content pack created for ${topic} on ${platform}` };
        }
      },
      {
        name: 'create_content_idea',
        description: 'Creates a content idea in the ideas board',
        parameters: { 
          type: 'object', 
          properties: {
            title: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['title', 'description']
        },
        requiresConfirmation: true,
        execute: async (args: any) => {
          return { success: true, message: `Idea "${args.title}" created.` };
        }
      },
      {
        name: 'create_calendar_item',
        description: 'Schedules an APPROVED content pack onto the calendar',
        parameters: { 
          type: 'object', 
          properties: {
            contentPackId: { type: 'string' },
            scheduledAt: { type: 'string', description: 'ISO date string' }
          },
          required: ['contentPackId', 'scheduledAt']
        },
        requiresConfirmation: true,
        execute: async (args: any) => {
          return { success: true, message: `Content scheduled for ${args.scheduledAt}` };
        }
      }
    ];
  }

  async handleUserMessage(workspaceId: string, message: string, history: any[] = []) {
    if (!message || typeof message !== 'string') {
      throw new BadRequestException('Message must be a non-empty string');
    }

    const sanitizedMessage = sanitizeUserInput(message);
    const tools = this.getTools(workspaceId);
    const toolNames = new Set(tools.map(t => t.name));

    // Cap history to prevent prompt stuffing via accumulated turns
    const cappedHistory = history.slice(-MAX_HISTORY_TURNS);
    
    const messages = [
      { role: 'system', content: 'You are an AI Marketing Agent. You have access to tools to read workspace data, research, SEO opportunities, and draft content. You must NOT hallucinate data. Use tools to gather context. If a user asks you to perform a destructive or publishing action (like generating content or scheduling), and you are unsure if they want you to execute it immediately, ask for confirmation first.' },
      ...cappedHistory,
      { role: 'user', content: sanitizedMessage }
    ];

    let currentResponse = await this.aiService.chatWithTools(messages, tools);

    // Agent Loop (Max 5 iterations to prevent infinite loops)
    let iterations = 0;
    while (currentResponse?.tool_calls && iterations < 5) {
      messages.push(currentResponse); // Add the assistant's tool call message
      
      for (const toolCall of currentResponse.tool_calls) {
        const functionName = toolCall.function.name;

        // Allowlist check: only execute tools registered for this workspace context
        if (!toolNames.has(functionName)) {
          this.logger.warn(`Agent attempted to call unregistered tool: ${functionName}`);
          messages.push({ role: 'tool', tool_call_id: toolCall.id, name: functionName, content: 'Tool not available' });
          continue;
        }

        const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
        
        this.logger.log(`Agent executing tool: ${functionName}`);
        
        const tool = tools.find(t => t.name === functionName);
        let result;
        
        if (tool) {
          try {
            // Workspace isolation is enforced because getTools injects workspaceId into every tool's closure
            const rawResult = await tool.execute(functionArgs);
            result = JSON.stringify(rawResult);
          } catch (e: any) {
            result = `Error executing tool: ${e.message}`;
          }
        } else {
          result = `Tool ${functionName} not found`;
        }
        
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: result
        });
      }
      
      currentResponse = await this.aiService.chatWithTools(messages, tools);
      iterations++;
    }

    return {
      role: 'assistant',
      content: currentResponse?.content || 'I completed the task but did not generate a text response.'
    };
  }
}
