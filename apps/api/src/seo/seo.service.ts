import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { 
  KeywordData, 
  AuditResult, 
  RankData, 
  CompetitorData,
  TrendsSEOProvider,
  LocalCrawlerSEOProvider,
  SearchConsoleSEOProvider,
  KeywordResearchProvider,
  SiteAuditProvider,
  RankTrackingProvider
} from '@ai-marketing/seo';

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);
  
  private trendsProvider: KeywordResearchProvider;
  private localCrawlerProvider: SiteAuditProvider;
  private searchConsoleProvider: RankTrackingProvider;

  constructor() {
    this.trendsProvider = new TrendsSEOProvider();
    this.localCrawlerProvider = new LocalCrawlerSEOProvider();
    this.searchConsoleProvider = new SearchConsoleSEOProvider();
  }

  // Explicitly for tests to mock it
  setProviders(
    trends?: KeywordResearchProvider, 
    crawler?: SiteAuditProvider, 
    gsc?: RankTrackingProvider
  ) {
    if (trends) this.trendsProvider = trends;
    if (crawler) this.localCrawlerProvider = crawler;
    if (gsc) this.searchConsoleProvider = gsc;
  }

  async healthCheck(): Promise<boolean> {
    return true; // Local providers are always "healthy" initially
  }

  async keywordResearch(query: string): Promise<KeywordData[]> {
    this.logger.log(`Performing keyword research for: ${query}`);
    return this.trendsProvider.keywordResearch(query);
  }

  async siteAudit(url: string): Promise<AuditResult> {
    this.logger.log(`Performing site audit for: ${url}`);
    return this.localCrawlerProvider.siteAudit(url);
  }

  async competitorResearch(domain: string): Promise<CompetitorData[]> {
    this.logger.warn(`Competitor research is disabled in the free tier for domain: ${domain}`);
    // Return empty array indicating no data (UI will show unavailable)
    return [];
  }

  async rankTracking(domain: string, keywords: string[]): Promise<RankData[]> {
    this.logger.log(`Performing rank tracking for: ${domain}`);
    return this.searchConsoleProvider.rankTracking(domain, keywords);
  }
}
