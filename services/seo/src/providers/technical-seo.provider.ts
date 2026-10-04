import { safeFetch } from '@ai-marketing/shared';
import { validateUrl, validateUrlStructureOnly, SsrfError, UrlValidationError } from '../utils/ssrf';

export interface AuditConfig {
  maxPages: number;
  maxDepth: number;
}

export interface Issue {
  code: string;
  severity: 'critical' | 'warning' | 'info' | 'pass';
  title: string;
  description: string;
  evidence?: string;
  recommendation: string;
  url?: string;
}

export interface ExtractedLink {
  sourceUrl: string;
  targetUrl: string;
  linkType: 'INTERNAL' | 'EXTERNAL';
  anchorText: string | null;
  rel: string | null;
  isNofollow: boolean;
  isSponsored: boolean;
  isUgc: boolean;
}

export interface CrawledPage {
  url: string;
  finalUrl: string | null;
  statusCode: number | null;
  contentType: string | null;
  responseTime: number | null;
  pageSize: number | null;
  wordCount: number | null;
  title: string | null;
  metaDesc: string | null;
  h1: string | null;
  isIndexable: boolean;
  hasCanonical: boolean;
  canonicalUrl: string | null;
  crawlDepth: number;
  failed: boolean;
  failReason: string | null;
  issues: Issue[];
  links: ExtractedLink[];
}

export interface TechnicalAuditResult {
  url: string;
  summary: {
    pagesCrawled: number;
    pagesFailed: number;
    issues: number;
    critical: number;
    warnings: number;
    passed: number;
  };
  pages: CrawledPage[];
  sitemapUrls: string[];
}

export class FreeTechnicalSeoProvider {
  /**
   * Helper to extract content of a meta tag by name or property
   */
  private extractMeta(html: string, attr: string, value: string): string | null {
    const regex = new RegExp(`<meta[^>]*?${attr}=["']${value}["'][^>]*?>`, 'i');
    const match = html.match(regex);
    if (!match) return null;
    
    const contentMatch = match[0].match(/content=["']([^"']*)["']/i);
    return contentMatch ? contentMatch[1].trim() : null;
  }

