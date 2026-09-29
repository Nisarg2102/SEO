import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { z } from 'zod';

const Parser = require('rss-parser');

// ─── AI Output Schema ────────────────────────────────────────────────────────
// NOTE: We deliberately avoid the word "trending" unless backed by hard data.
// The relevanceReason field must use terms like "research opportunity",
// "emerging topic", "frequently observed topic", or "relevant industry topic".
const ResearchAnalysisSchema = z.object({
  topic: z.string().min(1).max(200).describe('The main topic identified in the article'),
  summary: z.string().min(10).max(1000).describe('A 2-3 sentence summary of the article'),
  audience: z.string().min(1).max(200).describe('The implied target audience for this content'),
  intent: z.string().min(1).max(100).describe('The intent of the article (e.g. informational, commercial, news)'),
  relevanceReason: z
    .string()
    .min(10)
    .max(500)
    .describe(
      'Why this is a research opportunity. Use terms like "research opportunity", "emerging topic", or "relevant industry topic". Do NOT use "trending" unless the article contains hard data supporting that claim.',
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score from 0.0 to 1.0 about the quality/relevance of this data'),
  suggestedContentFormats: z
    .array(z.string().min(1).max(100))
    .min(1)
    .max(10)
    .describe('List of content formats this could be turned into (e.g. ["Blog Post", "LinkedIn Carousel"])'),
});

type ResearchAnalysis = z.infer<typeof ResearchAnalysisSchema>;

export interface ResearchItemFilters {
  sourceId?: string;
  topic?: string;
  search?: string;
  minConfidence?: number;
  fromDate?: Date;
  toDate?: Date;
}

@Injectable()
export class ResearchService {
  private readonly logger = new Logger(ResearchService.name);
  private rssParser = new Parser({ timeout: 10000 }); // 10s timeout

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async findAll(workspaceId: string, filters: ResearchItemFilters = {}) {
    const where: Record<string, unknown> = { workspaceId };

    if (filters.sourceId) where['sourceId'] = filters.sourceId;
    if (filters.topic) where['topic'] = { contains: filters.topic, mode: 'insensitive' };
    if (filters.minConfidence !== undefined) where['confidence'] = { gte: filters.minConfidence };
    if (filters.fromDate || filters.toDate) {
      where['publishedAt'] = {
        ...(filters.fromDate ? { gte: filters.fromDate } : {}),
        ...(filters.toDate ? { lte: filters.toDate } : {}),
      };
    }
    if (filters.search) {
      where['OR'] = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
        { topic: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return (this.prisma as any).researchItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        source: { select: { id: true, name: true, url: true, sourceType: true, sourceTier: true } },
      },
      take: 100, // hard limit — avoid unbounded queries
    });
  }

  async findOne(workspaceId: string, id: string) {
    const item = await (this.prisma as any).researchItem.findFirst({
      where: { id, workspaceId },
      include: {
        source: true,
        contentIdeas: { select: { id: true, title: true, status: true, createdAt: true } },
      },
    });
    if (!item) throw new NotFoundException('Research item not found');
    return item;
  }

  // Called by the ResearchProcessor worker — processes one workspace at a time
  async sync(workspaceId: string) {
    const sources = await (this.prisma as any).source.findMany({
      where: { workspaceId, active: true },
    });

    let newItemsCount = 0;
    let failedSources = 0;

    for (const source of sources) {
      const supported = ['rss', 'atom'];
      if (!supported.includes(source.sourceType)) {
        this.logger.log(`Skipping source ${source.id} (type="${source.sourceType}" not yet supported for auto-collection)`);
        continue;
      }

      try {
        const count = await this.collectFromFeed(workspaceId, source);
        newItemsCount += count;
      } catch (error) {
        failedSources++;
        // One bad source must not fail the entire job
        this.logger.error(
          `Failed to collect from source "${source.name}" (${source.url}): ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Sync complete for workspace ${workspaceId}. New items: ${newItemsCount}, failed sources: ${failedSources}`,
    );
    return { success: true, newItemsCount, failedSources };
  }

  // Called by syncAll to fan out per-workspace (used from n8n webhook processor)
  async syncAll() {
    const workspaces = await (this.prisma as any).workspace.findMany({ select: { id: true } });
    let totalSynced = 0;

    for (const ws of workspaces) {
      try {
        const result = await this.sync(ws.id);
        totalSynced += result.newItemsCount;
      } catch (error) {
        this.logger.error(`Failed to sync workspace ${ws.id}: ${(error as Error).message}`);
      }
    }

    return { success: true, totalSynced };
  }

  private async collectFromFeed(workspaceId: string, source: { id: string; url: string; name: string }): Promise<number> {
    let feed: { items?: Array<{ link?: string; title?: string; contentSnippet?: string; content?: string; pubDate?: string }> };

    try {
      feed = await this.rssParser.parseURL(source.url);
    } catch (error) {
      throw new Error(`Cannot parse feed: ${(error as Error).message}`);
    }

    const items = feed.items || [];
    if (items.length === 0) {
      this.logger.log(`Feed "${source.name}" returned 0 items`);
      return 0;
    }

    let newItemsCount = 0;

    for (const item of items) {
      if (!item.link) continue;

      // Normalize URL for idempotency — strip trailing slashes
      const normalizedUrl = item.link.replace(/\/$/, '');

      // Check for duplicate using the unique constraint (workspaceId, url)
      const existing = await (this.prisma as any).researchItem.findUnique({
        where: { workspaceId_url: { workspaceId, url: normalizedUrl } },
        select: { id: true },
      });
      if (existing) continue;

      const analysis = await this.analyzeItem(item.title, normalizedUrl, item.contentSnippet || item.content);
      if (!analysis) continue; // AI failure — skip this item, don't fail the batch

      try {
        await (this.prisma as any).researchItem.create({
          data: {
            workspaceId,
            sourceId: source.id,
            title: item.title || 'Untitled',
            url: normalizedUrl,
            summary: analysis.summary,
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
            confidence: analysis.confidence,
            intent: analysis.intent,
            status: 'new',
            topic: analysis.topic,
            audience: analysis.audience,
            relevanceReason: analysis.relevanceReason,
            suggestedContentFormats: JSON.stringify(analysis.suggestedContentFormats),
          },
        });
        newItemsCount++;
      } catch (dbError) {
        // Could be a race condition — another process inserted the same URL simultaneously
        this.logger.warn(`Could not insert research item for URL ${normalizedUrl}: ${(dbError as Error).message}`);
      }
    }

    return newItemsCount;
  }

  private async analyzeItem(
    title: string | undefined,
    url: string,
    snippet: string | undefined,
  ): Promise<ResearchAnalysis | null> {
    const prompt = `You are an SEO and content marketing analyst. Analyze the following article data and extract structured insights for a content team.

Title: ${title || 'Unknown'}
URL: ${url}
Content snippet: ${snippet || 'Not available'}

IMPORTANT RULES:
- Do NOT use the word "trending" unless the article provides hard data (e.g., statistics, percentage growth).
- Use "research opportunity", "emerging topic", "frequently observed topic", or "relevant industry topic" instead.
- Keep all text fields concise and professional.
- The confidence score should reflect the quality and completeness of the available data (0.0 = very poor, 1.0 = excellent).`;

    try {
      const result = await this.aiService.generateStructuredOutput(
        prompt,
        ResearchAnalysisSchema,
        'ResearchAnalysis',
      );

      // Validate the parsed result once more before accepting it
      const validated = ResearchAnalysisSchema.safeParse(result);
      if (!validated.success) {
        this.logger.warn(`AI returned invalid schema for item ${url}: ${validated.error.message}`);
        return null;
      }

      return validated.data;
    } catch (error) {
      this.logger.error(`AI analysis failed for item ${url}: ${(error as Error).message}`);
      return null;
    }
  }

  async convertToIdea(workspaceId: string, id: string, title?: string) {
    const item = await (this.prisma as any).researchItem.findFirst({
      where: { id, workspaceId }, // strict workspace ownership
    });
    if (!item) throw new NotFoundException('Research item not found');

    const idea = await (this.prisma as any).contentIdea.create({
      data: {
        workspaceId,
        researchItemId: item.id,
        title: title || item.topic || item.title,
        topic: item.topic || '',
        audience: item.audience || '',
        intent: item.intent || 'informational',
        status: 'draft',
        confidence: item.confidence,
      },
    });

    await (this.prisma as any).researchItem.update({
      where: { id },
      data: { status: 'converted' },
    });

    return idea;
  }
}
