import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RESEARCH_QUEUE } from '../queues.constants';
import { ResearchService } from '../../research/research.service';

interface SyncWorkspaceJobData {
  workspaceId: string;
}

@Processor(RESEARCH_QUEUE)
export class ResearchProcessor extends WorkerHost {
  private readonly logger = new Logger(ResearchProcessor.name);

  constructor(private readonly researchService: ResearchService) {
    super();
  }

  async process(job: Job<SyncWorkspaceJobData | Record<string, never>>): Promise<unknown> {
    this.logger.log(`[${job.name}] Processing job ${job.id}`);

    if (job.name === 'sync-workspace') {
      // Per-workspace job — used by the research controller sync endpoint
      const data = job.data as SyncWorkspaceJobData;
      if (!data.workspaceId) {
        this.logger.error(`Job ${job.id} missing workspaceId — discarding`);
        return; // do not throw: a permanent validation error should not retry
      }
      try {
        const result = await this.researchService.sync(data.workspaceId);
        this.logger.log(
          `[sync-workspace] workspace=${data.workspaceId} newItems=${result.newItemsCount} failedSources=${result.failedSources}`,
        );
        return result;
      } catch (error) {
        this.logger.error(`[sync-workspace] workspace=${data.workspaceId} failed`, (error as Error).stack);
        throw error; // Rethrow so BullMQ handles exponential backoff retries
      }
    }

    if (job.name === 'sync-all') {
      // Fan-out all workspaces — used by n8n webhook processor
      try {
        const result = await this.researchService.syncAll();
        this.logger.log(`[sync-all] totalSynced=${result.totalSynced}`);
        return result;
      } catch (error) {
        this.logger.error(`[sync-all] failed`, (error as Error).stack);
        throw error;
      }
    }

    this.logger.warn(`Unknown job name "${job.name}" — skipping`);
  }
}
