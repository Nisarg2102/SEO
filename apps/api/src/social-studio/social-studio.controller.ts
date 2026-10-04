import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { SocialStudioService } from './social-studio.service';
import { z } from 'zod';

const GenerateSocialSchema = z.object({
  sourceType: z.enum(['draft', 'brief', 'url', 'topic']),
  sourceId: z.string().optional(),
  sourceUrl: z.string().optional(),
  topic: z.string().optional(),
  platforms: z.array(z.string()).min(1),
  objective: z.string(),
  audience: z.string(),
  tone: z.string(),
  cta: z.string().optional(),
});

@Controller('workspaces/:workspaceId/social')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class SocialStudioController {
  constructor(private readonly socialStudioService: SocialStudioService) {}

  @Post('generate')
  async generatePosts(
    @Param('workspaceId') workspaceId: string,
    @Body() body: unknown
  ) {
    const payload = GenerateSocialSchema.parse(body);
    return this.socialStudioService.generateSocialContent(workspaceId, payload);
  }

  @Get('posts')
  async getPosts(@Param('workspaceId') workspaceId: string) {
    return this.socialStudioService.getPosts(workspaceId);
  }

  @Patch('posts/:postId')
  async updatePost(
    @Param('workspaceId') workspaceId: string,
    @Param('postId') postId: string,
    @Body() body: { content: any; hashtags: string[] }
  ) {
    return this.socialStudioService.updatePost(workspaceId, postId, body);
  }

  @Post('posts/:postId/approve')
  async approvePost(
    @Param('workspaceId') workspaceId: string,
    @Param('postId') postId: string,
    @Req() req: any
  ) {
    // Assuming req.workspaceRole is set by WorkspaceGuard
    const role = req.workspaceRole || 'OWNER'; 
    return this.socialStudioService.approvePost(workspaceId, postId, role);
  }

  @Post('posts/:postId/schedule')
  async schedulePost(
    @Param('workspaceId') workspaceId: string,
    @Param('postId') postId: string,
    @Body() body: { scheduledAt: string },
    @Req() req: any
  ) {
    const role = req.workspaceRole || 'OWNER';
    return this.socialStudioService.schedulePost(workspaceId, postId, new Date(body.scheduledAt), role);
  }
}
