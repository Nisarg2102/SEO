import { Controller, Get, Post, Query, Param, Res, UseGuards } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Controller('instagram')
export class InstagramPublicController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') workspaceId: string, @Res() res: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!workspaceId || !UUID_REGEX.test(workspaceId)) {
      return res.redirect(`${frontendUrl}?error=invalid_state`);
    }
    if (!code) {
      return res.redirect(`${frontendUrl}/workspaces/${workspaceId}/settings?error=invalid_code`);
    }

    try {
      await this.instagramService.handleCallback(code, workspaceId);
      res.redirect(`${frontendUrl}/workspaces/${workspaceId}/settings?instagram=success`);
    } catch (e) {
      res.redirect(`${frontendUrl}/workspaces/${workspaceId}/settings?error=callback_failed`);
    }
  }
}

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/social/instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get('auth-url')
  getAuthUrl(@Param('workspaceId') workspaceId: string) {
    return { url: this.instagramService.getAuthUrl(workspaceId) };
  }

  @Get('status')
  getStatus(@Param('workspaceId') workspaceId: string) {
    return this.instagramService.getStatus(workspaceId);
  }

  @Post('sync')
  sync(@Param('workspaceId') workspaceId: string) {
    return this.instagramService.sync(workspaceId);
  }

  @Get('top-content')
  getTopContent(@Param('workspaceId') workspaceId: string) {
    return this.instagramService.getTopContent(workspaceId);
  }

  @Get('insights')
  getInsights(@Param('workspaceId') workspaceId: string) {
    return this.instagramService.getInsights(workspaceId);
  }

  @Post('analyze')
  analyze(@Param('workspaceId') workspaceId: string) {
    return this.instagramService.analyze(workspaceId);
  }

  @Post('disconnect')
  disconnect(@Param('workspaceId') workspaceId: string) {
    return this.instagramService.disconnect(workspaceId);
  }
}
