import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { CreateSourceDto, UpdateSourceDto } from './dto';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('workspaces/:workspaceId/sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  create(@Param('workspaceId') workspaceId: string, @Body() dto: CreateSourceDto) {
    return this.sourcesService.create(workspaceId, dto);
  }

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.sourcesService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.sourcesService.findOne(workspaceId, id);
  }

  @Put(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSourceDto,
  ) {
    return this.sourcesService.update(workspaceId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.sourcesService.remove(workspaceId, id);
  }
}
