import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  @Post('n8n')
  async handleN8nWebhook(
    @Body() payload: any,
    @Headers('x-n8n-webhook-secret') secret: string
  ) {
    if (secret !== process.env.N8N_WEBHOOK_SECRET) {
      throw new UnauthorizedException('Invalid n8n webhook secret');
    }
    this.logger.log(`Received n8n webhook: ${JSON.stringify(payload)}`);
    return { success: true };
  }
}
