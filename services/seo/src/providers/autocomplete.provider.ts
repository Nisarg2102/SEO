import { safeFetch } from '@ai-marketing/shared';
import {
  KeywordSuggestion,
  AutocompleteOptions,
} from '../keyword-research.types';

/** Maximum number of unique suggestions to return */
const MAX_SUGGESTIONS = 20;
/** Request timeout in milliseconds */
const TIMEOUT_MS = 5000;

/**
 * Fetches keyword suggestions from Google Autocomplete.
 *
 * Uses the publicly documented suggest API endpoint:
 * https://suggestqueries.google.com/complete/search
 *
 * No API key is required. No user credentials are sent.
 * No seed keyword is logged beyond what the calling service
 * decides to log at its own log level.
 *
 * Security: Input is URL-encoded before being passed to the
 * external endpoint. A timeout prevents indefinite hangs.
 * SSRF is not a risk here because the target URL is
 * hard-coded to a single Google domain — no user-controlled
 * host component is used.
 */
export async function fetchAutocompleteSuggestions(
  seed: string,
  options: AutocompleteOptions = {},
): Promise<KeywordSuggestion[]> {
  const trimmed = seed.trim();
  if (!trimmed) return [];

  const hl = options.language || 'en';
  const gl = options.country || 'us';

  // Google's JSON autocomplete endpoint — returns JSONP with callback=t
  // We parse the inner JSON array after stripping the wrapper.
  const url =
    `https://suggestqueries.google.com/complete/search` +
    `?client=firefox` + // firefox client returns plain JSON array (no JSONP)
    `&hl=${encodeURIComponent(hl)}` +
    `&gl=${encodeURIComponent(gl)}` +
    `&q=${encodeURIComponent(trimmed)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let raw: unknown;
  try {
    const resp = await safeFetch(url, {
      signal: controller.signal,
      headers: {
        // Mimic a plain browser request; no auth headers
        'User-Agent': 'Mozilla/5.0 (compatible; keyword-research-bot/1.0)',
        Accept: 'application/json',
      },
    });

    if (!resp.ok) return [];
    raw = await resp.json();
  } catch {
    // Network error, timeout, or malformed JSON — return empty
    return [];
  } finally {
    clearTimeout(timer);
  }

  // Google returns: [query, [suggestion1, suggestion2, ...]]
  if (!Array.isArray(raw) || !Array.isArray(raw[1])) return [];

  const suggestions: KeywordSuggestion[] = [];
  const seen = new Set<string>();

  for (const item of raw[1]) {
    if (typeof item !== 'string') continue;
    const kw = item.trim().toLowerCase();
    if (!kw || seen.has(kw)) continue;
    seen.add(kw);
    suggestions.push({ keyword: kw, source: 'google_autocomplete' });
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }

  return suggestions;
}
