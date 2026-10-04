import { KeywordResearchProvider, KeywordData } from '../provider.interface';

export class TrendsSEOProvider implements KeywordResearchProvider {
  async keywordResearch(query: string): Promise<KeywordData[]> {
    // TODO: Implement google-trends-api logic here
    // For now, return an empty array or basic stub
    return [
      {
        keyword: query,
        volume: 0, // Relative interest, not absolute
        difficulty: 0, // Not available from Trends
        intent: 'informational'
      }
    ];
  }
}
