import { RankTrackingProvider, RankData } from '../provider.interface';

export class SearchConsoleSEOProvider implements RankTrackingProvider {
  async rankTracking(domain: string, keywords: string[]): Promise<RankData[]> {
    // TODO: Connect this to the existing GSC Service or fetch from DB
    return keywords.map(kw => ({
      keyword: kw,
      position: 0,
      url: `https://${domain}/`,
      change: 0
    }));
  }
}
