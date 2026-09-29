import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { BrandProfilesModule } from './brand-profiles/brand-profiles.module';
import { AiModule } from './ai/ai.module';
import { ContentPacksModule } from './content-packs/content-packs.module';
import { SourcesModule } from './sources/sources.module';
import { ResearchModule } from './research/research.module';
import { SeoModule } from './seo/seo.module';
import { SeoOpportunitiesModule } from './seo-opportunities/seo-opportunities.module';
import { GscModule } from './gsc/gsc.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiReportsModule } from './ai-reports/ai-reports.module';
import { QueuesModule } from './queues/queues.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';

@Module({
  imports: [
    PrismaModule, AuthModule, WorkspacesModule, BrandProfilesModule, AiModule,
    ContentPacksModule, SourcesModule, ResearchModule, SeoModule,
    SeoOpportunitiesModule, GscModule, WebhooksModule, AnalyticsModule,
    AiReportsModule, AiAgentModule, QueuesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
