import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { SEO_QUEUE } from '../queues.constants';
import { SeoOpportunitiesService, RawMetric } from '../../seo-opportunities/seo-opportunities.service';

@Injectable()
@Processor(SEO_QUEUE)
export class SeoProcessor extends WorkerHost {
  private readonly logger = new Logger(SeoProcessor.name);

  constructor(
    private seoOpportunitiesService: SeoOpportunitiesService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing SEO job: ${job.name} (ID: ${job.id})`);

    switch (job.name) {
      case 'analyze-metrics': {
        const { workspaceId, metrics } = job.data as { workspaceId: string, metrics: RawMetric[] };
        
        if (!workspaceId) {
          this.logger.warn('analyze-metrics job missing workspaceId, discarding');
          return;
        }

        try {
          const result = await this.seoOpportunitiesService.analyzeMetricsBackground(workspaceId, metrics);
          this.logger.log(`Created ${result.createdCount} SEO opportunities for workspace ${workspaceId}`);
          return result;
        } catch (error) {
          this.logger.error(`Error processing SEO metrics for workspace ${workspaceId}:`, error);
          throw error; // Will be retried by BullMQ
        }
      }

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }
}
