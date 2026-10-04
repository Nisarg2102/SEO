import { Module } from '@nestjs/common';
import { ContentPacksService } from './content-packs.service';
import { ContentPacksController } from './content-packs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';



@Module({
  imports: [PrismaModule, AiModule],
  controllers: [ContentPacksController],
  providers: [ContentPacksService],
})
export class ContentPacksModule {}
