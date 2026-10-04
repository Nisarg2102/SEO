import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';

@Controller('workspaces/:workspaceId/agent')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('conversations')
  getConversations(@Param('workspaceId') workspaceId: string) {
    return this.agentService.getConversations(workspaceId);
  }

  @Get('conversations/:id')
  getConversation(@Param('workspaceId') workspaceId: string, @Param('id') conversationId: string) {
    return this.agentService.getConversation(workspaceId, conversationId);
  }

  @Post('chat')
  async chat(
    @Param('workspaceId') workspaceId: string,
    @Body('message') message: string,
    @Body('conversationId') conversationId?: string
  ) {
    return this.agentService.chat(workspaceId, message, conversationId);
  }
}
