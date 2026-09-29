import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class N8nGuard implements CanActivate {
  private readonly logger = new Logger(N8nGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-n8n-api-key'];
    const validKey = process.env.N8N_WEBHOOK_SECRET;

    // Fail hard if secret is not configured — never fall back to a default in any environment
    if (!validKey) {
      this.logger.error('N8N_WEBHOOK_SECRET is not set. Rejecting all webhook requests.');
      throw new UnauthorizedException('Webhook endpoint not configured');
    }

    if (!providedKey) {
      throw new UnauthorizedException('Missing webhook credentials');
    }

    // Constant-time comparison to prevent timing attacks
    const provided = Buffer.from(String(providedKey));
    const expected = Buffer.from(validKey);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      // Do NOT log the provided key — it could contain attempted secrets
      this.logger.warn('Invalid N8N webhook key attempt');
      throw new UnauthorizedException('Invalid webhook credentials');
    }

    return true;
  }
}
