import { Module } from '@nestjs/common';
import { AiReportsController } from './ai-reports.controller';
import { AiReportsService } from './ai-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [AiReportsController],
  providers: [AiReportsService],
  exports: [AiReportsService]
})
export class AiReportsModule {}
