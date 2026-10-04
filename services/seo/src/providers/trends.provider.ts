import { safeFetch } from '@ai-marketing/shared';
import {
  KeywordTrend,
  RelatedQuery,
  KeywordComparison,
  TrendsOptions,
} from '../keyword-research.types';

/**
 * Google Trends provider using the unofficial widget API.
 *
 * ⚠️  LIMITATION NOTICE (documented, not hidden):
 * Google Trends does not provide an official public REST API.
 * This implementation uses the same undocumented JSON endpoint
 * that the Trends website calls in the browser. Google may
 * throttle or break this endpoint without notice.
 *
 * Throttling mitigation: Results are cached by the
 * KeywordResearchService using an in-process TTL cache so that
 * identical queries within the cache window do not hit Google.
 *
 * The 'google-trends-api' npm package (last published 2021,
 * unmaintained) was evaluated and rejected because:
 * - It uses the same undocumented endpoint
 * - It has not been updated for newer Trends response formats
 * - Adding an unmaintained package adds supply-chain risk
 *
 * We therefore implement the minimal required calls directly
 * using fetch, which lets us control timeouts and handle errors.
 *
 * Data returned is RELATIVE INTEREST (0–100), not search volume.
 * This is clearly labelled in all returned types and UI.
 */

const TIMEOUT_MS = 8000;
const TRENDS_BASE = 'https://trends.google.com';

/** Parse the Trends JSON response (strips the leading ")]}',\n" XSSI guard) */
function parseTrendsJson(text: string): unknown {
  // Google prepends ")]}',\n" to prevent JSON hijacking
  const cleaned = text.replace(/^\)\]\}',\n/, '').trim();
  return JSON.parse(cleaned);
}

/** Build a signed Trends widget token for a keyword. Returns null on failure. */
async function getWidgetToken(
  keyword: string,
  geo: string,
  period: string, // e.g. "today 3-m"
  signal: AbortSignal,
): Promise<{ token: string; req: string } | null> {
  const comparisonItem = [{ keyword, geo, time: period }];
  const url =
    `${TRENDS_BASE}/trends/api/explore?hl=en-US&tz=-330` +
    `&req=${encodeURIComponent(JSON.stringify({ comparisonItem, category: 0, property: '' }))}`;

  try {
    const resp = await safeFetch(url, {
      signal,
      headers: { Accept: 'text/javascript, */*', 'User-Agent': 'Mozilla/5.0 (compatible)' },
    });
    if (!resp.ok) return null;
    const text = await resp.text();
    const data = parseTrendsJson(text) as { widgets?: { id: string; token: string; request: object }[] };
    if (!data?.widgets) return null;

    const widget = data.widgets.find((w) => w.id === 'TIMESERIES');
    if (!widget) return null;
    return { token: widget.token, req: JSON.stringify(widget.request) };
  } catch {
    return null;
  }
}

/**
 * Fetch interest-over-time for a single keyword.
 * Returns null if Trends is unavailable or throttling.
 */
