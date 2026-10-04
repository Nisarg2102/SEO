import { Module } from '@nestjs/common';
import { SeoStudioController } from './seo-studio.controller';
import { SeoStudioService } from './seo-studio.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [SeoStudioController],
  providers: [SeoStudioService],
  exports: [SeoStudioService],
})
export class SeoStudioModule {}
