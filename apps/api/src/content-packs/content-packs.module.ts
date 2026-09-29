import { Module } from '@nestjs/common';
import { ContentPacksService } from './content-packs.service';
import { ContentPacksController } from './content-packs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

import { SocialModule } from '../social/social.module';

@Module({
  imports: [PrismaModule, AiModule, SocialModule],
  controllers: [ContentPacksController],
  providers: [ContentPacksService],
})
export class ContentPacksModule {}
