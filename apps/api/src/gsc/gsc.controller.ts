import { Controller, Get, Post, Body, Param, Query, Res, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { GscService } from './gsc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ANALYTICS_QUEUE } from '../queues/queues.constants';

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
  constructor(
    private readonly gscService: GscService,
    @InjectQueue(ANALYTICS_QUEUE) private readonly analyticsQueue: Queue,
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
    const job = await this.analyticsQueue.add('sync-gsc', { workspaceId, days: days || 28 });
    return {
      message: 'Synchronization queued',
      jobId: job.id,
    };
  }
}
