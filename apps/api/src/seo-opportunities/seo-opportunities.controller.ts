import { Controller, Get, Post, Body, Param, UseGuards, Inject, Query } from '@nestjs/common';
import { SeoOpportunitiesService, RawMetric } from './seo-opportunities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { Client } from '@upstash/qstash';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/seo-opportunities')
export class SeoOpportunitiesController {
  private readonly qstash = new Client({ token: process.env.QSTASH_TOKEN || '' });

  constructor(
    private readonly seoOppsService: SeoOpportunitiesService
  ) {}

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
  ) {
    return this.seoOppsService.findAll(workspaceId, { type, priority });
  }

  @Post('analyze')
  async analyze(@Param('workspaceId') workspaceId: string, @Body('metrics') metrics: RawMetric[]) {
    const appUrl = process.env.API_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');
    const res = await this.qstash.publishJSON({
      url: `${appUrl}/internal/queues/seo/analyze-metrics`,
      body: { workspaceId, metrics: metrics || [] }
    });

    return { 
      message: 'Analysis queued successfully', 
      jobId: res.messageId,
      status: 'queued'
    };
  }

  @Post(':id/convert')
  convert(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.seoOppsService.convertToIdea(workspaceId, id);
  }
}
