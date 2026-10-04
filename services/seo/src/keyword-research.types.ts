/**
 * Application-level types for keyword research.
 * All data returned here must be sourced from real free APIs.
 * Do NOT add fake "monthly search volume" fields.
 */

/** A single keyword suggestion from Google Autocomplete */
export interface KeywordSuggestion {
  keyword: string;
  /** Source is always 'google_autocomplete' */
  source: 'google_autocomplete';
}

/** A single point of trend interest over time (0–100 relative scale) */
export interface TrendPoint {
  date: string; // ISO date string
  interest: number; // 0–100 Google Trends relative interest
}

/** Trend data for a single keyword */
export interface KeywordTrend {
  keyword: string;
  /** Relative interest over time. NOT monthly search volume. */
  interestOverTime: TrendPoint[];
  /** Current relative interest 0–100 */
  currentInterest: number;
  /** Whether the term is currently rising */
  isRising: boolean;
}

/** A related keyword discovered from Google Trends */
export interface RelatedQuery {
  keyword: string;
  /** Relative interest value 0–100 or "Breakout" */
  value: number | 'Breakout';
  isRising: boolean;
}

/** Comparison of multiple keywords by trend interest */
export interface KeywordComparison {
  keywords: string[];
  /** Relative interest per keyword at current time */
  interests: Record<string, number>;
}

/** A query from the workspace's Search Console data */
export interface GscQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Combined result of a keyword research session.
 * Sources are clearly labelled; no fields are fabricated.
 */
export interface KeywordResearchResult {
  seed: string;
  language: string;
  country: string;
  /** Google Autocomplete suggestions */
  suggestions: KeywordSuggestion[];
  /** Google Trends interest data */
  trend: KeywordTrend | null;
  /** Related/rising queries from Google Trends */
  relatedQueries: RelatedQuery[];
  /** Existing GSC data for the seed keyword */
  gscData: GscQuery | null;
  /** Data source disclaimer always surfaced to the UI */
  disclaimer: string;
}

/** Options for autocomplete requests */
export interface AutocompleteOptions {
  language?: string;
  country?: string;
}

/** Options for trends requests */
export interface TrendsOptions {
  language?: string;
  country?: string;
  /** Period in days (default 90) */
  days?: number;
}
