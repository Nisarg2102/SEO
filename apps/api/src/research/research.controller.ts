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
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ResearchService } from './research.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { ConvertToIdeaDto, ResearchFiltersDto } from './dto';
import { RESEARCH_QUEUE } from '../queues/queues.constants';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
@Controller('workspaces/:workspaceId/research')
export class ResearchController {
  constructor(
    private readonly researchService: ResearchService,
    @InjectQueue(RESEARCH_QUEUE) private readonly researchQueue: Queue,
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
    const job = await this.researchQueue.add('sync-workspace', { workspaceId });
    return {
      message: 'Research sync queued. New items will appear shortly.',
      jobId: job.id,
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
