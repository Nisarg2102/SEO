import { Controller, Post, UseGuards, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { N8nGuard } from './n8n.guard';
import { PostizWebhookGuard } from './postiz-webhook.guard';
import { Client } from '@upstash/qstash';

@Controller('webhooks/n8n')
@UseGuards(N8nGuard)
export class WebhooksController {
  private readonly qstash = new Client({ token: process.env.QSTASH_TOKEN || '' });

  @Post('research-sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async syncResearch() {
    const appUrl = process.env.API_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
    const res = await this.qstash.publishJSON({
      url: `${appUrl}/internal/queues/research/sync-all`,
      body: {}
    });
    return { message: 'Research sync queued', jobId: res.messageId };
  }
}

@Controller('webhooks/postiz')
@UseGuards(PostizWebhookGuard)
export class PostizWebhooksController {
  private readonly qstash = new Client({ token: process.env.QSTASH_TOKEN || '' });

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async syncPostizStatuses() {
    const appUrl = process.env.API_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
    const res = await this.qstash.publishJSON({
      url: `${appUrl}/internal/queues/webhooks/sync-postiz`,
      body: {}
    });
    return { message: 'Postiz sync queued', jobId: res.messageId };
  }
}
