import { Injectable, Logger } from '@nestjs/common';
import { SEOProvider, OpenSEOAdapter, KeywordData, AuditResult, RankData, CompetitorData } from '@ai-marketing/seo';

@Injectable()
export class SeoService {
  private provider: SEOProvider;
  private readonly logger = new Logger(SeoService.name);

  constructor() {
    this.provider = new OpenSEOAdapter();
  }

  // Explicitly for tests to mock it
  setProvider(provider: SEOProvider) {
    this.provider = provider;
  }

  async healthCheck(): Promise<boolean> {
    return this.provider.healthCheck();
  }

  async keywordResearch(query: string): Promise<KeywordData[]> {
    this.logger.log(`Performing keyword research for: ${query}`);
    return this.provider.keywordResearch(query);
  }

  async siteAudit(url: string): Promise<AuditResult> {
    this.logger.log(`Performing site audit for: ${url}`);
    return this.provider.siteAudit(url);
  }

  async competitorResearch(domain: string): Promise<CompetitorData[]> {
    this.logger.log(`Performing competitor research for: ${domain}`);
    return this.provider.competitorResearch(domain);
  }

  async rankTracking(domain: string, keywords: string[]): Promise<RankData[]> {
    this.logger.log(`Performing rank tracking for: ${domain}`);
    return this.provider.rankTracking(domain, keywords);
  }
}
