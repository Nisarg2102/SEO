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

export interface SEOProvider {
  healthCheck(): Promise<boolean>;
  keywordResearch(query: string): Promise<KeywordData[]>;
  siteAudit(url: string): Promise<AuditResult>;
  competitorResearch(domain: string): Promise<CompetitorData[]>;
  rankTracking(domain: string, keywords: string[]): Promise<RankData[]>;
}
