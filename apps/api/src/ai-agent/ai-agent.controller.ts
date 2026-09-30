import { Controller, Post, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/agent')
export class AiAgentController {
  constructor(private readonly agentService: AiAgentService) {}

  @Post('chat')
  async chat(
    @Param('workspaceId') workspaceId: string,
    @Body('message') message: string,
    @Body('history') history: any[] = []
  ) {
    try {
      return await this.agentService.handleUserMessage(workspaceId, message, history);
    } catch (error: any) {
      throw new HttpException({
        message: 'AI Chat failed',
        details: error.message,
        type: 'AI_ERROR'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
