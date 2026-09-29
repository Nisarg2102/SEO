import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { z } from 'zod';
import { Client } from '@upstash/qstash';

export interface RawMetric {
  url: string;
  keyword: string;
  impressions: number;
  clicks: number;
  position: number;
}

export const OPPORTUNITY_TYPES = {
  LOW_CTR: 'LOW_CTR',
  CONTENT_GAP: 'CONTENT_GAP',
  KEYWORD_OPPORTUNITY: 'KEYWORD_OPPORTUNITY',
  PAGE_OPTIMIZATION: 'PAGE_OPTIMIZATION',
  RANKING_OPPORTUNITY: 'RANKING_OPPORTUNITY',
} as const;

// We use an AI schema to structure the recommendation
const OpportunityRecommendationSchema = z.object({
  explanation: z.string().describe('Clear explanation of why this metrics profile represents an opportunity'),
  titleSuggestion: z.string().describe('A suggested title tag improvement'),
  metaDescriptionSuggestion: z.string().describe('A suggested meta description improvement'),
  contentRecommendation: z.string().describe('A suggestion for content changes (e.g. adding FAQs, updating formatting)'),
});

@Injectable()
export class SeoOpportunitiesService {
  private readonly logger = new Logger(SeoOpportunitiesService.name);
  private readonly qstash = new Client({ token: process.env.QSTASH_TOKEN || '' });

  // Configurable Thresholds from Env
  private readonly MIN_IMPRESSIONS = parseInt(process.env.SEO_OPPORTUNITY_MIN_IMPRESSIONS || '1000', 10);
  private readonly MAX_CTR = parseFloat(process.env.SEO_OPPORTUNITY_MAX_CTR || '2.5');
  private readonly MIN_POSITION = parseFloat(process.env.SEO_OPPORTUNITY_MIN_POSITION || '1');
  private readonly MAX_POSITION = parseFloat(process.env.SEO_OPPORTUNITY_MAX_POSITION || '20');

  constructor(
    private prisma: PrismaService,
    private aiService: AiService
  ) {}

  async findAll(workspaceId: string, filters?: { type?: string; priority?: string }) {
    const where: Record<string, unknown> = { workspaceId };
    if (filters?.type) where.opportunityType = filters.type;
    if (filters?.priority) where.priority = filters.priority;

    return (this.prisma as any).seoOpportunity.findMany({
      where,
      orderBy: [
        { priority: 'asc' }, // high priority first if mapped alphabetically? Actually let's just order by impressions desc as priority is enum/string
        { impressions: 'desc' }
      ]
    });
  }

  async analyzeMetrics(workspaceId: string, metrics: RawMetric[]) {
    const appUrl = process.env.API_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
    const res = await this.qstash.publishJSON({
      url: `${appUrl}/internal/queues/seo/analyze-metrics`,
      body: { workspaceId, metrics }
    });
    return { success: true, jobId: res.messageId, message: 'Analysis queued successfully' };
  }

  async convertToIdea(workspaceId: string, opportunityId: string) {
    const p = this.prisma as any;
    const opp = await p.seoOpportunity.findFirst({
      where: { id: opportunityId, workspaceId }
    });

    if (!opp) throw new NotFoundException('Opportunity not found');

    const idea = await p.contentIdea.create({
      data: {
        workspaceId,
        title: `Optimize ${opp.url} for "${opp.keyword}"`,
        topic: opp.keyword,
        audience: 'Target Audience',
        intent: 'informational', // Could be dynamic
        status: 'draft',
        confidence: 0.9,
        seoOpportunityId: opp.id
      }
    });

    return idea;
  }

  async analyzeMetricsBackground(workspaceId: string, metrics: RawMetric[]) {
    const p = this.prisma as any;
    let createdCount = 0;

    for (const metric of metrics) {
      const ctr = metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : 0;
      
      // Rule 1: High impressions + low CTR + reasonable avg position (LOW_CTR / PAGE_OPTIMIZATION)
      if (
        metric.impressions >= this.MIN_IMPRESSIONS && 
        ctr <= this.MAX_CTR && 
        metric.position >= this.MIN_POSITION && 
        metric.position <= this.MAX_POSITION
      ) {
        
        // Prevent duplicate opportunity for same URL + keyword
        const existing = await p.seoOpportunity.findFirst({
          where: { workspaceId, url: metric.url, keyword: metric.keyword }
        });
        
        if (existing) continue;

        // Ask AI to explain and suggest improvements based on the raw metrics
        const prompt = `Analyze this SEO opportunity:
Keyword: "${metric.keyword}"
URL: ${metric.url}
Impressions: ${metric.impressions}
Clicks: ${metric.clicks}
CTR: ${ctr.toFixed(2)}%
Average Position: ${metric.position}

This page gets high impressions but low CTR despite ranking reasonably well.
Generate a structured recommendation for improving the title, meta description, and content to capture this lost traffic. Do NOT invent traffic numbers or search volumes that aren't provided.`;

        try {
          const aiRec = await this.aiService.generateStructuredOutput(prompt, OpportunityRecommendationSchema, 'SeoOpportunity');
          
          // Format recommendation gracefully
          const recommendation = `${aiRec.explanation}\n\nTitle Suggestion: ${aiRec.titleSuggestion}\nMeta Suggestion: ${aiRec.metaDescriptionSuggestion}\nContent: ${aiRec.contentRecommendation}`;

          await p.seoOpportunity.create({
            data: {
              workspaceId,
              url: metric.url,
              keyword: metric.keyword,
              impressions: metric.impressions,
              clicks: metric.clicks,
              ctr: parseFloat(ctr.toFixed(2)),
              averagePosition: metric.position,
              opportunityType: OPPORTUNITY_TYPES.LOW_CTR,
              recommendation,
              priority: 'high'
            }
          });
          createdCount++;
        } catch (error) {
          this.logger.error(`AI Analysis failed for keyword ${metric.keyword}`, error);
          // If AI fails, we still want to log the opportunity with a generic fallback recommendation
          await p.seoOpportunity.create({
            data: {
              workspaceId,
              url: metric.url,
              keyword: metric.keyword,
              impressions: metric.impressions,
              clicks: metric.clicks,
              ctr: parseFloat(ctr.toFixed(2)),
              averagePosition: metric.position,
              opportunityType: OPPORTUNITY_TYPES.LOW_CTR,
              recommendation: `High impressions (${metric.impressions}) but low CTR (${ctr.toFixed(1)}%). Ranking at position ${metric.position}. Consider rewriting the Title and Meta Description to improve click-through rate.`,
              priority: 'high'
            }
          });
          createdCount++;
        }
      }
    }

    return { success: true, createdCount };
  }
}
