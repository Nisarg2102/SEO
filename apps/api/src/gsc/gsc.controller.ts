import { Controller, Get, Post, Body, Param, Query, Res, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { GscService } from './gsc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { Client } from '@upstash/qstash';

// UUID v4 regex — state must be a valid workspace UUID; prevents open redirect via state injection
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('gsc')
export class GscPublicController {
  constructor(private readonly gscService: GscService) {}

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') workspaceId: string, @Res() res: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!workspaceId || !UUID_REGEX.test(workspaceId)) {
      return res.redirect(`${frontendUrl}?error=invalid_state`);
    }

    if (!code || typeof code !== 'string' || code.length > 512) {
      return res.redirect(`${frontendUrl}/workspaces/${workspaceId}/search-console?error=invalid_code`);
    }

    try {
      await this.gscService.handleCallback(code, workspaceId);
      res.redirect(`${frontendUrl}/workspaces/${workspaceId}/search-console?success=true`);
    } catch {
      res.redirect(`${frontendUrl}/workspaces/${workspaceId}/search-console?error=callback_failed`);
    }
  }
}

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/gsc')
export class GscController {
  private readonly qstash = new Client({ token: process.env.QSTASH_TOKEN || '' });
  constructor(
    private readonly gscService: GscService
  ) {}

  @Get('auth-url')
  getAuthUrl(@Param('workspaceId') workspaceId: string) {
    return { url: this.gscService.getAuthUrl(workspaceId) };
  }

  @Get('status')
  getStatus(@Param('workspaceId') workspaceId: string) {
    return this.gscService.getIntegrationStatus(workspaceId);
  }

  @Get('properties')
  getProperties(@Param('workspaceId') workspaceId: string) {
    return this.gscService.getProperties(workspaceId);
  }

  @Post('connect-property')
  connectProperty(@Param('workspaceId') workspaceId: string, @Body('propertyUrl') propertyUrl: string) {
    return this.gscService.connectProperty(workspaceId, propertyUrl);
  }

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async sync(@Param('workspaceId') workspaceId: string, @Body('days') days?: number) {
    const appUrl = process.env.API_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
    const res = await this.qstash.publishJSON({
      url: `${appUrl}/internal/queues/analytics/sync-gsc`,
      body: { workspaceId, days: days || 28 }
    });
    return {
      message: 'Synchronization queued',
      jobId: res.messageId,
    };
  }
}
