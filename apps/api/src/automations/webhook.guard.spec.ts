import { WebhookGuard } from './webhook.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('WebhookGuard', () => {
  let guard: WebhookGuard;

  beforeEach(() => {
    guard = new WebhookGuard();
    process.env.N8N_WEBHOOK_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.N8N_WEBHOOK_SECRET;
  });

  it('allows access with correct secret', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-n8n-webhook-secret': 'test-secret' } }),
      }),
    } as ExecutionContext;
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('blocks access with incorrect secret', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-n8n-webhook-secret': 'wrong' } }),
      }),
    } as ExecutionContext;
    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });
});
