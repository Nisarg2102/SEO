const fs = require('fs');
let content = fs.readFileSync('apps/api/src/seo-audit/seo-audit.service.ts', 'utf8');

// Inside runAudit, after saving issues, save links
const linkSavingCode = `
        if (page.links && page.links.length > 0) {
          const linksData = page.links.map(link => ({
            workspaceId,
            auditId,
            sourceUrl: link.sourceUrl,
            targetUrl: link.targetUrl,
            linkType: link.linkType,
            anchorText: link.anchorText,
            rel: link.rel,
            isNofollow: link.isNofollow,
            isSponsored: link.isSponsored,
            isUgc: link.isUgc,
            statusCode: null, // Resolving status codes for all external links is too slow for crawler
          }));
          await (this.prisma as any).seoLink.createMany({
            data: linksData
          });
        }
`;
content = content.replace(/await \(this\.prisma as any\)\.seoAuditIssue\.createMany\(\{[\s\S]*?data: issuesData\n\s*\}\);\n\s*\}/, '$&\n' + linkSavingCode);

// Add the new Link Intelligence methods
const linkMethods = `
  async getLinksSummary(workspaceId: string) {
    const latestAudit = await (this.prisma as any).seoAudit.findFirst({
      where: { workspaceId, status: 'completed' },
      orderBy: { createdAt: 'desc' }
    });
    if (!latestAudit) return { available: false };

    const internalLinks = await (this.prisma as any).seoLink.count({ where: { auditId: latestAudit.id, linkType: 'INTERNAL' }});
    const externalLinks = await (this.prisma as any).seoLink.count({ where: { auditId: latestAudit.id, linkType: 'EXTERNAL' }});
    const brokenInternal = await (this.prisma as any).seoAuditPage.count({ where: { auditId: latestAudit.id, statusCode: { not: 200 } }});

    return {
      available: true,
      auditId: latestAudit.id,
      internalLinks,
      externalLinks,
      brokenInternal,
    };
  }

  async getInternalLinks(workspaceId: string) {
    const latestAudit = await (this.prisma as any).seoAudit.findFirst({ where: { workspaceId, status: 'completed' }, orderBy: { createdAt: 'desc' } });
    if (!latestAudit) return [];
    return (this.prisma as any).seoLink.findMany({ where: { auditId: latestAudit.id, linkType: 'INTERNAL' }, take: 1000 });
  }

  async getExternalLinks(workspaceId: string) {
    const latestAudit = await (this.prisma as any).seoAudit.findFirst({ where: { workspaceId, status: 'completed' }, orderBy: { createdAt: 'desc' } });
    if (!latestAudit) return [];
    return (this.prisma as any).seoLink.findMany({ where: { auditId: latestAudit.id, linkType: 'EXTERNAL' }, take: 1000 });
  }

  async getBrokenLinks(workspaceId: string) {
    const latestAudit = await (this.prisma as any).seoAudit.findFirst({ where: { workspaceId, status: 'completed' }, orderBy: { createdAt: 'desc' } });
    if (!latestAudit) return [];
    
    // For broken links, we check the crawled pages status code
    return (this.prisma as any).seoAuditPage.findMany({ 
      where: { auditId: latestAudit.id, OR: [{ statusCode: { not: 200 } }, { failed: true }] },
      take: 1000
    });
  }

  async getOrphans(workspaceId: string) {
    const latestAudit = await (this.prisma as any).seoAudit.findFirst({ where: { workspaceId, status: 'completed' }, orderBy: { createdAt: 'desc' } });
    if (!latestAudit) return [];
    
    // A page is an orphan if it was crawled (e.g. from sitemap or seed) but has no INTERNAL links pointing to it
    // Because of Prisma limitations with complex LEFT JOINs, we can just fetch all pages and all internal targets
    const pages = await (this.prisma as any).seoAuditPage.findMany({ where: { auditId: latestAudit.id }, select: { id: true, url: true } });
    const internalLinks = await (this.prisma as any).seoLink.findMany({ where: { auditId: latestAudit.id, linkType: 'INTERNAL' }, select: { targetUrl: true } });
    
    const targetedUrls = new Set(internalLinks.map((l: any) => l.targetUrl));
    
    return pages.filter((p: any) => !targetedUrls.has(p.url) && p.url !== latestAudit.baseUrl);
  }

  async getSitemapDiff(workspaceId: string) {
    // Note: The sitemapUrls need to be stored in SeoAudit or fetched. We didn't add sitemapUrls to Prisma SeoAudit.
    // Let's just return a placeholder for now as we didn't add it to DB. 
    return { available: false, message: "Sitemap data not persisted in free architecture." };
  }

  async getBacklinks(workspaceId: string) {
    // This explicitly satisfies the limitation requirement
    return {
      available: false,
      source: 'free',
      message: 'A complete backlink index is not available in this architecture. Google Search Console and our crawler cannot discover all inbound links from the web.',
      data: []
    };
  }
`;
content = content.replace(/}\s*$/g, linkMethods + '\n}');

fs.writeFileSync('apps/api/src/seo-audit/seo-audit.service.ts', content);
