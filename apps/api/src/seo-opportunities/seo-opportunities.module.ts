import { Module } from '@nestjs/common';
import { SeoOpportunitiesService } from './seo-opportunities.service';
import { SeoOpportunitiesController } from './seo-opportunities.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { BullModule } from '@nestjs/bullmq';
import { SEO_QUEUE } from '../queues/queues.constants';

@Module({
  imports: [
    PrismaModule, 
    AiModule,
    BullModule.registerQueue({ name: SEO_QUEUE }),
  ],
  controllers: [SeoOpportunitiesController],
  providers: [SeoOpportunitiesService],
  exports: [SeoOpportunitiesService]
})
export class SeoOpportunitiesModule {}
