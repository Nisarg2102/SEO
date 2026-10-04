import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class WebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers['x-n8n-webhook-secret'];
    const validSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!validSecret) {
      // If no secret configured, block to be safe.
      throw new UnauthorizedException('Webhook secret not configured on server.');
    }

    if (secret !== validSecret) {
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    return true;
  }
}
