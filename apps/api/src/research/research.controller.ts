import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ResearchService } from './research.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { ConvertToIdeaDto, ResearchFiltersDto } from './dto';
import { Client } from '@upstash/qstash';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
@Controller('workspaces/:workspaceId/research')
export class ResearchController {
  private readonly qstash = new Client({ token: process.env.QSTASH_TOKEN || '' });

  constructor(
    private readonly researchService: ResearchService
  ) {}

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() filters: ResearchFiltersDto,
  ) {
    return this.researchService.findAll(workspaceId, {
      sourceId: filters.sourceId,
      topic: filters.topic,
      search: filters.search,
      minConfidence: filters.minConfidence !== undefined ? parseFloat(filters.minConfidence) : undefined,
      fromDate: filters.fromDate ? new Date(filters.fromDate) : undefined,
      toDate: filters.toDate ? new Date(filters.toDate) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.researchService.findOne(workspaceId, id);
  }

  /**
   * POST /workspaces/:workspaceId/research/sync
   * Enqueues a per-workspace research sync job.
   * Returns HTTP 202 Accepted immediately — does NOT wait for completion.
   */
  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async sync(@Param('workspaceId') workspaceId: string) {
    const appUrl = process.env.API_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001';
    const res = await this.qstash.publishJSON({
      url: `${appUrl}/internal/queues/research/sync-workspace`,
      body: { workspaceId }
    });
    return {
      message: 'Research sync queued. New items will appear shortly.',
      jobId: res.messageId,
    };
  }

  /**
   * POST /workspaces/:workspaceId/research/:id/convert
   * Converts a research item into a Content Idea for the same workspace.
   */
  @Post(':id/convert')
  convert(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: ConvertToIdeaDto,
  ) {
    return this.researchService.convertToIdea(workspaceId, id, dto.title);
  }
}
