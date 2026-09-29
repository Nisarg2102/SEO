import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Receiver } from '@upstash/qstash';

@Injectable()
export class QStashGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['upstash-signature'];
    
    if (!signature) {
      throw new UnauthorizedException('Missing upstash-signature header');
    }

    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

    if (!currentSigningKey || !nextSigningKey) {
      // In development, you might want to bypass or error out. 
      // For safety, error out if env vars are missing.
      throw new UnauthorizedException('QStash signing keys are not configured');
    }

    const receiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });

    try {
      const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
      const isValid = await receiver.verify({
        signature,
        body,
      });
      return isValid;
    } catch (error) {
      throw new UnauthorizedException('Invalid upstash signature');
    }
  }
}
