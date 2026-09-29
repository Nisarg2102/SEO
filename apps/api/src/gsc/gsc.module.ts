import { Module } from '@nestjs/common';
import { GscService } from './gsc.service';
import { GscController, GscPublicController } from './gsc.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeoOpportunitiesModule } from '../seo-opportunities/seo-opportunities.module';

@Module({
  imports: [PrismaModule, SeoOpportunitiesModule],
  controllers: [GscController, GscPublicController],
  providers: [GscService],
  exports: [GscService],
})
export class GscModule {}
