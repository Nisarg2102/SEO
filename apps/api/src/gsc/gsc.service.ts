import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';
import { SeoOpportunitiesService } from '../seo-opportunities/seo-opportunities.service';

@Injectable()
export class GscService {
  private readonly logger = new Logger(GscService.name);
  
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
    process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/gsc/callback'
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly seoOppsService: SeoOpportunitiesService
  ) {}

  getAuthUrl(workspaceId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
      state: workspaceId,
    });
  }

  async handleCallback(code: string, workspaceId: string) {
    if (process.env.NODE_ENV === 'test' || !process.env.GOOGLE_CLIENT_ID) {
      // Mock for development
      await (this.prisma as any).withWorkspace(workspaceId).integration.upsert({
        where: { workspaceId_provider: { workspaceId, provider: 'google_search_console' } },
        create: {
          workspaceId,
          provider: 'google_search_console',
          accessToken: 'mock_token',
          refreshToken: 'mock_refresh',
          expiresAt: new Date(Date.now() + 3600000)
        },
        update: {
          accessToken: 'mock_token',
          refreshToken: 'mock_refresh',
          expiresAt: new Date(Date.now() + 3600000)
        }
      });
      return;
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    await (this.prisma as any).withWorkspace(workspaceId).integration.upsert({
      where: { workspaceId_provider: { workspaceId, provider: 'google_search_console' } },
      create: {
        workspaceId,
        provider: 'google_search_console',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
      }
    });
  }

  async getProperties(workspaceId: string) {
    const integration = await (this.prisma as any).integration.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: 'google_search_console' } }
    });

    if (!integration) throw new Error('Not connected');

    if (process.env.NODE_ENV === 'test' || !process.env.GOOGLE_CLIENT_ID) {
      return [{ siteUrl: 'https://example.com' }, { siteUrl: 'sc-domain:example.com' }];
    }

    this.oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.expiresAt?.getTime(),
    });

    const webmasters = google.webmasters({ version: 'v3', auth: this.oauth2Client });
    const res = await webmasters.sites.list();
    return res.data.siteEntry || [];
  }

  async connectProperty(workspaceId: string, propertyUrl: string) {
    const config = JSON.stringify({ propertyUrl });
    await (this.prisma as any).integration.update({
      where: { workspaceId_provider: { workspaceId, provider: 'google_search_console' } },
      data: { config }
    });
    return { success: true };
  }

  async getIntegrationStatus(workspaceId: string) {
    const integration = await (this.prisma as any).integration.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: 'google_search_console' } }
    });

    if (!integration) return { connected: false };

    let propertyUrl = null;
    if (integration.config) {
      try {
        propertyUrl = JSON.parse(integration.config).propertyUrl;
      } catch {}
    }

    return {
      connected: true,
      propertyUrl,
      lastSyncAt: integration.lastSyncAt
    };
  }

  async sync(workspaceId: string, days: number = 28) {
    const integration = await (this.prisma as any).integration.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: 'google_search_console' } }
    });

    if (!integration) throw new Error('Not connected');
    let propertyUrl = '';
    if (integration.config) {
      propertyUrl = JSON.parse(integration.config).propertyUrl;
    }
    if (!propertyUrl) throw new Error('No property selected');

    let metrics: any[] = [];
    const endDateStr = new Date().toISOString().split('T')[0];
    const startDateStr = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (process.env.NODE_ENV === 'test' || !process.env.GOOGLE_CLIENT_ID) {
      // Mock metrics
      metrics = [
        { url: propertyUrl + '/blog/seo', keyword: 'seo tool', impressions: 1500, clicks: 12, position: 11, date: startDateStr },
        { url: propertyUrl + '/pricing', keyword: 'cheap seo', impressions: 500, clicks: 5, position: 5, date: endDateStr }
      ];
    } else {
      this.oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
        expiry_date: integration.expiresAt?.getTime(),
      });

      const webmasters = google.webmasters({ version: 'v3', auth: this.oauth2Client });

      const res = await webmasters.searchanalytics.query({
        siteUrl: propertyUrl,
        requestBody: {
          startDate: startDateStr,
          endDate: endDateStr,
          dimensions: ['date', 'query', 'page'],
          rowLimit: 5000,
        }
      });

      if (res.data.rows) {
        metrics = res.data.rows.map(row => ({
          date: (row.keys || [])[0],
          keyword: (row.keys || [])[1],
          url: (row.keys || [])[2],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          position: row.position || 0
        }));
      }
    }

    // Persist into GscMetric table using upsert
    const p = this.prisma as any;
    for (const m of metrics) {
      const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
      await p.gscMetric.upsert({
        where: {
          workspaceId_date_query_page: {
            workspaceId,
            date: new Date(m.date),
            query: m.keyword,
            page: m.url
          }
        },
        create: {
          workspaceId,
          date: new Date(m.date),
          query: m.keyword,
          page: m.url,
          clicks: m.clicks,
          impressions: m.impressions,
          ctr: parseFloat(ctr.toFixed(2)),
          position: m.position
        },
        update: {
          clicks: m.clicks,
          impressions: m.impressions,
          ctr: parseFloat(ctr.toFixed(2)),
          position: m.position
        }
      });
    }

    // Pass to SeoOpportunities engine (it handles duplicate opportunity prevention)
    if (metrics.length > 0) {
      await this.seoOppsService.analyzeMetrics(workspaceId, metrics);
    }

    await p.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() }
    });

    return { success: true, count: metrics.length };
  }
}