export async function fetchTrendsInterest(
  keyword: string,
  options: TrendsOptions = {},
): Promise<KeywordTrend | null> {
  const geo = (options.country || 'US').toUpperCase();
  const days = options.days || 90;

  // Map days to Trends period string
  let period = 'today 3-m';
  if (days <= 7) period = 'now 7-d';
  else if (days <= 30) period = 'today 1-m';
  else if (days <= 90) period = 'today 3-m';
  else if (days <= 365) period = 'today 12-m';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const widget = await getWidgetToken(keyword.trim(), geo, period, controller.signal);
    if (!widget) return null;

    const tsUrl =
      `${TRENDS_BASE}/trends/api/widgetdata/multiline?hl=en-US&tz=-330` +
      `&req=${encodeURIComponent(widget.req)}` +
      `&token=${encodeURIComponent(widget.token)}`;

    const resp = await safeFetch(tsUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/javascript, */*', 'User-Agent': 'Mozilla/5.0 (compatible)' },
    });
    if (!resp.ok) return null;
    const text = await resp.text();
    const data = parseTrendsJson(text) as {
      default?: { timelineData?: { time: string; value: number[] }[] };
    };

    const timeline = data?.default?.timelineData;
    if (!Array.isArray(timeline) || timeline.length === 0) return null;

    const points = timeline.map((pt) => ({
      date: new Date(parseInt(pt.time, 10) * 1000).toISOString().split('T')[0],
      interest: pt.value[0] ?? 0,
    }));

    const currentInterest = points[points.length - 1]?.interest ?? 0;
    const prevInterest = points[Math.max(0, points.length - 4)]?.interest ?? 0;
    const isRising = currentInterest > prevInterest;

    return { keyword, interestOverTime: points, currentInterest, isRising };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch related queries for a keyword from Trends.
 * Returns an empty array if unavailable.
 */
export async function fetchRelatedQueries(
  keyword: string,
  options: TrendsOptions = {},
): Promise<RelatedQuery[]> {
  const geo = (options.country || 'US').toUpperCase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const comparisonItem = [{ keyword, geo, time: 'today 3-m' }];
    const exploreUrl =
      `${TRENDS_BASE}/trends/api/explore?hl=en-US&tz=-330` +
      `&req=${encodeURIComponent(JSON.stringify({ comparisonItem, category: 0, property: '' }))}`;

    const exploreResp = await safeFetch(exploreUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/javascript, */*', 'User-Agent': 'Mozilla/5.0 (compatible)' },
    });
    if (!exploreResp.ok) return [];
    const exploreText = await exploreResp.text();
    const exploreData = parseTrendsJson(exploreText) as {
      widgets?: { id: string; token: string; request: object }[];
    };

    const relWidget = exploreData?.widgets?.find((w) => w.id === 'RELATED_QUERIES');
    if (!relWidget) return [];

    const relUrl =
      `${TRENDS_BASE}/trends/api/widgetdata/relatedsearches?hl=en-US&tz=-330` +
      `&req=${encodeURIComponent(JSON.stringify(relWidget.request))}` +
      `&token=${encodeURIComponent(relWidget.token)}`;

    const relResp = await safeFetch(relUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/javascript, */*', 'User-Agent': 'Mozilla/5.0 (compatible)' },
    });
    if (!relResp.ok) return [];
    const relText = await relResp.text();
    const relData = parseTrendsJson(relText) as {
      default?: {
        rankedList?: { rankedKeyword?: { query: string; value: number; link: string }[] }[];
      };
    };

    const results: RelatedQuery[] = [];
    const lists = relData?.default?.rankedList ?? [];

    for (const list of lists) {
      for (const item of list.rankedKeyword ?? []) {
        if (!item.query) continue;
        const isRising = item.link?.includes('RISING') ?? false;
        results.push({
          keyword: item.query,
          value: item.value === 5000 ? 'Breakout' : item.value,
          isRising,
        });
        if (results.length >= 10) break;
      }
      if (results.length >= 10) break;
    }

    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Compare up to 5 keywords by their current Trends interest.
 * Returns interest at the most recent time point for each.
 */
export async function compareKeywords(
  keywords: string[],
  options: TrendsOptions = {},
): Promise<KeywordComparison> {
  const safe = keywords.slice(0, 5).filter((k) => k.trim());
  if (safe.length === 0) return { keywords: [], interests: {} };

  const geo = (options.country || 'US').toUpperCase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const comparisonItem = safe.map((k) => ({ keyword: k.trim(), geo, time: 'today 3-m' }));
    const url =
      `${TRENDS_BASE}/trends/api/explore?hl=en-US&tz=-330` +
      `&req=${encodeURIComponent(JSON.stringify({ comparisonItem, category: 0, property: '' }))}`;

    const resp = await safeFetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/javascript, */*', 'User-Agent': 'Mozilla/5.0 (compatible)' },
    });
    if (!resp.ok) return { keywords: safe, interests: Object.fromEntries(safe.map((k) => [k, 0])) };

    const text = await resp.text();
    const data = parseTrendsJson(text) as {
      widgets?: { id: string; token: string; request: object }[];
    };

    const tsWidget = data?.widgets?.find((w) => w.id === 'TIMESERIES');
    if (!tsWidget) return { keywords: safe, interests: Object.fromEntries(safe.map((k) => [k, 0])) };

    const tsUrl =
      `${TRENDS_BASE}/trends/api/widgetdata/multiline?hl=en-US&tz=-330` +
      `&req=${encodeURIComponent(JSON.stringify(tsWidget.request))}` +
      `&token=${encodeURIComponent(tsWidget.token)}`;

    const tsResp = await safeFetch(tsUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/javascript, */*', 'User-Agent': 'Mozilla/5.0 (compatible)' },
    });
    if (!tsResp.ok) return { keywords: safe, interests: Object.fromEntries(safe.map((k) => [k, 0])) };

    const tsText = await tsResp.text();
    const tsData = parseTrendsJson(tsText) as {
      default?: { timelineData?: { time: string; value: number[] }[] };
    };

    const timeline = tsData?.default?.timelineData ?? [];
    const last = timeline[timeline.length - 1];
    const interests: Record<string, number> = {};

    safe.forEach((k, i) => {
      interests[k] = last?.value[i] ?? 0;
    });

    return { keywords: safe, interests };
  } catch {
    return { keywords: safe, interests: Object.fromEntries(safe.map((k) => [k, 0])) };
  } finally {
    clearTimeout(timer);
  }
}
