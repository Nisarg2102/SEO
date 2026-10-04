import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { WebhookGuard } from './webhook.guard';

@Controller()
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  // --- INTERNAL WEBHOOK (n8n -> App) ---
  @Post('internal/automation/webhook')
  @UseGuards(WebhookGuard)
  async handleWebhook(@Body() payload: any) {
    return this.automationsService.handleWebhook(payload);
  }

  // --- USER API ---
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('workspaces/:workspaceId/automations')
  getAutomations(@Param('workspaceId') workspaceId: string) {
    return this.automationsService.getAutomations(workspaceId);
  }

  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('workspaces/:workspaceId/automations')
  createDefaultAutomations(@Param('workspaceId') workspaceId: string) {
    return this.automationsService.seedAutomations(workspaceId);
  }

  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('workspaces/:workspaceId/automations/:automationId')
  getAutomation(@Param('workspaceId') workspaceId: string, @Param('automationId') automationId: string) {
    return this.automationsService.getAutomation(workspaceId, automationId);
  }

  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Patch('workspaces/:workspaceId/automations/:automationId')
  updateAutomation(
    @Param('workspaceId') workspaceId: string, 
    @Param('automationId') automationId: string,
    @Body() updateData: { enabled?: boolean }
  ) {
    return this.automationsService.updateAutomation(workspaceId, automationId, updateData);
  }

  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('workspaces/:workspaceId/automations/:automationId/run')
  runAutomationManually(
    @Param('workspaceId') workspaceId: string, 
    @Param('automationId') automationId: string
  ) {
    return this.automationsService.runAutomationManually(workspaceId, automationId);
  }

  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('workspaces/:workspaceId/automations/:automationId/runs')
  getAutomationRuns(
    @Param('workspaceId') workspaceId: string, 
    @Param('automationId') automationId: string
  ) {
    return this.automationsService.getRuns(workspaceId, automationId);
  }
}
