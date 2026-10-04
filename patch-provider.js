const fs = require('fs');
let content = fs.readFileSync('services/seo/src/providers/technical-seo.provider.ts', 'utf8');

// Update CrawledPage interface
const newCrawledPage = `
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
`;
content = content.replace(/export interface CrawledPage \{[\s\S]*?\}/, newCrawledPage.trim());

// Update AuditResult
const newAuditResult = `
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
`;
content = content.replace(/export interface TechnicalAuditResult \{[\s\S]*?\}/, newAuditResult.trim());

// Update extractLinks
const newExtractLinks = `
  /**
   * Extracts absolute URLs from anchor tags
   */
  private extractLinks(html: string, currentUrl: string, baseUrlHostname: string): ExtractedLink[] {
    const links: ExtractedLink[] = [];
    // More robust regex to capture anchor tags
    const aRegex = /<a\\s+([^>]+)>(.*?)<\\/a>/gi;
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
`;
content = content.replace(/\/\*\*\s*\*\s*Extracts absolute URLs from anchor tags\s*\*\/[\s\S]*?return links;\s*\}/, newExtractLinks.trim());

// Update page initialization inside crawl()
const newPageInit = `
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
`;
content = content.replace(/const page: CrawledPage = \{[\s\S]*?issues: \[\],\s*\};/, newPageInit.trim());

// Update link extraction call
content = content.replace(/const discoveredLinks = this\.extractLinks\(html, response\.url\);/g, 'const discoveredLinks = this.extractLinks(html, response.url, parsedBase.hostname);\n               page.links = discoveredLinks;');

// Update link loop
content = content.replace(/for \(const link of discoveredLinks\) \{/g, 'for (const linkObj of discoveredLinks) {\n                 const link = linkObj.targetUrl;');

// Add sitemap fetching
const newSitemap = `
    let sitemapUrls: string[] = [];
    try {
      const sitemapUrl = new URL('/sitemap.xml', normalizedBase).href;
      const sitemapController = new AbortController();
      const sitemapTimeout = setTimeout(() => sitemapController.abort(), 10000);
      const sitemapResponse = await fetch(sitemapUrl, { signal: sitemapController.signal, headers: { 'User-Agent': 'SEO-Audit-Bot/1.0' } });
      clearTimeout(sitemapTimeout);
      
      if (sitemapResponse.ok) {
        const sitemapText = await sitemapResponse.text();
        const locMatches = sitemapText.matchAll(/<loc>([^<]+)<\\/loc>/gi);
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
`;
content = content.replace(/return \{\s*url: normalizedBase,[\s\S]*?pages,\s*\};/, newSitemap.trim());

fs.writeFileSync('services/seo/src/providers/technical-seo.provider.ts', content);
