import { Controller, Post, UseGuards, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { N8nGuard } from './n8n.guard';
import { PostizWebhookGuard } from './postiz-webhook.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RESEARCH_QUEUE, WEBHOOKS_QUEUE } from '../queues/queues.constants';

@Controller('webhooks/n8n')
@UseGuards(N8nGuard)
export class WebhooksController {
  constructor(
    @InjectQueue(RESEARCH_QUEUE) private readonly researchQueue: Queue,
  ) {}

  @Post('research-sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async syncResearch() {
    const job = await this.researchQueue.add('sync-all', {});
    return { message: 'Research sync queued', jobId: job.id };
  }
}

@Controller('webhooks/postiz')
@UseGuards(PostizWebhookGuard)
export class PostizWebhooksController {
  constructor(
    @InjectQueue(WEBHOOKS_QUEUE) private readonly webhooksQueue: Queue,
  ) {}

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async syncPostizStatuses() {
    const job = await this.webhooksQueue.add('sync-postiz', {});
    return { message: 'Postiz sync queued', jobId: job.id };
  }
}
