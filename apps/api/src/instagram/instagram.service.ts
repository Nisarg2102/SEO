import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { z } from 'zod';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  getAuthUrl(workspaceId: string): string {
    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_CALLBACK_URL;
    const configId = process.env.META_LOGIN_CONFIG_ID;
    
    if (!appId || !redirectUri || !configId) {
      throw new Error('Meta API or Login Config ID not configured');
    }

    const state = workspaceId;
    
    // Facebook Login for Business requires config_id instead of scope
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&display=page&extras={"setup":{"channel":"IG_API_ONBOARDING"}}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&config_id=${configId}&state=${state}`;
  }

  async handleCallback(code: string, workspaceId: string) {
    if (process.env.NODE_ENV === 'test' || !process.env.META_APP_ID) {
      await (this.prisma as any).withWorkspace(workspaceId).integration.upsert({
        where: { workspaceId_provider: { workspaceId, provider: 'instagram' } },
        create: {
          workspaceId,
          provider: 'instagram',
          accessToken: 'mock_token',
          config: JSON.stringify({ username: 'mock_user' })
        },
        update: {
          accessToken: 'mock_token',
          config: JSON.stringify({ username: 'mock_user' })
        }
      });
      return;
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_CALLBACK_URL;

    // Exchange code for short-lived token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&client_secret=${appSecret}&code=${code}`);
    if (!tokenRes.ok) throw new Error('Failed to exchange token');
    const tokenData = await tokenRes.json();
    let accessToken = tokenData.access_token;

    // Exchange for long-lived token
    const longLivedRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`);
    if (longLivedRes.ok) {
      const longLivedData = await longLivedRes.json();
      accessToken = longLivedData.access_token;
    }

    // Get Pages and IG Account
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
    if (!pagesRes.ok) throw new Error('Failed to fetch pages');
    const pagesData = await pagesRes.json();
    
    let igAccountId = null;
    let igUsername = null;

    for (const page of pagesData.data) {
      const igRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
      if (igRes.ok) {
        const igData = await igRes.json();
        if (igData.instagram_business_account) {
          igAccountId = igData.instagram_business_account.id;
          
          // Get username
          const userRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}?fields=username&access_token=${accessToken}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            igUsername = userData.username;
          }
          break;
        }
      }
    }

    if (!igAccountId) {
      throw new Error('No Instagram Professional account found');
    }

    await (this.prisma as any).withWorkspace(workspaceId).integration.upsert({
      where: { workspaceId_provider: { workspaceId, provider: 'instagram' } },
      create: {
        workspaceId,
        provider: 'instagram',
        accessToken,
        config: JSON.stringify({ igAccountId, username: igUsername })
      },
      update: {
        accessToken,
        config: JSON.stringify({ igAccountId, username: igUsername })
      }
    });
  }

  async getStatus(workspaceId: string) {
    const integration = await (this.prisma as any).integration.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: 'instagram' } }
    });

    let config = null;
    if (integration?.config) {
      try { config = JSON.parse(integration.config); } catch {}
    }

    return {
      connected: !!integration,
      username: config?.username
    };
  }

  async sync(workspaceId: string) {
    const integration = await (this.prisma as any).integration.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: 'instagram' } }
    });

    if (!integration) throw new Error('Not connected');

    if (process.env.NODE_ENV === 'test' || !process.env.META_APP_ID) {
      return { success: true, mock: true };
    }

    let config;
    try { config = JSON.parse(integration.config); } catch {}
    if (!config?.igAccountId) throw new Error('Missing IG Account ID');

    const igAccountId = config.igAccountId;
    const accessToken = integration.accessToken;

    // Fetch media
    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&access_token=${accessToken}&limit=50`);
    
    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      
      for (const item of mediaData.data) {
        // Upsert content
        const content = await (this.prisma as any).withWorkspace(workspaceId).socialContent.upsert({
          where: { workspaceId_provider_providerContentId: { workspaceId, provider: 'instagram', providerContentId: item.id } },
          create: {
            workspaceId,
            integrationId: integration.id,
            provider: 'instagram',
            providerContentId: item.id,
            contentType: item.media_type,
            caption: item.caption,
            permalink: item.permalink,
            mediaUrl: item.media_url,
            thumbnailUrl: item.thumbnail_url,
            publishedAt: new Date(item.timestamp)
          },
          update: {
            caption: item.caption,
            mediaUrl: item.media_url,
            thumbnailUrl: item.thumbnail_url,
          }
        });

        // Add metric snapshot
        await (this.prisma as any).socialContentMetric.create({
          data: {
            workspaceId,
            contentId: content.id,
            collectedAt: new Date(),
            likes: item.like_count || 0,
            comments: item.comments_count || 0
          }
        });
      }
    }

    // Fetch account insights (reach, impressions) - basic snapshot
    const insightsRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/insights?metric=impressions,reach&period=day&access_token=${accessToken}`);
    if (insightsRes.ok) {
      const insightsData = await insightsRes.json();
      for (const metric of insightsData.data) {
        if (metric.values && metric.values.length > 0) {
          const value = metric.values[metric.values.length - 1].value;
          await (this.prisma as any).socialAccountMetric.create({
            data: {
              workspaceId,
              integrationId: integration.id,
              collectedAt: new Date(),
              metricName: metric.name,
              metricValue: value
            }
          });
        }
      }
    }

    return { success: true };
  }

  async getTopContent(workspaceId: string) {
    const contents = await (this.prisma as any).socialContent.findMany({
      where: { workspaceId },
      include: {
        metrics: {
          orderBy: { collectedAt: 'desc' },
          take: 1
        }
      }
    });

    return contents.map((c: any) => {
      const m = c.metrics[0] || { likes: 0, comments: 0 };
      return {
        ...c,
        metrics: m,
        totalEngagement: m.likes + m.comments
      };
    }).sort((a: any, b: any) => b.totalEngagement - a.totalEngagement).slice(0, 10);
  }

  async getInsights(workspaceId: string) {
    const accountMetrics = await (this.prisma as any).socialAccountMetric.findMany({
      where: { workspaceId },
      orderBy: { collectedAt: 'desc' },
      take: 14 // last 14 records roughly
    });

    const reach = accountMetrics.filter((m: any) => m.metricName === 'reach');
    const impressions = accountMetrics.filter((m: any) => m.metricName === 'impressions');

    return {
      recentReach: reach[0]?.metricValue || 0,
      recentImpressions: impressions[0]?.metricValue || 0,
      history: { reach, impressions }
    };
  }

  async analyze(workspaceId: string) {
    const topContent = await this.getTopContent(workspaceId);
    if (topContent.length === 0) throw new Error('No content available for analysis');

    const prompt = `
Analyze the following Instagram content for patterns and insights.
Do NOT invent any metrics. Use ONLY the provided data.
Provide a professional marketing analysis.

CONTENT DATA:
${JSON.stringify(topContent.map((c: any) => ({
  caption: c.caption,
  type: c.contentType,
  likes: c.metrics.likes,
  comments: c.metrics.comments,
  date: c.publishedAt
})), null, 2)}
`;

    const schema = z.object({
      summary: z.string(),
      topPerformingContent: z.array(z.string()),
      successfulTopics: z.array(z.string()),
      contentPatterns: z.array(z.string()),
      recommendations: z.array(z.string())
    });

    return this.aiService.generateStructuredOutput(prompt, schema, 'InstagramAnalysis');
  }

  async disconnect(workspaceId: string) {
    await (this.prisma as any).integration.deleteMany({
      where: { workspaceId, provider: 'instagram' }
    });
    return { success: true };
  }
}
