import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { GscService } from '../gsc/gsc.service';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly gscService: GscService,
  ) {}

  async seedAutomations(workspaceId: string) {
    const existing = await this.prisma.automation.count({ where: { workspaceId } });
    if (existing > 0) return this.getAutomations(workspaceId);

    const defaultAutomations = [
      { name: 'Weekly GSC Sync', type: 'gsc-sync', schedule: '0 0 * * 0', enabled: true },
      { name: 'Weekly SEO Audit', type: 'seo-audit', schedule: '0 1 * * 0', enabled: false },
      { name: 'Weekly Performance Report', type: 'performance-report', schedule: '0 8 * * 1', enabled: true },
      { name: 'SEO Opportunity Detection', type: 'opportunity-detection', schedule: '0 9 * * 1', enabled: true },
    ];

    for (const a of defaultAutomations) {
      await this.prisma.automation.create({
        data: {
          workspaceId,
          name: a.name,
          type: a.type,
          schedule: a.schedule,
          enabled: a.enabled,
        }
      });
    }

    return this.getAutomations(workspaceId);
  }

  async getAutomations(workspaceId: string) {
    return this.prisma.automation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      }
    });
  }

  async getAutomation(workspaceId: string, automationId: string) {
    const auto = await this.prisma.automation.findUnique({
      where: { id: automationId, workspaceId }
    });
    if (!auto) throw new NotFoundException('Automation not found');
    return auto;
  }

  async updateAutomation(workspaceId: string, automationId: string, updateData: { enabled?: boolean }) {
    await this.getAutomation(workspaceId, automationId); // verify ownership
    return this.prisma.automation.update({
      where: { id: automationId },
      data: { enabled: updateData.enabled }
    });
  }

  async getRuns(workspaceId: string, automationId: string) {
    await this.getAutomation(workspaceId, automationId);
    return this.prisma.automationRun.findMany({
      where: { automationId, workspaceId },
      orderBy: { startedAt: 'desc' },
      take: 20
    });
  }

  async runAutomationManually(workspaceId: string, automationId: string) {
    const auto = await this.getAutomation(workspaceId, automationId);
    return this.executeLogic(auto);
  }

  async handleWebhook(payload: any) {
    const { workspaceId, type } = payload;
    if (!workspaceId || !type) {
      throw new BadRequestException('workspaceId and type are required');
    }

    // Identify automation
    const auto = await this.prisma.automation.findFirst({
      where: { workspaceId, type }
    });

    if (!auto) {
      throw new NotFoundException(`Automation of type ${type} not found in workspace`);
    }

    if (!auto.enabled) {
      return { status: 'skipped', message: 'Automation is disabled' };
    }

    return this.executeLogic(auto);
  }

  private async executeLogic(auto: any) {
    const run = await this.prisma.automationRun.create({
      data: {
        automationId: auto.id,
        workspaceId: auto.workspaceId,
        status: 'running',
        startedAt: new Date(),
      }
    });

    try {
      let metadata: any = {};

      switch (auto.type) {
        case 'gsc-sync':
          // Re-use GscService directly
          await this.gscService.sync(auto.workspaceId);
          metadata = { message: 'GSC sync initiated via QStash queue.' };
          break;
        case 'performance-report':
          const overview = await this.analyticsService.getOverview(auto.workspaceId);
          metadata = { overviewSummary: overview.summary };
          break;
        case 'opportunity-detection':
          const opps = await this.analyticsService.getOpportunities(auto.workspaceId);
          metadata = { detectedOpportunities: opps.length };
          break;
        case 'seo-audit':
          metadata = { message: 'Audit triggered. Crawl process relies on core QStash queue.' };
          break;
        default:
          throw new Error(`Unsupported automation type: ${auto.type}`);
      }

      const completed = await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          metadata: metadata
        }
      });
      return completed;
    } catch (err: any) {
      this.logger.error(`Automation failed: ${err.message}`, err.stack);
      return this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: err.message
        }
      });
    }
  }
}
