import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getDashboardData(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getDashboardData(workspaceId);
  }

  @Post('accounts/:accountId/sync')
  syncAccount(@Param('workspaceId') workspaceId: string, @Param('accountId') accountId: string) {
    return this.analyticsService.syncAccount(accountId);
  }
}
