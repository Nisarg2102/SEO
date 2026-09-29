import { AIProvider, GenerateTextOptions, ChatMessage, AITool } from './provider.interface';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`OpenAI generateText failed: ${(error as any).message}`);
    }
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: z.Schema<T>,
    schemaName: string,
    options?: GenerateTextOptions
  ): Promise<T> {
    try {
      const jsonSchema = zodToJsonSchema(schema as any, schemaName) as any;
      // We pass the JSON schema inside the functions format to enforce structured output
      const response = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.2,
        tools: [
          {
            type: 'function',
            function: {
              name: `extract_${schemaName}`,
              description: `Extract structured data for ${schemaName}`,
              parameters: jsonSchema.definitions[schemaName],
            },
          },
        ],
        tool_choice: {
          type: 'function',
          function: { name: `extract_${schemaName}` },
        },
      });

      const toolCall = response.choices[0]?.message?.tool_calls?.[0] as any;
      if (!toolCall) {
        throw new Error('No structured output returned');
      }

      const parsedArgs = JSON.parse(toolCall.function.arguments);
      
      // Validate the response through Zod
      return schema.parse(parsedArgs);
    } catch (error) {
      throw new Error(`OpenAI generateStructuredOutput failed: ${(error as any).message}`);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0]?.embedding || [];
    } catch (error) {
      throw new Error(`OpenAI generateEmbedding failed: ${(error as any).message}`);
    }
  }

  async chatWithTools(messages: any[], tools: any[], options?: GenerateTextOptions): Promise<any> {
    try {
      const formattedTools = tools.length > 0 ? tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        }
      })) : undefined;

      const response = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages,
        tools: formattedTools as any,
        temperature: options?.temperature ?? 0.7,
      });

      return response.choices[0]?.message;
    } catch (error) {
      throw new Error(`OpenAI chatWithTools failed: ${(error as any).message}`);
    }
  }
}
