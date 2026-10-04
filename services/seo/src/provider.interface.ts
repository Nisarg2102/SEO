export interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: string;
}

export interface AuditResult {
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface RankData {
  keyword: string;
  position: number;
  url: string;
  change: number;
}

export interface CompetitorData {
  domain: string;
  overlap: number;
  topKeywords: string[];
}

// Breaking down the giant SEOProvider into specific provider interfaces

export interface KeywordResearchProvider {
  keywordResearch(query: string): Promise<KeywordData[]>;
}

export interface SiteAuditProvider {
  siteAudit(url: string): Promise<AuditResult>;
}

export interface RankTrackingProvider {
  rankTracking(domain: string, keywords: string[]): Promise<RankData[]>;
}

export interface CompetitorResearchProvider {
  competitorResearch(domain: string): Promise<CompetitorData[]>;
}
