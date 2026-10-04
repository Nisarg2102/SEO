import { Module } from '@nestjs/common';
import { KeywordResearchService } from './keyword-research.service';
import { KeywordResearchController } from './keyword-research.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KeywordResearchController],
  providers: [KeywordResearchService],
  exports: [KeywordResearchService],
})
export class KeywordResearchModule {}
