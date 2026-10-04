import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { SeoStudioService } from './seo-studio.service';
import { z } from 'zod';

const GenerateBriefSchema = z.object({
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).optional(),
  topic: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  contentType: z.string().optional(),
  searchIntent: z.string().optional(),
});

@Controller('workspaces/:workspaceId/seo')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class SeoStudioController {
  constructor(private readonly seoStudioService: SeoStudioService) {}

  @Post('content-briefs')
  async createBrief(
    @Param('workspaceId') workspaceId: string,
    @Body() body: unknown
  ) {
    const payload = GenerateBriefSchema.parse(body);
    return this.seoStudioService.generateBrief(workspaceId, payload);
  }

  @Get('content-briefs')
  async getBriefs(@Param('workspaceId') workspaceId: string) {
    return this.seoStudioService.getBriefs(workspaceId);
  }

  @Get('content-briefs/:briefId')
  async getBrief(
    @Param('workspaceId') workspaceId: string,
    @Param('briefId') briefId: string
  ) {
    return this.seoStudioService.getBrief(workspaceId, briefId);
  }

  @Post('content-briefs/:briefId/generate-draft')
  async generateDraft(
    @Param('workspaceId') workspaceId: string,
    @Param('briefId') briefId: string
  ) {
    return this.seoStudioService.generateDraft(workspaceId, briefId);
  }

  @Get('content-briefs/:briefId/drafts')
  async getDrafts(
    @Param('workspaceId') workspaceId: string,
    @Param('briefId') briefId: string
  ) {
    return this.seoStudioService.getDraftsByBrief(workspaceId, briefId);
  }

  @Get('content-drafts/:draftId')
  async getDraft(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string
  ) {
    return this.seoStudioService.getDraft(workspaceId, draftId);
  }

  @Patch('content-drafts/:draftId')
  async updateDraft(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Body() body: { content?: string; title?: string }
  ) {
    return this.seoStudioService.updateDraft(workspaceId, draftId, body);
  }

  @Post('content-drafts/:draftId/regenerate-section')
  async regenerateSection(
    @Param('workspaceId') workspaceId: string,
    @Param('draftId') draftId: string,
    @Body() body: { sectionHeading: string; instructions: string }
  ) {
    return this.seoStudioService.regenerateSection(workspaceId, draftId, body.sectionHeading, body.instructions);
  }
}
