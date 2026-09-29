import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Request() req: any, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(req.user.userId, createWorkspaceDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.workspacesService.findAllForUser(req.user.userId);
  }

  @UseGuards(WorkspaceGuard)
  @Get(':workspaceId')
  findOne(@Param('workspaceId') id: string) {
    return this.workspacesService.findOne(id);
  }

  @UseGuards(WorkspaceGuard)
  @Get(':workspaceId/stats')
  getStats(@Param('workspaceId') id: string) {
    return this.workspacesService.getStats(id);
  }

  @UseGuards(WorkspaceGuard)
  @Patch(':workspaceId')
  update(@Param('workspaceId') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto) {
    return this.workspacesService.update(id, updateWorkspaceDto);
  }
}
