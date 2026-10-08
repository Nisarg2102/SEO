import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';
import { Client } from "@upstash/qstash";
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
      scope: [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: workspaceId,
    });
  }

  async handleCallback(code: string, workspaceId: string) {
    if (process.env.NODE_ENV === 'test' || !process.env.GOOGLE_CLIENT_ID) {
      await this.prisma.googleConnection.upsert({
        where: { workspaceId_email: { workspaceId, email: 'mock@example.com' } },
        create: {
          workspaceId,
          email: 'mock@example.com',
          accessTokenEncrypted: 'mock_token',
          refreshTokenEncrypted: 'mock_refresh',
          expiresAt: new Date(Date.now() + 3600000)
        },
        update: {
          accessTokenEncrypted: 'mock_token',
          refreshTokenEncrypted: 'mock_refresh',
          expiresAt: new Date(Date.now() + 3600000)
        }
      });
      return;
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    
    this.oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    let email = 'unknown@example.com';
    try {
      const userInfo = await oauth2.userinfo.get();
      email = userInfo.data.email || email;
    } catch (e) {
      this.logger.warn('Could not fetch user email during GSC OAuth', e);
    }

    await this.prisma.googleConnection.upsert({
      where: { workspaceId_email: { workspaceId, email } },
      create: {
        workspaceId,
        email,
        accessTokenEncrypted: tokens.access_token || '',
        refreshTokenEncrypted: tokens.refresh_token || '',
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      },
      update: {
        accessTokenEncrypted: tokens.access_token || '',
        ...(tokens.refresh_token ? { refreshTokenEncrypted: tokens.refresh_token } : {}),
        ...(tokens.expiry_date ? { expiresAt: new Date(tokens.expiry_date) } : {})
      }
    });
  }

  async getProperties(workspaceId: string) {
    const connection = await this.prisma.googleConnection.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    if (!connection) throw new Error('Not connected');

    if (process.env.NODE_ENV === 'test' || !process.env.GOOGLE_CLIENT_ID) {
      return [{ siteUrl: 'https://example.com' }, { siteUrl: 'sc-domain:example.com' }];
    }

    this.oauth2Client.setCredentials({
      access_token: connection.accessTokenEncrypted,
      refresh_token: connection.refreshTokenEncrypted,
      expiry_date: connection.expiresAt?.getTime(),
    });

    const webmasters = google.webmasters({ version: 'v3', auth: this.oauth2Client });
    const res = await webmasters.sites.list();
    return res.data.siteEntry || [];
  }

  async connectProperty(workspaceId: string, siteUrl: string) {
    const connection = await this.prisma.googleConnection.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!connection) throw new Error('No Google connection found');

    await this.prisma.searchConsoleProperty.upsert({
      where: { workspaceId_siteUrl: { workspaceId, siteUrl } },
      create: {
        workspaceId,
        googleConnectionId: connection.id,
        siteUrl
      },
      update: {
        googleConnectionId: connection.id
      }
    });
    
    return { success: true };
  }

  async getIntegrationStatus(workspaceId: string) {
    const connection = await this.prisma.googleConnection.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    if (!connection) return { connected: false };

    const property = await this.prisma.searchConsoleProperty.findFirst({
      where: { workspaceId, googleConnectionId: connection.id },
      orderBy: { createdAt: 'desc' }
    });

    return {
      connected: true,
      propertyUrl: property?.siteUrl || null,
      lastSyncAt: property?.lastSyncAt || null,
      email: connection.email
    };
  }

  async sync(workspaceId: string, days: number = 28) {
    const property = await this.prisma.searchConsoleProperty.findFirst({
      where: { workspaceId },
      include: { googleConnection: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!property || !property.googleConnection) throw new Error('Not connected');

    const endDateStr = new Date().toISOString().split('T')[0];
    const startDateStr = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const syncRun = await this.prisma.syncRun.create({
      data: {
        workspaceId,
        provider: 'google_search_console',
        status: 'running'
      }
    });

    try {
      let dailyRows: any[] = [];
      let queryRows: any[] = [];
      let pageRows: any[] = [];
      
      if (process.env.NODE_ENV === 'test' || !process.env.GOOGLE_CLIENT_ID) {
         dailyRows = [{ keys: [startDateStr], clicks: 10, impressions: 100, position: 5 }];
      } else {
        this.oauth2Client.setCredentials({
          access_token: property.googleConnection.accessTokenEncrypted,
          refresh_token: property.googleConnection.refreshTokenEncrypted,
          expiry_date: property.googleConnection.expiresAt?.getTime(),
        });
        const webmasters = google.webmasters({ version: 'v3', auth: this.oauth2Client });

        const [dailyRes, queryRes, pageRes] = await Promise.all([
          webmasters.searchanalytics.query({
            siteUrl: property.siteUrl,
            requestBody: { startDate: startDateStr, endDate: endDateStr, dimensions: ['date'], rowLimit: 5000 }
          }),
          webmasters.searchanalytics.query({
            siteUrl: property.siteUrl,
            requestBody: { startDate: startDateStr, endDate: endDateStr, dimensions: ['date', 'query'], rowLimit: 5000 }
          }),
          webmasters.searchanalytics.query({
            siteUrl: property.siteUrl,
            requestBody: { startDate: startDateStr, endDate: endDateStr, dimensions: ['date', 'page'], rowLimit: 5000 }
          })
        ]);

        dailyRows = dailyRes.data.rows || [];
        queryRows = queryRes.data.rows || [];
        pageRows = pageRes.data.rows || [];
      }

      for (const r of dailyRows) {
        if (!r.keys) continue;
        const ctr = r.impressions ? (r.clicks! / r.impressions) * 100 : 0;
        await this.prisma.searchConsoleDaily.upsert({
          where: { propertyId_date: { propertyId: property.id, date: new Date(r.keys[0]) } },
          create: { propertyId: property.id, date: new Date(r.keys[0]), clicks: r.clicks||0, impressions: r.impressions||0, ctr: parseFloat(ctr.toFixed(2)), position: r.position||0 },
          update: { clicks: r.clicks||0, impressions: r.impressions||0, ctr: parseFloat(ctr.toFixed(2)), position: r.position||0 }
        });
      }

      for (const r of queryRows) {
        if (!r.keys) continue;
        const ctr = r.impressions ? (r.clicks! / r.impressions) * 100 : 0;
        await this.prisma.searchConsoleQuery.upsert({
          where: { propertyId_date_query: { propertyId: property.id, date: new Date(r.keys[0]), query: r.keys[1] } },
          create: { propertyId: property.id, date: new Date(r.keys[0]), query: r.keys[1], clicks: r.clicks||0, impressions: r.impressions||0, ctr: parseFloat(ctr.toFixed(2)), position: r.position||0 },
          update: { clicks: r.clicks||0, impressions: r.impressions||0, ctr: parseFloat(ctr.toFixed(2)), position: r.position||0 }
        });
      }

      for (const r of pageRows) {
        if (!r.keys) continue;
        const ctr = r.impressions ? (r.clicks! / r.impressions) * 100 : 0;
        await this.prisma.searchConsolePage.upsert({
          where: { propertyId_date_page: { propertyId: property.id, date: new Date(r.keys[0]), page: r.keys[1] } },
          create: { propertyId: property.id, date: new Date(r.keys[0]), page: r.keys[1], clicks: r.clicks||0, impressions: r.impressions||0, ctr: parseFloat(ctr.toFixed(2)), position: r.position||0 },
          update: { clicks: r.clicks||0, impressions: r.impressions||0, ctr: parseFloat(ctr.toFixed(2)), position: r.position||0 }
        });
      }

      await this.prisma.searchConsoleProperty.update({
        where: { id: property.id },
        data: { lastSyncAt: new Date() }
      });

      await this.prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          metrics: { daily: dailyRows.length, queries: queryRows.length, pages: pageRows.length }
        }
      });

      return { success: true };
    } catch (error: any) {
      await this.prisma.syncRun.update({
        where: { id: syncRun.id },
        data: { status: 'failed', completedAt: new Date(), error: error.message }
      });
      throw error;
    }
  }

  async getKeywordHistory(workspaceId: string, query: string, days: number = 30) {
    const property = await this.prisma.searchConsoleProperty.findFirst({ where: { workspaceId }});
    if (!property) return [];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.searchConsoleQuery.findMany({
      where: { propertyId: property.id, query, date: { gte: startDate } },
      orderBy: { date: 'asc' }
    });
  }

  async getPropertyHistory(workspaceId: string, days: number = 30) {
    const property = await this.prisma.searchConsoleProperty.findFirst({ where: { workspaceId }});
    if (!property) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.prisma.searchConsoleDaily.findMany({
      where: { propertyId: property.id, date: { gte: startDate } },
      orderBy: { date: 'asc' }
    });

    return metrics.map((m: any) => ({
      date: m.date,
      clicks: m.clicks,
      impressions: m.impressions,
      ctr: m.ctr,
      position: m.position
    }));
  }

  async getPerformance(workspaceId: string, startDate: Date, endDate: Date) {
    const property = await this.prisma.searchConsoleProperty.findFirst({ where: { workspaceId }});
    if (!property) return { clicks: 0, impressions: 0, ctr: 0, averagePosition: 0 };

    const metrics = await this.prisma.searchConsoleDaily.aggregate({
      where: { propertyId: property.id, date: { gte: startDate, lte: endDate } },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true }
    });

    return {
      clicks: metrics._sum.clicks || 0,
      impressions: metrics._sum.impressions || 0,
      ctr: metrics._avg.ctr || 0,
      averagePosition: metrics._avg.position || 0
    };
  }

  async getTopQueries(workspaceId: string, days: number = 30, limit: number = 10) {
    const property = await this.prisma.searchConsoleProperty.findFirst({ where: { workspaceId }});
    if (!property) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.prisma.searchConsoleQuery.groupBy({
      by: ['query'],
      where: { propertyId: property.id, date: { gte: startDate } },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
      orderBy: { _sum: { clicks: 'desc' } },
      take: limit
    });

    return result.map((r: any) => ({
      query: r.query,
      clicks: r._sum.clicks,
      impressions: r._sum.impressions,
      ctr: r._avg.ctr,
      position: r._avg.position
    }));
  }

  async getTopPages(workspaceId: string, days: number = 30, limit: number = 10) {
    const property = await this.prisma.searchConsoleProperty.findFirst({ where: { workspaceId }});
    if (!property) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.prisma.searchConsolePage.groupBy({
      by: ['page'],
      where: { propertyId: property.id, date: { gte: startDate } },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
      orderBy: { _sum: { clicks: 'desc' } },
      take: limit
    });

    return result.map((r: any) => ({
      page: r.page,
      clicks: r._sum.clicks,
      impressions: r._sum.impressions,
      ctr: r._avg.ctr,
      position: r._avg.position
    }));
  }

  async syncAll(days: number = 28) {
    const properties = await this.prisma.searchConsoleProperty.findMany();
    const appUrl = process.env.API_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');
    const qstash = new Client({ token: process.env.QSTASH_TOKEN || '' });

    let queuedCount = 0;
    for (const property of properties) {
      try {
        await qstash.publishJSON({
          url: `${appUrl}/internal/queues/analytics/sync-gsc`,
          body: { workspaceId: property.workspaceId, days }
        });
        queuedCount++;
      } catch (e) {
        this.logger.error(`Failed to queue GSC sync for workspace ${property.workspaceId}`, (e as Error).stack);
      }
    }
    
    return { queuedCount };
  }
}
