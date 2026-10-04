import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  KeywordResearchResult,
  KeywordSuggestion,
  KeywordTrend,
  RelatedQuery,
  GscQuery,
  AutocompleteOptions,
  TrendsOptions,
  KeywordComparison,
  fetchAutocompleteSuggestions,
  fetchTrendsInterest,
  fetchRelatedQueries,
  compareKeywords,
} from '@ai-marketing/seo';

/** In-process TTL cache entry */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/** Simple in-process TTL cache — no Redis dependency required */
class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.store.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }

  /** Evict expired entries to avoid memory growth */
  evict(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

/** Result of a full keyword research session — only honest free data */
const DISCLAIMER =
  'Exact monthly search volume is unavailable in the free provider. ' +
  'Suggestions come from Google Autocomplete. ' +
  'Interest data (0–100) is relative Google Trends data, NOT monthly search volume.';

@Injectable()
export class KeywordResearchService {
  private readonly logger = new Logger(KeywordResearchService.name);

  /** 30-minute cache for autocomplete + trends results */
  private readonly autocompleteCache = new TtlCache<KeywordSuggestion[]>(30 * 60 * 1000);
  private readonly trendsCache = new TtlCache<KeywordTrend | null>(30 * 60 * 1000);
  private readonly relatedCache = new TtlCache<RelatedQuery[]>(30 * 60 * 1000);

  constructor(private readonly prisma: PrismaService) {
    // Evict stale entries every 10 minutes. .unref() allows Jest to exit
    // cleanly without force-killing the worker process.
    const evictionTimer = setInterval(() => {
      this.autocompleteCache.evict();
      this.trendsCache.evict();
      this.relatedCache.evict();
    }, 10 * 60 * 1000);
    evictionTimer.unref();
  }

  /**
   * Full keyword research for a workspace.
   * Combines:
   *  1. Google Autocomplete suggestions
   *  2. Google Trends interest over time + related queries
   *  3. Existing GSC data for the workspace
   *
   * workspace isolation is enforced — GSC data is always
   * queried with the caller-supplied workspaceId.
   */
  async research(
    workspaceId: string,
    seed: string,
    options: AutocompleteOptions & TrendsOptions = {},
  ): Promise<KeywordResearchResult> {
    const trimmed = seed.trim();

    const [suggestions, trend, relatedQueries, gscData] = await Promise.all([
      this.getSuggestions(trimmed, options),
      this.getTrend(trimmed, options),
      this.getRelatedQueries(trimmed, options),
      this.getGscData(workspaceId, trimmed),
    ]);

    return {
      seed: trimmed,
      language: options.language || 'en',
      country: options.country || 'us',
      suggestions,
      trend,
      relatedQueries,
      gscData,
      disclaimer: DISCLAIMER,
    };
  }

  /** Autocomplete suggestions with caching */
  async getSuggestions(seed: string, options: AutocompleteOptions = {}): Promise<KeywordSuggestion[]> {
    const trimmed = seed.trim();
    if (!trimmed) return [];

    const cacheKey = `ac:${trimmed}:${options.language || 'en'}:${options.country || 'us'}`;
    const cached = this.autocompleteCache.get(cacheKey);
    if (cached) return cached;

    const results = await fetchAutocompleteSuggestions(trimmed, options);
    this.autocompleteCache.set(cacheKey, results);
    return results;
  }

  /** Trends interest with caching */
  async getTrend(seed: string, options: TrendsOptions = {}): Promise<KeywordTrend | null> {
    const trimmed = seed.trim();
    if (!trimmed) return null;

    const cacheKey = `tr:${trimmed}:${options.country || 'us'}:${options.days || 90}`;
    const cached = this.trendsCache.get(cacheKey);
    if (cached !== null) return cached;

    const result = await fetchTrendsInterest(trimmed, options);
    this.trendsCache.set(cacheKey, result);
    return result;
  }

  /** Related queries with caching */
  async getRelatedQueries(seed: string, options: TrendsOptions = {}): Promise<RelatedQuery[]> {
    const trimmed = seed.trim();
    if (!trimmed) return [];

    const cacheKey = `rq:${trimmed}:${options.country || 'us'}`;
    const cached = this.relatedCache.get(cacheKey);
    if (cached) return cached;

    const result = await fetchRelatedQueries(trimmed, options);
    this.relatedCache.set(cacheKey, result);
    return result;
  }

  /**
   * Compare multiple keywords by Trends interest.
   * No workspace isolation needed — this is public Trends data.
   */
  async compareKeywords(
    keywords: string[],
    options: TrendsOptions = {},
  ): Promise<KeywordComparison> {
    if (!keywords.length) return { keywords: [], interests: {} };
    return compareKeywords(keywords, options);
  }

  /**
   * Look up existing Search Console data for the keyword within
   * this workspace. Returns null if no data exists.
   *
   * Workspace isolation: workspaceId is always injected into the
   * Prisma where clause — the client cannot cross workspace boundaries.
   */
  private async getGscData(workspaceId: string, query: string): Promise<GscQuery | null> {
    if (!query) return null;

    try {
      const result = await (this.prisma as any).gscMetric.groupBy({
        by: ['query'],
        where: {
          workspaceId,
          query: { contains: query, mode: 'insensitive' },
        },
        _sum: { clicks: true, impressions: true },
        _avg: { ctr: true, position: true },
        take: 1,
      });

      if (!result || result.length === 0) return null;
      const r = result[0];
      return {
        query: r.query,
        clicks: r._sum.clicks || 0,
        impressions: r._sum.impressions || 0,
        ctr: parseFloat((r._avg.ctr || 0).toFixed(2)),
        position: parseFloat((r._avg.position || 0).toFixed(1)),
      };
    } catch (err) {
      this.logger.error('Failed to fetch GSC data for keyword research', (err as Error).message);
      return null;
    }
  }
}
