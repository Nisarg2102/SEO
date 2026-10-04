'use client';
import { useState } from 'react';
import { apiClient } from '../../../../lib/apiClient';

/** ----------------------------------------------------------------
 *  Types — mirror the backend KeywordResearchResult shape exactly.
 *  No "volume" or fake metric types included.
 * ---------------------------------------------------------------- */
interface KeywordSuggestion {
  keyword: string;
  source: 'google_autocomplete';
}

interface TrendPoint {
  date: string;
  interest: number;
}

interface KeywordTrend {
  keyword: string;
  interestOverTime: TrendPoint[];
  currentInterest: number;
  isRising: boolean;
}

interface RelatedQuery {
  keyword: string;
  value: number | 'Breakout';
  isRising: boolean;
}

interface GscQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface KeywordResearchResult {
  seed: string;
  language: string;
  country: string;
  suggestions: KeywordSuggestion[];
  trend: KeywordTrend | null;
  relatedQueries: RelatedQuery[];
  gscData: GscQuery | null;
  disclaimer: string;
}

/** ----------------------------------------------------------------
 *  Small helpers
 * ---------------------------------------------------------------- */
function Badge({ text, color }: { text: string; color: 'green' | 'blue' | 'gray' | 'red' }) {
  const classes: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${classes[color]}`}>{text}</span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">{children}</p>
  );
}

/** ----------------------------------------------------------------
 *  Main page
 * ---------------------------------------------------------------- */
export default function KeywordResearchPage({ params }: { params: { workspaceId: string } }) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('us');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KeywordResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiClient.get<KeywordResearchResult>(
        `workspaces/${params.workspaceId}/keyword-research?q=${encodeURIComponent(query)}&country=${encodeURIComponent(country)}`,
      );
      setResult(data);
    } catch {
      setError('Could not fetch keyword research. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold">Keyword Research</h1>
        <p className="text-sm text-gray-500 mt-1">
          Free keyword insights powered by Google Autocomplete &amp; Google Trends.
          <span className="ml-1 font-medium text-yellow-700">
            No paid APIs. No fake search volumes.
          </span>
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleResearch} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder='e.g. "computer repair Ahmedabad"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={200}
            required
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="us">US</option>
            <option value="in">India</option>
            <option value="gb">UK</option>
            <option value="au">Australia</option>
            <option value="ca">Canada</option>
          </select>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Researching…' : 'Research'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <>
          {/* Disclaimer — always visible */}
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 rounded-lg">
            ℹ️ {result.disclaimer}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* === Suggestions === */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <SectionLabel>Source: Google Autocomplete</SectionLabel>
              <h2 className="text-base font-bold mb-3">Suggestions</h2>
              {result.suggestions.length === 0 ? (
                <p className="text-sm text-gray-400">No suggestions returned.</p>
              ) : (
                <ul className="space-y-1.5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center text-gray-400 text-xs">{i + 1}.</span>
                      <span
                        className="cursor-pointer hover:text-blue-600"
                        onClick={() => setQuery(s.keyword)}
                        title="Click to research this keyword"
                      >
                        {s.keyword}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* === Trend Interest === */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <SectionLabel>Source: Google Trends (relative interest, 0–100)</SectionLabel>
              <h2 className="text-base font-bold mb-3">Trend Interest</h2>
              {!result.trend ? (
                <p className="text-sm text-gray-400">
                  Trends data unavailable. Google Trends may be throttling requests.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-black text-blue-600">
                      {result.trend.currentInterest}
                      <span className="text-sm font-normal text-gray-400">/100</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Current relative interest</p>
                      {result.trend.isRising ? (
                        <Badge text="↑ Rising" color="green" />
                      ) : (
                        <Badge text="→ Stable/Declining" color="gray" />
                      )}
                    </div>
                  </div>

                  {/* Sparkline-style interest bars */}
                  {result.trend.interestOverTime.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Interest over time</p>
                      <div className="flex items-end gap-0.5 h-12">
                        {result.trend.interestOverTime.slice(-30).map((pt, i) => (
                          <div
                            key={i}
                            title={`${pt.date}: ${pt.interest}`}
                            className="flex-1 bg-blue-200 hover:bg-blue-400 rounded-t transition-colors min-w-[2px]"
                            style={{ height: `${Math.max(4, pt.interest)}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{result.trend.interestOverTime[0]?.date}</span>
                        <span>
                          {result.trend.interestOverTime[result.trend.interestOverTime.length - 1]?.date}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* === Related Queries === */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <SectionLabel>Source: Google Trends</SectionLabel>
              <h2 className="text-base font-bold mb-3">Related Queries</h2>
              {result.relatedQueries.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No related queries available.
                </p>
              ) : (
                <ul className="space-y-2">
                  {result.relatedQueries.map((rq, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span
                        className="cursor-pointer hover:text-blue-600"
                        onClick={() => setQuery(rq.keyword)}
                        title="Click to research this keyword"
                      >
                        {rq.keyword}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {rq.value === 'Breakout' ? (
                          <Badge text="Breakout 🚀" color="green" />
                        ) : (
                          <span className="text-xs text-gray-500">Interest: {rq.value}</span>
                        )}
                        {rq.isRising && <Badge text="Rising" color="blue" />}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* === Search Console Data === */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <SectionLabel>Source: Your Google Search Console Data</SectionLabel>
              <h2 className="text-base font-bold mb-3">Your Search Console Data</h2>
              {!result.gscData ? (
                <p className="text-sm text-gray-400">
                  No Search Console data found for this keyword in your workspace. Sync your GSC
                  data first in the Search Console tab.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Clicks (30d)', value: result.gscData.clicks.toLocaleString() },
                    { label: 'Impressions (30d)', value: result.gscData.impressions.toLocaleString() },
                    { label: 'CTR', value: `${result.gscData.ctr.toFixed(1)}%` },
                    { label: 'Avg. Position', value: result.gscData.position.toFixed(1) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded p-3 text-center border">
                      <div className="text-xl font-bold text-blue-700">{value}</div>
                      <div className="text-xs text-gray-500 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
