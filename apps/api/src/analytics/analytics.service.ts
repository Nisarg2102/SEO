import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  private parseDates(start?: string, end?: string) {
    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  }

  async getOverview(workspaceId: string, start?: string, end?: string) {
    const { startDate, endDate } = this.parseDates(start, end);

    const metrics = await this.prisma.gscMetric.findMany({
      where: {
        workspaceId,
        date: { gte: startDate, lte: endDate },
      },
    });

    if (metrics.length === 0) {
      return { hasData: false, summary: null, trends: [] };
    }

    let totalClicks = 0;
    let totalImpressions = 0;
    let sumPosition = 0;
    let sumCtr = 0;

    const trendsMap = new Map<string, any>();

    for (const m of metrics) {
      totalClicks += m.clicks;
      totalImpressions += m.impressions;
      sumPosition += m.position;
      sumCtr += m.ctr;

      const dString = m.date.toISOString().split('T')[0];
      if (!trendsMap.has(dString)) {
        trendsMap.set(dString, { date: dString, clicks: 0, impressions: 0 });
      }
      const day = trendsMap.get(dString)!;
      day.clicks += m.clicks;
      day.impressions += m.impressions;
    }

    const trends = Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      hasData: true,
      summary: {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: totalImpressions > 0 ? (sumCtr / metrics.length) : 0,
        averagePosition: metrics.length > 0 ? (sumPosition / metrics.length) : 0,
      },
      trends,
    };
  }

  async getSeoMetrics(workspaceId: string, start?: string, end?: string) {
    return this.getOverview(workspaceId, start, end);
  }

  async getKeywords(workspaceId: string, start?: string, end?: string) {
    const { startDate, endDate } = this.parseDates(start, end);

    const metrics = await this.prisma.gscMetric.groupBy({
      by: ['query'],
      where: { workspaceId, date: { gte: startDate, lte: endDate } },
      _sum: { clicks: true, impressions: true },
      _avg: { position: true, ctr: true },
      orderBy: { _sum: { clicks: 'desc' } },
      take: 50,
    });

    return metrics.map(m => ({
      query: m.query,
      clicks: m._sum.clicks || 0,
      impressions: m._sum.impressions || 0,
      position: m._avg.position || 0,
      ctr: m._avg.ctr || 0,
      trend: 'Stable', // Simplified trend without secondary date math
    }));
  }

  async getPages(workspaceId: string, start?: string, end?: string) {
    const { startDate, endDate } = this.parseDates(start, end);

    const metrics = await this.prisma.gscMetric.groupBy({
      by: ['page'],
      where: { workspaceId, date: { gte: startDate, lte: endDate } },
      _sum: { clicks: true, impressions: true },
      _avg: { position: true, ctr: true },
      orderBy: { _sum: { clicks: 'desc' } },
      take: 50,
    });

    return metrics.map(m => ({
      page: m.page,
      clicks: m._sum.clicks || 0,
      impressions: m._sum.impressions || 0,
      position: m._avg.position || 0,
      ctr: m._avg.ctr || 0,
    }));
  }

  async getOpportunities(workspaceId: string, start?: string, end?: string) {
    const pages = await this.getPages(workspaceId, start, end);

    const opportunities = [];

    for (const p of pages) {
      if (p.impressions > 500 && p.ctr < 0.02) {
        opportunities.push({
          type: 'Low CTR',
          description: `High impressions but low CTR. Potential title/meta improvement.`,
          page: p.page,
          metrics: { impressions: p.impressions, ctr: p.ctr }
        });
      }
      if (p.impressions > 100 && p.position >= 11 && p.position <= 25) {
        opportunities.push({
          type: 'Striking Distance',
          description: `Ranking on page 2 or 3 with decent impressions. Optimization could push to page 1.`,
          page: p.page,
          metrics: { impressions: p.impressions, position: p.position }
        });
      }
    }

    return opportunities;
  }

  async getTechnical(workspaceId: string) {
    const audit = await this.prisma.seoAudit.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    if (!audit) return { hasData: false };

    return {
      hasData: true,
      lastAuditDate: audit.createdAt,
      pagesCrawled: audit.pagesCrawled,
      criticalIssues: audit.criticalCount,
      warnings: audit.warningCount,
      passed: audit.passedCount,
    };
  }

  async getLinks(workspaceId: string) {
    const audit = await this.prisma.seoAudit.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });

    if (!audit) return { hasData: false, message: 'Complete backlink discovery is not available from the current free data sources.' };

    const internalCount = await this.prisma.seoLink.count({ where: { auditId: audit.id, linkType: 'INTERNAL' } });
    const externalCount = await this.prisma.seoLink.count({ where: { auditId: audit.id, linkType: 'EXTERNAL' } });
    const brokenCount = await this.prisma.seoLink.count({ where: { auditId: audit.id, statusCode: { gte: 400 } } });

    return {
      hasData: true,
      message: 'Complete backlink discovery is not available from the current free data sources.',
      internalLinks: internalCount,
      externalLinks: externalCount,
      brokenLinks: brokenCount,
    };
  }

  async getContent(workspaceId: string) {
    const briefs = await this.prisma.seoContentBrief.count({ where: { workspaceId } });
    const drafts = await this.prisma.seoContentDraft.count({ where: { workspaceId } });
    const analyses = await this.prisma.seoContentAnalysis.count({ where: { workspaceId } });

    return {
      briefs,
      drafts,
      analyses,
    };
  }

  async getSocial(workspaceId: string) {
    const posts = await this.prisma.socialPost.groupBy({
      by: ['platform', 'status'],
      where: { workspaceId },
      _count: { id: true }
    });

    const summary = posts.map(p => ({
      platform: p.platform,
      status: p.status,
      count: p._count.id
    }));

    return {
      hasData: summary.length > 0,
      posts: summary,
      message: 'Social performance metrics are not currently available from the connected provider.'
    };
  }

  async generateInsights(workspaceId: string, start?: string, end?: string) {
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const overview = await this.getOverview(workspaceId, start, end);
    const opps = await this.getOpportunities(workspaceId, start, end);

    let safety = '';
    if (workspace.type === 'psychiatrist' || workspace.type === 'medical') {
      safety = `
MEDICAL SAFETY RULES MUST BE FOLLOWED:
- Do NOT generate medical advice.
- Do NOT evaluate patients.
- Do NOT infer patient health information.
- Provide analytics strictly about traffic, content, and publishing.
`;
    }

    const prompt = `
You are an expert Data Analyst. Produce a short Performance Summary and Recommended Next Actions based ONLY on the provided JSON data.

Do not invent metrics, search volume, or keyword difficulty.
State facts based only on the numbers.
${safety}

DATA:
Overview: ${JSON.stringify(overview.summary)}
Opportunities: ${JSON.stringify(opps.slice(0, 5))}
    `;

    const schema = z.object({
      summary: z.string().describe('2-3 sentence performance summary.'),
      recommendedActions: z.array(z.string()).describe('2-3 bullet points for next actions.')
    });

    return this.aiService.generateStructuredOutput<{summary: string, recommendedActions: string[]}>(prompt, schema, 'AnalyticsInsightsSchema');
  }
}
