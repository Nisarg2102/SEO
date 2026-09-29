import { Module } from '@nestjs/common';
import { SeoOpportunitiesService } from './seo-opportunities.service';
import { SeoOpportunitiesController } from './seo-opportunities.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    PrismaModule, 
    AiModule,
  ],
  controllers: [SeoOpportunitiesController],
  providers: [SeoOpportunitiesService],
  exports: [SeoOpportunitiesService]
})
export class SeoOpportunitiesModule {}
