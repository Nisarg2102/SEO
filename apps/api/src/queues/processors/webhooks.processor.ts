import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WEBHOOKS_QUEUE } from '../queues.constants';
import { SocialService } from '../../social/social.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor(WEBHOOKS_QUEUE)
export class WebhooksProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhooksProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly socialService: SocialService
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    
    if (job.name === 'sync-postiz') {
      const scheduledPacks = await (this.prisma as any).contentPack.findMany({
        where: { status: 'SCHEDULED', externalPostId: { not: null } }
      });

      let updated = 0;
      for (const pack of scheduledPacks) {
        if (!pack.externalPostId) continue;
        try {
          const externalStatus = await this.socialService.syncStatus(pack.externalPostId);
          if (externalStatus === 'published') {
            await (this.prisma as any).contentPack.update({
              where: { id: pack.id },
              data: { status: 'PUBLISHED' }
            });
            updated++;
          } else if (externalStatus === 'failed') {
            await (this.prisma as any).contentPack.update({
              where: { id: pack.id },
              data: { status: 'REJECTED' }
            });
            updated++;
          }
        } catch (e) {
          this.logger.error(`Failed to sync postiz status for pack ${pack.id}`, (e as Error).stack);
          // throw e; // Decide if you want to retry the whole batch or continue. Continuing is safer for a batch job.
        }
      }
      this.logger.log(`Completed postiz sync. Updated ${updated} packs.`);
      return { updated };
    }
  }
}
