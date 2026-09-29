import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { AiReportsService } from './ai-reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/reports')
export class AiReportsController {
  constructor(private readonly reportsService: AiReportsService) {}

  @Get()
  getReports(@Param('workspaceId') workspaceId: string) {
    return this.reportsService.getReports(workspaceId);
  }

  @Get(':id')
  getReport(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.reportsService.getReport(workspaceId, id);
  }

  @Post('generate')
  generateReport(@Param('workspaceId') workspaceId: string) {
    return this.reportsService.generateWeeklyReport(workspaceId);
  }
}
