import { Module } from '@nestjs/common';
import { SeoAuditController } from './seo-audit.controller';
import { SeoAuditService } from './seo-audit.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SeoAuditController],
  providers: [SeoAuditService],
  exports: [SeoAuditService],
})
export class SeoAuditModule {}
