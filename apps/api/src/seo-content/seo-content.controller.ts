import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { SeoContentService } from './seo-content.service';
import { z } from 'zod';

const AnalyzePayloadSchema = z.object({
  url: z.string().url(),
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  searchIntent: z.string().optional(),
});

@Controller('workspaces/:workspaceId/seo/content')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class SeoContentController {
  constructor(private readonly seoContentService: SeoContentService) {}

  @Post('analyze')
  async analyze(
    @Param('workspaceId') workspaceId: string,
    @Body() body: unknown
  ) {
    const payload = AnalyzePayloadSchema.parse(body);
    return this.seoContentService.analyze(workspaceId, payload);
  }

  @Get('analyses')
  async getAnalyses(@Param('workspaceId') workspaceId: string) {
    return this.seoContentService.getAnalyses(workspaceId);
  }

  @Get('analyses/:analysisId')
  async getAnalysis(
    @Param('workspaceId') workspaceId: string,
    @Param('analysisId') analysisId: string
  ) {
    return this.seoContentService.getAnalysis(workspaceId, analysisId);
  }

  @Post('analyses/:analysisId/reanalyze')
  async reanalyze(
    @Param('workspaceId') workspaceId: string,
    @Param('analysisId') analysisId: string
  ) {
    // Re-fetch original payload and re-run
    const existing = await this.seoContentService.getAnalysis(workspaceId, analysisId);
    return this.seoContentService.analyze(workspaceId, {
      url: existing.url,
      primaryKeyword: existing.primaryKeyword,
      secondaryKeywords: existing.secondaryKeywords,
      country: existing.country || undefined,
      language: existing.language || undefined,
      searchIntent: existing.searchIntent || undefined,
    });
  }
}
