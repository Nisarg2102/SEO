import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { SeoAuditService } from './seo-audit.service';
import { z } from 'zod';

const CreateAuditSchema = z.object({
  url: z.string().url(),
  maxPages: z.number().min(1).max(100).optional().default(25),
  maxDepth: z.number().min(0).max(5).optional().default(2),
});

@Controller('workspaces/:workspaceId/seo/audits')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class SeoAuditController {
  constructor(private readonly seoAuditService: SeoAuditService) {}

  @Post()
  async createAudit(
    @Param('workspaceId') workspaceId: string,
    @Body() body: unknown
  ) {
    const data = CreateAuditSchema.parse(body);
    return this.seoAuditService.createAudit(workspaceId, data.url, data.maxPages, data.maxDepth);
  }

  @Get()
  async getAudits(@Param('workspaceId') workspaceId: string) {
    return this.seoAuditService.getAudits(workspaceId);
  }

  @Get(':auditId')
  async getAudit(
    @Param('workspaceId') workspaceId: string,
    @Param('auditId') auditId: string
  ) {
    return this.seoAuditService.getAudit(workspaceId, auditId);
  }

  @Get('links/summary')
  async getLinksSummary(@Param('workspaceId') workspaceId: string) {
    return this.seoAuditService.getLinksSummary(workspaceId);
  }

  @Get('links/internal')
  async getInternalLinks(@Param('workspaceId') workspaceId: string) {
    return this.seoAuditService.getInternalLinks(workspaceId);
  }

  @Get('links/external')
  async getExternalLinks(@Param('workspaceId') workspaceId: string) {
    return this.seoAuditService.getExternalLinks(workspaceId);
  }

  @Get('links/broken')
  async getBrokenLinks(@Param('workspaceId') workspaceId: string) {
    return this.seoAuditService.getBrokenLinks(workspaceId);
  }

  @Get('links/orphans')
  async getOrphans(@Param('workspaceId') workspaceId: string) {
    return this.seoAuditService.getOrphans(workspaceId);
  }

  @Get('links/sitemap')
  async getSitemapLinks(@Param('workspaceId') workspaceId: string) {
    return this.seoAuditService.getSitemapDiff(workspaceId);
  }

  @Get('backlinks')
  async getBacklinks(@Param('workspaceId') workspaceId: string) {
    return this.seoAuditService.getBacklinks(workspaceId);
  }

}