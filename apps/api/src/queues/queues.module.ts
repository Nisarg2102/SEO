import { Module, Global } from '@nestjs/common';
import { QueuesController } from './queues.controller';
import { GscModule } from '../gsc/gsc.module';
import { ResearchModule } from '../research/research.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialModule } from '../social/social.module';
import { SeoOpportunitiesModule } from '../seo-opportunities/seo-opportunities.module';
import { SeoAuditModule } from '../seo-audit/seo-audit.module';

@Global()
@Module({
  imports: [
    GscModule,
    ResearchModule,
    PrismaModule,
    SocialModule,
    SeoOpportunitiesModule,
    SeoAuditModule,
  ],
  controllers: [QueuesController],
  providers: [],
  exports: [],
})
export class QueuesModule {}
