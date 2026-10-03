import { SEOProvider, KeywordData, AuditResult, RankData, CompetitorData } from './provider.interface';

/**
 * OpenSEO Adapter
 * 
 * Documentation Inspected: 
 * There is currently no active OpenSEO SDK or OpenAPI spec in the project environment. 
 * Therefore, this adapter is built using standard REST HTTP fetch mechanics, assuming a generic REST API for OpenSEO 
 * bound to OPENSEO_URL and authenticated via Bearer token (OPENSEO_API_KEY).
 * 
 * We mock the responses if credentials are not provided to allow development to proceed safely.
 */
export class OpenSEOAdapter implements SEOProvider {
  private baseUrl: string;
  private apiKey: string;
  private isMock: boolean;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.OPENSEO_URL || 'https://api.openseo.example.com';
    this.apiKey = apiKey || process.env.OPENSEO_API_KEY || '';
    this.isMock = !this.apiKey || process.env.NODE_ENV === 'test';
  }

  async healthCheck(): Promise<boolean> {
    if (this.isMock) return false;
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async keywordResearch(query: string): Promise<KeywordData[]> {
    if (this.isMock) {
      throw new Error('NOT_CONFIGURED');
    }

    const res = await fetch(`${this.baseUrl}/keywords?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    if (!res.ok) throw new Error('OpenSEO API Error');
    return res.json();
  }

  async siteAudit(url: string): Promise<AuditResult> {
    if (this.isMock) {
      throw new Error('NOT_CONFIGURED');
    }

    const res = await fetch(`${this.baseUrl}/audit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error('OpenSEO API Error');
    return res.json();
  }

  async competitorResearch(domain: string): Promise<CompetitorData[]> {
    if (this.isMock) {
      throw new Error('NOT_CONFIGURED');
    }

    const res = await fetch(`${this.baseUrl}/competitors?domain=${encodeURIComponent(domain)}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    if (!res.ok) throw new Error('OpenSEO API Error');
    return res.json();
  }

  async rankTracking(domain: string, keywords: string[]): Promise<RankData[]> {
    if (this.isMock) {
      throw new Error('NOT_CONFIGURED');
    }

    const res = await fetch(`${this.baseUrl}/rank`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ domain, keywords })
    });
    if (!res.ok) throw new Error('OpenSEO API Error');
    return res.json();
  }
}
