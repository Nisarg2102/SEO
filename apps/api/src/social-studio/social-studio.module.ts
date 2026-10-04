import { Module } from '@nestjs/common';
import { SocialStudioController } from './social-studio.controller';
import { SocialStudioService } from './social-studio.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [PrismaModule, AiModule, SocialModule],
  controllers: [SocialStudioController],
  providers: [SocialStudioService],
  exports: [SocialStudioService],
})
export class SocialStudioModule {}
