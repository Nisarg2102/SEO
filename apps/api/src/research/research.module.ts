import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ResearchService } from './research.service';
import { ResearchController } from './research.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { RESEARCH_QUEUE } from '../queues/queues.constants';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    BullModule.registerQueue({ name: RESEARCH_QUEUE }),
  ],
  controllers: [ResearchController],
  providers: [ResearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