  /**
   * Analyzes an individual HTML page
   */
  private analyzeHtml(html: string, page: CrawledPage): void {
    // Word Count
    const textOnly = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                         .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                         .replace(/<[^>]+>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim();
    page.wordCount = textOnly.split(' ').filter(w => w.length > 0).length;

    // Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    page.title = titleMatch ? titleMatch[1].trim() : null;

    // Meta Description
    page.metaDesc = this.extractMeta(html, 'name', 'description');

    // H1
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    page.h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : null;

    // Canonical
    const canonicalMatch = html.match(/<link[^>]*?rel=["']canonical["'][^>]*?>/i);
    if (canonicalMatch) {
      page.hasCanonical = true;
      const hrefMatch = canonicalMatch[0].match(/href=["']([^"']+)["']/i);
      page.canonicalUrl = hrefMatch ? hrefMatch[1].trim() : null;
    } else {
      page.hasCanonical = false;
      page.canonicalUrl = null;
    }

    // Robots
    const robotsMeta = this.extractMeta(html, 'name', 'robots');
    page.isIndexable = true;
    if (robotsMeta && (robotsMeta.toLowerCase().includes('noindex'))) {
      page.isIndexable = false;
    }

    // Add Issues
    if (!page.title) {
      page.issues.push({ code: 'MISSING_TITLE', severity: 'critical', title: 'Missing Title', description: 'Page has no <title> tag.', recommendation: 'Add a descriptive title tag.' });
    } else if (page.title.length < 10 || page.title.length > 70) {
      page.issues.push({ code: 'TITLE_LENGTH', severity: 'warning', title: 'Title Length', description: 'Title is outside 10-70 character range.', evidence: `Length: \${page.title.length}`, recommendation: 'Keep title between 10-70 characters.' });
    } else {
      page.issues.push({ code: 'TITLE_OK', severity: 'pass', title: 'Title OK', description: 'Title is present and good length.', recommendation: '' });
    }

    if (!page.metaDesc) {
      page.issues.push({ code: 'MISSING_DESC', severity: 'warning', title: 'Missing Meta Description', description: 'Page has no meta description.', recommendation: 'Add a meta description.' });
    } else {
      page.issues.push({ code: 'DESC_OK', severity: 'pass', title: 'Meta Description OK', description: 'Meta description is present.', recommendation: '' });
    }

    if (!page.h1) {
      page.issues.push({ code: 'MISSING_H1', severity: 'warning', title: 'Missing H1', description: 'Page has no H1 tag.', recommendation: 'Add a single H1 tag.' });
    } else {
      const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
      if (h1Count > 1) {
         page.issues.push({ code: 'MULTIPLE_H1', severity: 'info', title: 'Multiple H1', description: 'Page has multiple H1 tags.', evidence: `Found \${h1Count}`, recommendation: 'Consider using a single H1.' });
      } else {
         page.issues.push({ code: 'H1_OK', severity: 'pass', title: 'H1 OK', description: 'Page has one H1 tag.', recommendation: '' });
      }
    }

    if (!page.hasCanonical) {
      page.issues.push({ code: 'MISSING_CANONICAL', severity: 'info', title: 'Missing Canonical', description: 'No canonical link found.', recommendation: 'Add a canonical URL.' });
    } else {
      page.issues.push({ code: 'CANONICAL_OK', severity: 'pass', title: 'Canonical OK', description: 'Canonical URL is present.', recommendation: '' });
    }

    if (!page.isIndexable) {
      page.issues.push({ code: 'NOINDEX', severity: 'warning', title: 'Page is Noindex', description: 'Page has a noindex robots meta tag.', recommendation: 'Remove noindex if you want the page to appear in search.' });
    }
  }

  /**
   * Extracts absolute URLs from anchor tags
   */
  private extractLinks(html: string, currentUrl: string, baseUrlHostname: string): ExtractedLink[] {
    const links: ExtractedLink[] = [];
    // More robust regex to capture anchor tags
    const aRegex = /<a\s+([^>]+)>(.*?)<\/a>/gi;
    let match;
    while ((match = aRegex.exec(html)) !== null) {
      const attrs = match[1];
      const rawText = match[2];
      
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) continue;
      
      const href = hrefMatch[1].trim();
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;

      try {
        const url = new URL(href, currentUrl);
        url.hash = ''; // Remove fragments
        
        const anchorText = rawText.replace(/<[^>]+>/g, '').trim().substring(0, 500);
        
        const relMatch = attrs.match(/rel=["']([^"']+)["']/i);
        const rel = relMatch ? relMatch[1].toLowerCase() : null;
        
        links.push({
          sourceUrl: currentUrl,
          targetUrl: url.href,
          linkType: url.hostname === baseUrlHostname ? 'INTERNAL' : 'EXTERNAL',
          anchorText: anchorText || null,
          rel: rel,
          isNofollow: rel ? rel.includes('nofollow') : false,
          isSponsored: rel ? rel.includes('sponsored') : false,
          isUgc: rel ? rel.includes('ugc') : false,
        });
      } catch {
        // Ignore invalid URLs
      }
    }
    return links;
  }

  /**
   * Crawls a website starting from the base URL.
   */
  async crawl(baseUrl: string, config: AuditConfig): Promise<TechnicalAuditResult> {
    const visited = new Set<string>();
    const queue: { url: string, depth: number }[] = [];
    const pages: CrawledPage[] = [];

    let parsedBase: URL;
    try {
      parsedBase = await validateUrl(baseUrl);
    } catch (e) {
      throw new Error(`Invalid base URL: \${(e as Error).message}`);
    }

    // Normalize base URL
    parsedBase.hash = '';
    const normalizedBase = parsedBase.href;

    queue.push({ url: normalizedBase, depth: 0 });
    visited.add(normalizedBase);

    while (queue.length > 0 && pages.length < config.maxPages) {
      const { url, depth } = queue.shift()!;
      
      const page: CrawledPage = {
        url,
        finalUrl: null,
        statusCode: null,
        contentType: null,
        responseTime: null,
        pageSize: null,
        wordCount: null,
        title: null,
        metaDesc: null,
        h1: null,
        isIndexable: true,
        hasCanonical: false,
        canonicalUrl: null,
        crawlDepth: depth,
        failed: false,
        failReason: null,
        issues: [],
        links: [],
      };

      try {
        // Note: we've already done ssrf check on parsedBase.
        // For discovered links, we need to ssrf check if they go outside the host,
        // but we restrict crawling to the same hostname.
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname !== parsedBase.hostname) {
           page.failed = true;
           page.failReason = "External host";
           pages.push(page);
           continue;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const startTime = Date.now();
        const response = await safeFetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'SEO-Audit-Bot/1.0' },
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        page.responseTime = Date.now() - startTime;
        page.statusCode = response.status;
        page.finalUrl = response.url;
        page.contentType = response.headers.get('content-type') || null;

        if (!response.ok) {
          page.issues.push({
            code: 'HTTP_ERROR',
            severity: 'critical',
            title: 'HTTP Error',
            description: `Page returned status \${response.status}`,
            recommendation: 'Ensure page returns 200 OK.',
          });
        }

        if (response.ok && page.contentType && page.contentType.includes('text/html')) {
           const arrayBuffer = await response.arrayBuffer();
           page.pageSize = arrayBuffer.byteLength;
           
           if (page.pageSize && page.pageSize > 5 * 1024 * 1024) { // 5MB limit
             page.failed = true;
             page.failReason = "Page too large";
           } else {
             const html = new TextDecoder().decode(arrayBuffer);
             this.analyzeHtml(html, page);

             // Discover links if within depth
             if (depth < config.maxDepth) {
               const discoveredLinks = this.extractLinks(html, response.url, parsedBase.hostname);
               page.links = discoveredLinks;
               for (const linkObj of discoveredLinks) {
                 const link = linkObj.targetUrl;
                 if (!visited.has(link)) {
                   const linkUrl = new URL(link);
                   if (linkUrl.hostname === parsedBase.hostname) {
                     visited.add(link);
                     queue.push({ url: link, depth: depth + 1 });
                   }
                 }
               }
             }
           }
        } else {
           // Not HTML, or not OK
        }

      } catch (error) {
        page.failed = true;
        page.failReason = (error as Error).message;
        page.issues.push({
           code: 'CRAWL_FAILED',
           severity: 'critical',
           title: 'Crawl Failed',
           description: `Failed to fetch URL: \${(error as Error).message}`,
           recommendation: 'Ensure URL is accessible.'
        });
      }

      pages.push(page);
    }

    let issues = 0;
    let critical = 0;
    let warnings = 0;
    let passed = 0;

    for (const p of pages) {
      for (const i of p.issues) {
        issues++;
        if (i.severity === 'critical') critical++;
        if (i.severity === 'warning') warnings++;
        if (i.severity === 'pass') passed++;
      }
    }

    let sitemapUrls: string[] = [];
    try {
      const sitemapUrl = new URL('/sitemap.xml', normalizedBase).href;
      const sitemapController = new AbortController();
      const sitemapTimeout = setTimeout(() => sitemapController.abort(), 10000);
      const sitemapResponse = await safeFetch(sitemapUrl, { signal: sitemapController.signal, headers: { 'User-Agent': 'SEO-Audit-Bot/1.0' } });
      clearTimeout(sitemapTimeout);
      
      if (sitemapResponse.ok) {
        const sitemapText = await sitemapResponse.text();
        const locMatches = sitemapText.matchAll(/<loc>([^<]+)<\/loc>/gi);
        for (const match of locMatches) {
          try {
            const parsedLoc = new URL(match[1].trim());
            parsedLoc.hash = '';
            if (parsedLoc.hostname === parsedBase.hostname) {
              sitemapUrls.push(parsedLoc.href);
            }
          } catch {}
        }
      }
    } catch (e) {
      // Ignore sitemap errors
    }

    return {
      url: normalizedBase,
      summary: {
        pagesCrawled: pages.length,
        pagesFailed: pages.filter(p => p.failed).length,
        issues,
        critical,
        warnings,
        passed,
      },
      pages,
      sitemapUrls,
    };
  }
}
