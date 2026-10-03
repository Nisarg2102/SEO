import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GscAnalyticsAdapter, AnalyticsProvider } from '@ai-marketing/analytics';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getProvider(sourceName: string): AnalyticsProvider {
    if (sourceName === 'google_search_console') {
      return new GscAnalyticsAdapter();
    }
    throw new Error(`Unsupported analytics source: ${sourceName}`);
  }

  async getDashboardData(workspaceId: string) {
    const p = this.prisma as any;
    
    // Get all accounts for this workspace
    const accounts = await p.analyticsAccount.findMany({
      where: { workspaceId },
      include: { source: true }
    });

    if (accounts.length === 0) {
      return { snapshots: [], postMetrics: [] };
    }
    
    const accountIds = accounts.map((a: any) => a.id);

        const snapshots = await p.analyticsSnapshot.findMany({
      where: { accountId: { in: accountIds } },
      orderBy: { date: 'asc' }
    });

    const postMetrics = await p.postMetric.findMany({
      where: { accountId: { in: accountIds } },
      orderBy: { clicks: 'desc' },
      take: 10
    });

    const totalClicks = snapshots.reduce((acc: number, curr: any) => acc + (curr.clicks || 0), 0);
    const totalImpressions = snapshots.reduce((acc: number, curr: any) => acc + (curr.impressions || 0), 0);

    let sumPosition = 0;
    let sumCtr = 0;
    let count = 0;
    snapshots.forEach((s: any) => {
      if (s.metadata) {
        try {
          const meta = JSON.parse(s.metadata);
          if (meta.position) { sumPosition += meta.position; count++; }
          if (meta.ctr) { sumCtr += meta.ctr; }
        } catch(e) {}
      }
    });

    return { 
      totalClicks, 
      totalImpressions, 
      averagePosition: count > 0 ? sumPosition / count : null,
      averageCtr: count > 0 ? sumCtr / count : null,
      snapshots, 
      recentMetrics: postMetrics 
    };
  }

  async syncAccount(accountId: string) {
    const p = this.prisma as any;
    const account = await p.analyticsAccount.findUnique({
      where: { id: accountId },
      include: { source: true }
    });

    if (!account) throw new Error('Account not found');

    const provider = this.getProvider(account.source.name);
    const config = account.config ? JSON.parse(account.config) : {};

    // Get integration token if needed (assuming GSC)
    if (account.source.name === 'google_search_console') {
      const integration = await p.integration.findFirst({
        where: { workspaceId: account.workspaceId, provider: 'google_search_console' }
      });
      if (integration) {
        config.accessToken = integration.accessToken;
      }
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    try {
      const snapshots = await provider.getAccountSnapshots(config, startDate, endDate);
      const postMetrics = await provider.getPostMetrics(config, startDate, endDate);

      for (const snap of snapshots) {
        await p.analyticsSnapshot.upsert({
          where: {
            accountId_date: { accountId: account.id, date: snap.date }
          },
          update: {
            impressions: snap.impressions,
            reach: snap.reach,
            views: snap.views,
            likes: snap.likes,
            comments: snap.comments,
            shares: snap.shares,
            saves: snap.saves,
            clicks: snap.clicks,
            conversions: snap.conversions,
            metadata: JSON.stringify(snap.metadata)
          },
          create: {
            accountId: account.id,
            date: snap.date,
            impressions: snap.impressions,
            reach: snap.reach,
            views: snap.views,
            likes: snap.likes,
            comments: snap.comments,
            shares: snap.shares,
            saves: snap.saves,
            clicks: snap.clicks,
            conversions: snap.conversions,
            metadata: JSON.stringify(snap.metadata)
          }
        });
      }

      for (const post of postMetrics) {
        if (!post.externalId) continue;
        await p.postMetric.upsert({
          where: {
            accountId_externalId_date: { accountId: account.id, externalId: post.externalId, date: post.date }
          },
          update: {
            impressions: post.impressions,
            reach: post.reach,
            views: post.views,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            saves: post.saves,
            clicks: post.clicks,
            conversions: post.conversions,
            metadata: JSON.stringify(post.metadata)
          },
          create: {
            accountId: account.id,
            externalId: post.externalId,
            externalUrl: post.externalUrl,
            date: post.date,
            impressions: post.impressions,
            reach: post.reach,
            views: post.views,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            saves: post.saves,
            clicks: post.clicks,
            conversions: post.conversions,
            metadata: JSON.stringify(post.metadata)
          }
        });
      }

      return { success: true, snapshotsCount: snapshots.length, postsCount: postMetrics.length };
    } catch (e) {
      this.logger.error(`Failed to sync analytics for account ${accountId}`, e);
      throw e;
    }
  }
}
