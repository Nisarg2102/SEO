import { Module } from '@nestjs/common';
import { InstagramController, InstagramPublicController } from './instagram.controller';
import { InstagramService } from './instagram.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [InstagramController, InstagramPublicController],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
