import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ANALYTICS_QUEUE, WEBHOOKS_QUEUE, RESEARCH_QUEUE, SEO_QUEUE } from './queues.constants';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { WebhooksProcessor } from './processors/webhooks.processor';
import { ResearchProcessor } from './processors/research.processor';
import { SeoProcessor } from './processors/seo.processor';
import { GscModule } from '../gsc/gsc.module';
import { ResearchModule } from '../research/research.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialModule } from '../social/social.module';
import { SeoOpportunitiesModule } from '../seo-opportunities/seo-opportunities.module';

@Global()
@Module({
  imports: [
    GscModule,
    ResearchModule,
    PrismaModule,
    SocialModule,
    SeoOpportunitiesModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({ name: ANALYTICS_QUEUE }),
    BullModule.registerQueue({ name: WEBHOOKS_QUEUE }),
    BullModule.registerQueue({ name: RESEARCH_QUEUE }),
    BullModule.registerQueue({ name: SEO_QUEUE }),
  ],
  providers: [
    AnalyticsProcessor,
    WebhooksProcessor,
    ResearchProcessor,
    SeoProcessor,
  ],
  exports: [BullModule], // Re-export BullModule so other modules can inject queues
})
export class QueuesModule {}
