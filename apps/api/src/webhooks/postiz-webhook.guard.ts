import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PostizWebhookGuard implements CanActivate {
  private readonly logger = new Logger(PostizWebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedSecret = request.headers['x-postiz-webhook-secret'];
    const validSecret = process.env.POSTIZ_WEBHOOK_SECRET;

    if (!validSecret) {
      this.logger.error('POSTIZ_WEBHOOK_SECRET is not set. Rejecting all Postiz webhook requests.');
      throw new UnauthorizedException('Webhook endpoint not configured');
    }

    if (!providedSecret) {
      throw new UnauthorizedException('Missing Postiz webhook secret');
    }

    const provided = Buffer.from(String(providedSecret));
    const expected = Buffer.from(validSecret);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      this.logger.warn('Invalid Postiz webhook secret attempt');
      throw new UnauthorizedException('Invalid Postiz webhook credentials');
    }

    return true;
  }
}
