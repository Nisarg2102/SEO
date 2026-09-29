import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ANALYTICS_QUEUE } from '../queues.constants';
import { GscService } from '../../gsc/gsc.service';

export interface GscSyncJobData {
  workspaceId: string;
  days?: number;
}

@Processor(ANALYTICS_QUEUE)
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    private readonly gscService: GscService,
  ) {
    super();
  }

  async process(job: Job<GscSyncJobData, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name} for workspace ${job.data.workspaceId}`);
    
    if (job.name === 'sync-gsc') {
      try {
        const days = job.data.days || 28;
        const result = await this.gscService.sync(job.data.workspaceId, days);
        this.logger.log(`Successfully completed GSC sync for workspace ${job.data.workspaceId} (${days} days). Count: ${result.count}`);
        return result;
      } catch (error) {
        this.logger.error(`Failed to process GSC sync for workspace ${job.data.workspaceId}`, (error as Error).stack);
        throw error; // Let BullMQ handle retries
      }
    }
  }
}
