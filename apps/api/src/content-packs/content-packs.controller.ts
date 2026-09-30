import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ContentPacksService } from './content-packs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { GenerateContentPackDto, UpdateContentPackDto } from './dto';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/content-packs')
export class ContentPacksController {
  constructor(private readonly contentPacksService: ContentPacksService) {}

  @Post('generate')
  async generate(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: GenerateContentPackDto
  ) {
    try {
      return await this.contentPacksService.generate(workspaceId, dto);
    } catch (error: any) {
      throw new HttpException({
        message: 'AI Generation failed',
        details: error.message,
        type: 'AI_ERROR'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.contentPacksService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.contentPacksService.findOne(workspaceId, id);
  }

  @Put(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContentPackDto
  ) {
    return this.contentPacksService.update(workspaceId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.contentPacksService.remove(workspaceId, id);
  }
}
