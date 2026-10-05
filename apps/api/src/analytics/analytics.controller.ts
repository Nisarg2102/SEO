import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';

@Controller('workspaces/:workspaceId/analytics')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(
    @Param('workspaceId') workspaceId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getOverview(workspaceId, start, end);
  }

  @Get('seo')
  getSeo(
    @Param('workspaceId') workspaceId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getSeoMetrics(workspaceId, start, end);
  }

  @Get('keywords')
  getKeywords(
    @Param('workspaceId') workspaceId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getKeywords(workspaceId, start, end);
  }

  @Get('pages')
  getPages(
    @Param('workspaceId') workspaceId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getPages(workspaceId, start, end);
  }

  @Get('opportunities')
  getOpportunities(
    @Param('workspaceId') workspaceId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getOpportunities(workspaceId, start, end);
  }

  @Get('technical')
  getTechnical(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getTechnical(workspaceId);
  }

  @Get('links')
  getLinks(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getLinks(workspaceId);
  }

  @Get('content')
  getContent(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getContent(workspaceId);
  }

  @Get('social')
  getSocial(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getSocial(workspaceId);
  }

    @Post('insights')
  async generateInsights(
    @Param('workspaceId') workspaceId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    try {
      return await this.analyticsService.generateInsights(workspaceId, start, end);
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `AI Generation failed: ${error.message || 'Unknown provider error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
