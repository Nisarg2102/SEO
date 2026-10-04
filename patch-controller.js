const fs = require('fs');
let content = fs.readFileSync('apps/api/src/seo-audit/seo-audit.controller.ts', 'utf8');

const endpoints = `
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
`;

content = content.replace(/}\s*$/g, endpoints + '\n}');
fs.writeFileSync('apps/api/src/seo-audit/seo-audit.controller.ts', content);
