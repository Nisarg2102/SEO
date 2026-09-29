import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { BrandProfilesService } from './brand-profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { UpsertBrandProfileDto } from './dto';

@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/brand-profile')
export class BrandProfilesController {
  constructor(private readonly brandProfilesService: BrandProfilesService) {}

  @Get()
  getProfile(@Param('workspaceId') workspaceId: string) {
    return this.brandProfilesService.getProfile(workspaceId);
  }

  @Put()
  upsertProfile(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpsertBrandProfileDto,
  ) {
    return this.brandProfilesService.upsertProfile(workspaceId, dto);
  }
}
