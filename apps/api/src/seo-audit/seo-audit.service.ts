import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FreeTechnicalSeoProvider } from '@ai-marketing/seo';
import { Client } from '@upstash/qstash';

@Injectable()
export class SeoAuditService {
  private readonly logger = new Logger(SeoAuditService.name);
  private readonly qstash = new Client({ token: process.env.QSTASH_TOKEN || '' });
  private readonly provider = new FreeTechnicalSeoProvider();

  constructor(private readonly prisma: PrismaService) {}

  async createAudit(workspaceId: string, baseUrl: string, maxPages: number = 25, maxDepth: number = 2) {
    if (maxPages > 100) {
      throw new BadRequestException('maxPages cannot exceed 100 for the free tier');
    }
    if (maxDepth > 5) {
      throw new BadRequestException('maxDepth cannot exceed 5 for the free tier');
    }

    const audit = await (this.prisma as any).seoAudit.create({
      data: {
        workspaceId,
        baseUrl,
        maxPages,
        maxDepth,
        status: 'pending',
      }
    });

    // Enqueue job via QStash
    const baseUrlString = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    
    // In test environments, mockPublishJSON handles this, but we'll try to publish anyway if token is present
    if (process.env.QSTASH_TOKEN) {
        try {
          await this.qstash.publishJSON({
            url: `\${baseUrlString}/api/internal/queues/seo/audit-run`,
            body: { workspaceId, auditId: audit.id },
            retries: 0 // Do not auto-retry a long crawl
          });
        } catch (e) {
          this.logger.error(`Failed to enqueue audit job \${audit.id}`, e);
          await (this.prisma as any).seoAudit.update({
            where: { id: audit.id },
            data: { status: 'failed', errorMessage: 'Failed to enqueue job' }
          });
          throw e;
        }
    }

    return audit;
  }

  async runAudit(workspaceId: string, auditId: string) {
    this.logger.log(`Starting audit \${auditId} for workspace \${workspaceId}`);
    
    const audit = await (this.prisma as any).seoAudit.findUnique({
      where: { id: auditId, workspaceId }
    });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }

    if (audit.status === 'running') {
      return; // Already running
    }

    await (this.prisma as any).seoAudit.update({
      where: { id: auditId },
      data: { status: 'running', startedAt: new Date() }
    });

    try {
      const result = await this.provider.crawl(audit.baseUrl, {
        maxPages: audit.maxPages,
        maxDepth: audit.maxDepth
      });

      // Save results
      await (this.prisma as any).seoAudit.update({
        where: { id: auditId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          pagesCrawled: result.summary.pagesCrawled,
          pagesFailed: result.summary.pagesFailed,
          issueCount: result.summary.issues,
          criticalCount: result.summary.critical,
          warningCount: result.summary.warnings,
          passedCount: result.summary.passed,
        }
      });

      // Insert pages and issues (for small batches this is fine, otherwise chunk it)
      for (const page of result.pages) {
        const savedPage = await (this.prisma as any).seoAuditPage.create({
          data: {
            auditId,
            url: page.url,
            finalUrl: page.finalUrl,
            statusCode: page.statusCode,
            contentType: page.contentType,
            responseTime: page.responseTime,
            pageSize: page.pageSize,
            wordCount: page.wordCount,
            title: page.title,
            metaDesc: page.metaDesc,
            h1: page.h1,
            isIndexable: page.isIndexable,
            hasCanonical: page.hasCanonical,
            canonicalUrl: page.canonicalUrl,
            crawlDepth: page.crawlDepth,
            failed: page.failed,
            failReason: page.failReason,
          }
        });

        if (page.issues.length > 0) {
          const issuesData = page.issues.map(issue => ({
            auditId,
            pageId: savedPage.id,
            code: issue.code,
            severity: issue.severity,
            title: issue.title,
            description: issue.description,
            evidence: issue.evidence,
            recommendation: issue.recommendation,
          }));
          await (this.prisma as any).seoAuditIssue.createMany({
            data: issuesData
          });
        }

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

      }

      this.logger.log(`Completed audit \${auditId}`);

    } catch (e) {
      this.logger.error(`Audit \${auditId} failed`, e);
      await (this.prisma as any).seoAudit.update({
        where: { id: auditId },
        data: { 
          status: 'failed', 
          completedAt: new Date(),
          errorMessage: (e as Error).message || 'Unknown error'
        }
      });
    }
  }

  async getAudits(workspaceId: string) {
    return (this.prisma as any).seoAudit.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAudit(workspaceId: string, auditId: string) {
    const audit = await (this.prisma as any).seoAudit.findUnique({
      where: { id: auditId, workspaceId },
      include: {
        pages: true,
        issues: true
      }
    });

    if (!audit) {
      throw new NotFoundException('Audit not found');
    }
    return audit;
  }

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

}