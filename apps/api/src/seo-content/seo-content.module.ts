import { Module } from '@nestjs/common';
import { SeoContentController } from './seo-content.controller';
import { SeoContentService } from './seo-content.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { GscModule } from '../gsc/gsc.module';

@Module({
  imports: [PrismaModule, AiModule, GscModule],
  controllers: [SeoContentController],
  providers: [SeoContentService],
  exports: [SeoContentService],
})
export class SeoContentModule {}
