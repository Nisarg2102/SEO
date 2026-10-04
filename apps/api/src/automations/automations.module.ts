import { Module } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { AutomationsController } from './automations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { GscModule } from '../gsc/gsc.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AnalyticsModule, GscModule, AiModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
})
export class AutomationsModule {}
