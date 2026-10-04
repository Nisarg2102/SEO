import { Controller, Post, Body, UseGuards, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { QStashGuard } from './qstash.guard';
import { GscService } from '../gsc/gsc.service';
import { ResearchService } from '../research/research.service';
import { SeoAuditService } from '../seo-audit/seo-audit.service';
import { SeoOpportunitiesService, RawMetric } from '../seo-opportunities/seo-opportunities.service';

import { PrismaService } from '../prisma/prisma.service';

@Controller('internal/queues')
@UseGuards(QStashGuard)
export class QueuesController {
  private readonly logger = new Logger(QueuesController.name);

  constructor(
    private readonly gscService: GscService,
    private readonly researchService: ResearchService,
    private readonly seoOpportunitiesService: SeoOpportunitiesService,
    private readonly seoAuditService: SeoAuditService,
    
    private readonly prisma: PrismaService,
  ) {}

  @Post('analytics/sync-gsc')
  @HttpCode(HttpStatus.OK)
  async syncGsc(@Body() data: { workspaceId: string; days?: number }) {
    this.logger.log(`Processing GSC sync for workspace ${data.workspaceId}`);
    try {
      const days = data.days || 28;
      const result = await this.gscService.sync(data.workspaceId, days);
      this.logger.log(`Successfully completed GSC sync for workspace ${data.workspaceId} (${days} days). Count: ${result.count}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process GSC sync for workspace ${data.workspaceId}`, (error as Error).stack);
      throw error; // QStash handles retries based on non-200 responses
    }
  }

  @Post('research/sync-workspace')
  @HttpCode(HttpStatus.OK)
  async syncWorkspaceResearch(@Body() data: { workspaceId: string }) {
    this.logger.log(`Processing research sync for workspace ${data.workspaceId}`);
    if (!data.workspaceId) {
      this.logger.error(`Missing workspaceId — discarding`);
      return { status: 'discarded' }; // 200 OK prevents QStash from retrying bad payloads
    }
    try {
      const result = await this.researchService.sync(data.workspaceId);
      this.logger.log(`[sync-workspace] workspace=${data.workspaceId} newItems=${result.newItemsCount} failedSources=${result.failedSources}`);
      return result;
    } catch (error) {
      this.logger.error(`[sync-workspace] workspace=${data.workspaceId} failed`, (error as Error).stack);
      throw error;
    }
  }

  @Post('research/sync-all')
  @HttpCode(HttpStatus.OK)
  async syncAllResearch() {
    this.logger.log(`Processing fan-out research sync for all workspaces`);
    try {
      const result = await this.researchService.syncAll();
      this.logger.log(`[sync-all] totalSynced=${result.totalSynced}`);
      return result;
    } catch (error) {
      this.logger.error(`[sync-all] failed`, (error as Error).stack);
      throw error;
    }
  }

  @Post('seo/analyze-metrics')
  @HttpCode(HttpStatus.OK)
  async analyzeSeoMetrics(@Body() data: { workspaceId: string; metrics: RawMetric[] }) {
    this.logger.log(`Processing SEO metrics analysis for workspace ${data.workspaceId}`);
    if (!data.workspaceId) {
      this.logger.warn('analyze-metrics job missing workspaceId, discarding');
      return { status: 'discarded' };
    }
    try {
      const result = await this.seoOpportunitiesService.analyzeMetricsBackground(data.workspaceId, data.metrics);
      this.logger.log(`Created ${result.createdCount} SEO opportunities for workspace ${data.workspaceId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error processing SEO metrics for workspace ${data.workspaceId}:`, error);
      throw error;
    }
  }


  @Post('analytics/sync-all-gsc')
  @HttpCode(HttpStatus.OK)
  async syncAllGsc() {
    this.logger.log(`Processing fan-out GSC sync for all workspaces`);
    try {
      const result = await this.gscService.syncAll();
      this.logger.log(`[sync-all-gsc] totalQueued=${result.queuedCount}`);
      return result;
    } catch (error) {
      this.logger.error(`[sync-all-gsc] failed`, (error as Error).stack);
      throw error;
    }
  }
  @Post('seo/audit-run')
  @HttpCode(HttpStatus.OK)
  async runSeoAudit(@Body() data: { workspaceId: string; auditId: string }) {
    this.logger.log(`Processing SEO audit run for ${data.auditId} in workspace ${data.workspaceId}`);
    if (!data.workspaceId || !data.auditId) {
      this.logger.warn('audit-run job missing workspaceId or auditId, discarding');
      return { status: 'discarded' };
    }
    try {
      await this.seoAuditService.runAudit(data.workspaceId, data.auditId);
      return { status: 'completed' };
    } catch (error) {
      this.logger.error(`Error running SEO audit ${data.auditId}:`, error);
      throw error;
    }
  }
}
