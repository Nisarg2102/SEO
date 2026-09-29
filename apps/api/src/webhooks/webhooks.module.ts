import { Module } from '@nestjs/common';
import { WebhooksController, PostizWebhooksController } from './webhooks.controller';
import { ResearchModule } from '../research/research.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [ResearchModule, PrismaModule, SocialModule],
  controllers: [WebhooksController, PostizWebhooksController],
})
export class WebhooksModule {}
