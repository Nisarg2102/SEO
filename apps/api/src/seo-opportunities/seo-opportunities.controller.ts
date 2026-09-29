import { Controller, Get, Post, Body, Param, UseGuards, Inject, Query } from '@nestjs/common';
import { SeoOpportunitiesService, RawMetric } from './seo-opportunities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SEO_QUEUE } from '../queues/queues.constants';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/seo-opportunities')
export class SeoOpportunitiesController {
  constructor(
    private readonly seoOppsService: SeoOpportunitiesService,
    @InjectQueue(SEO_QUEUE) private seoQueue: Queue
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
    // We send this to the background via BullMQ and return 202
    const job = await this.seoQueue.add('analyze-metrics', {
      workspaceId,
      metrics: metrics || []
    });

    return { 
      message: 'Analysis queued successfully', 
      jobId: job.id,
      status: 'queued'
    };
  }

  @Post(':id/convert')
  convert(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.seoOppsService.convertToIdea(workspaceId, id);
  }
}
