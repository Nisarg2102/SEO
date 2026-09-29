import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { z } from 'zod';

const ReportSchema = z.object({
  bestPerformingContent: z.array(z.string()).describe('List of best-performing content pieces with reasons'),
  weakPerformingContent: z.array(z.string()).describe('List of weak-performing content pieces with reasons'),
  observedPatterns: z.array(z.string()).describe('Patterns observed in the performance data. Use careful language: say "Posts in this sample received higher average saves" instead of "This format causes more saves."'),
  seoOpportunities: z.array(z.string()).describe('Identified SEO opportunities'),
  contentRefreshOpportunities: z.array(z.string()).describe('Old content that could be updated or repurposed'),
  suggestedExperiments: z.array(z.string()).describe('New content formats or topics to test'),
  nextWeekIdeas: z.array(z.string()).describe('Content ideas for next week')
});

@Injectable()
export class AiReportsService {
  private readonly logger = new Logger(AiReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  async generateWeeklyReport(workspaceId: string) {
    const p = this.prisma as any;
    
    const weekEndDate = new Date();
    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - 7);

    // Collect Data
    const postMetrics = await p.postMetric.findMany({
      where: { 
        date: { gte: weekStartDate, lte: weekEndDate },
        account: { workspaceId }
      },
      include: { account: true }
    });

    const seoOpps = await p.seoOpportunity.findMany({
      where: { workspaceId },
      take: 20,
      orderBy: { clicks: 'desc' }
    });

    // We shouldn't send massive arrays, we need to summarize for the AI.
    // For simplicity, serialize relevant fields.
    const performanceData = postMetrics.map((pm: any) => ({
      platform: pm.account.accountName,
      url: pm.externalUrl,
      impressions: pm.impressions,
      clicks: pm.clicks,
      likes: pm.likes,
      shares: pm.shares,
      saves: pm.saves
    }));

    const seoData = seoOpps.map((opp: any) => ({
      keyword: opp.keyword,
      url: opp.url,
      recommendation: opp.recommendation,
      impressions: opp.impressions,
      clicks: opp.clicks
    }));

    const prompt = `
      Analyze the following content performance data and SEO opportunities.
      Identify patterns. Do NOT present correlation as causation. Use language such as "Posts in this sample received higher average saves" instead of "This format causes more saves."
      
      Performance Data:
      ${JSON.stringify(performanceData)}
      
      SEO Opportunities:
      ${JSON.stringify(seoData)}
      
      Provide a comprehensive weekly report based on this data.
    `;

    const generated = await this.aiService.generateStructuredOutput(prompt, ReportSchema, 'WeeklyPerformanceReport');

    return p.weeklyReport.create({
      data: {
        workspaceId,
        weekStartDate,
        weekEndDate,
        bestPerformingContent: JSON.stringify(generated.bestPerformingContent),
        weakPerformingContent: JSON.stringify(generated.weakPerformingContent),
        observedPatterns: JSON.stringify(generated.observedPatterns),
        seoOpportunities: JSON.stringify(generated.seoOpportunities),
        contentRefreshOpportunities: JSON.stringify(generated.contentRefreshOpportunities),
        suggestedExperiments: JSON.stringify(generated.suggestedExperiments),
        nextWeekIdeas: JSON.stringify(generated.nextWeekIdeas)
      }
    });
  }

  async getReports(workspaceId: string) {
    const p = this.prisma as any;
    return p.weeklyReport.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getReport(workspaceId: string, id: string) {
    const p = this.prisma as any;
    return p.weeklyReport.findFirst({
      where: { workspaceId, id }
    });
  }
}
