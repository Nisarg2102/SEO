'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface Source {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  sourceTier: string;
}

interface ResearchItem {
  id: string;
  title: string;
  url: string;
  topic: string | null;
  summary: string;
  audience: string | null;
  intent: string;
  relevanceReason: string | null;
  confidence: number;
  status: string;
  suggestedContentFormats: string;
  publishedAt: string;
  createdAt: string;
  source: Source;
}

const CONFIDENCE_OPTIONS = [
  { label: 'Any confidence', value: '' },
  { label: '≥ 80%', value: '0.8' },
  { label: '≥ 60%', value: '0.6' },
  { label: '≥ 40%', value: '0.4' },
];

export default function ResearchPage({ params }: { params: { workspaceId: string } }) {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterMinConfidence, setFilterMinConfidence] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const fetchResearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params_ = new URLSearchParams();
      if (search) params_.set('search', search);
      if (filterSource) params_.set('sourceId', filterSource);
      if (filterMinConfidence) params_.set('minConfidence', filterMinConfidence);
      if (filterFromDate) params_.set('fromDate', filterFromDate);
      if (filterToDate) params_.set('toDate', filterToDate);
      const qs = params_.toString();

      const data = await apiClient.get<ResearchItem[]>(
        `workspaces/${params.workspaceId}/research${qs ? `?${qs}` : ''}`,
      );
      setItems(data);
    } catch {
      setError('Failed to load research items. Please try again.');
    }
    setLoading(false);
  }, [params.workspaceId, search, filterSource, filterMinConfidence, filterFromDate, filterToDate]);

  const fetchSources = useCallback(async () => {
    try {
      const data = await apiClient.get<Source[]>(`workspaces/${params.workspaceId}/sources`);
      setSources(data);
    } catch {}
  }, [params.workspaceId]);

  useEffect(() => {
    fetchSources();
    fetchResearch();
  }, [fetchSources, fetchResearch]);

  const handleSync = async () => {
    setSyncStatus('queuing');
    try {
      const result = await apiClient.post<{ message: string; jobId: string }>(
        `workspaces/${params.workspaceId}/research/sync`,
      );
      setSyncStatus(`Sync queued (Job ${result.jobId}). New items will appear shortly.`);
      // Poll once after 5 seconds to pick up results
      setTimeout(() => {
        fetchResearch();
        setSyncStatus(null);
      }, 5000);
    } catch {
      setSyncStatus('Failed to queue sync. Please try again.');
    }
  };

  const handleConvert = async (item: ResearchItem) => {
    if (!confirm(`Convert "${item.topic || item.title}" into a Content Idea?`)) return;
    setConverting(item.id);
    try {
      await apiClient.post(`workspaces/${params.workspaceId}/research/${item.id}/convert`, {
        title: item.topic || item.title,
      });
      fetchResearch();
    } catch {
      alert('Failed to convert research item. Please try again.');
    }
    setConverting(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterSource('');
    setFilterMinConfidence('');
    setFilterFromDate('');
    setFilterToDate('');
  };

  const hasFilters = search || filterSource || filterMinConfidence || filterFromDate || filterToDate;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Research Engine</h1>
          <p className="text-gray-500 text-sm">
            Industry monitoring and AI analysis of your configured sources.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncStatus === 'queuing'}
          className="shrink-0 bg-green-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {syncStatus === 'queuing' ? 'Queuing sync...' : 'Sync Sources Now'}
        </button>
      </div>

      {/* Sync status banner */}
      {syncStatus && syncStatus !== 'queuing' && (
        <div className={`mb-4 p-3 rounded text-sm ${syncStatus.startsWith('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {syncStatus}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search title, topic, summary..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full"
          />
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full"
          >
            <option value="">All sources</option>
            {sources.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filterMinConfidence}
            onChange={e => setFilterMinConfidence(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full"
          >
            {CONFIDENCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={filterFromDate}
              onChange={e => setFilterFromDate(e.target.value)}
              className="border rounded px-2 py-2 text-sm flex-1"
              title="From date"
            />
            <span className="text-gray-400 text-xs">–</span>
            <input
              type="date"
              value={filterToDate}
              onChange={e => setFilterToDate(e.target.value)}
              className="border rounded px-2 py-2 text-sm flex-1"
              title="To date"
            />
          </div>
        </div>
        {hasFilters && (
          <div className="mt-2 text-right">
            <button onClick={handleClearFilters} className="text-xs text-gray-500 hover:text-gray-700 underline">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-700 mb-2">{error}</p>
          <button onClick={fetchResearch} className="text-red-600 font-medium hover:underline text-sm">
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-12 text-center rounded shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500 mb-2">
            {hasFilters ? 'No research items match your filters.' : 'No research items collected yet.'}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {hasFilters
              ? 'Try adjusting or clearing your filters.'
              : 'Add RSS/Atom sources in the Sources page, then click Sync Sources Now.'}
          </p>
          {hasFilters ? (
            <button onClick={handleClearFilters} className="text-blue-600 font-medium hover:underline text-sm">
              Clear filters
            </button>
          ) : (
            <button onClick={handleSync} className="text-blue-600 font-medium hover:underline text-sm">
              Run a sync
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 mb-1">{items.length} item{items.length !== 1 ? 's' : ''} found</p>
          {items.map(item => {
            let formats: string[] = [];
            try { formats = JSON.parse(item.suggestedContentFormats || '[]'); } catch {}

            const confidencePct = Math.round(item.confidence * 100);
            const confidenceColor =
              confidencePct >= 80 ? 'bg-emerald-100 text-emerald-800' :
              confidencePct >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-600';

            return (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1 min-w-0">
                    {/* Source & meta */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-1 rounded border border-indigo-200">
                        {item.source?.name}
                      </span>
                      <span className="text-xs text-gray-400 uppercase">{item.source?.sourceType}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString()
                          : new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.status === 'converted' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Title */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold text-gray-900 hover:text-blue-600 hover:underline mb-1 block truncate"
                      title={item.topic || item.title}
                    >
                      {item.topic || item.title}
                    </a>

                    {/* Summary */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.summary}</p>

                    {/* Relevance reason */}
                    {item.relevanceReason && (
                      <p className="text-xs text-gray-500 italic mb-3 border-l-2 border-gray-200 pl-2">
                        {item.relevanceReason}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200">
                        <strong>Intent:</strong> {item.intent}
                      </div>
                      {item.audience && (
                        <div className="bg-sky-50 text-sky-800 px-2 py-1 rounded border border-sky-200">
                          <strong>Audience:</strong> {item.audience}
                        </div>
                      )}
                      <div className={`px-2 py-1 rounded border ${confidenceColor} border-current/20`}>
                        <strong>AI Confidence:</strong> {confidencePct}%
                      </div>
                      {formats.map((f: string) => (
                        <div key={f} className="bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-200">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-center justify-end gap-2 md:w-40 shrink-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center border border-gray-300 text-gray-600 px-3 py-2 rounded text-sm hover:bg-gray-50 transition"
                    >
                      View Source ↗
                    </a>
                    {item.status !== 'converted' && (
                      <button
                        onClick={() => handleConvert(item)}
                        disabled={converting === item.id}
                        className="w-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition disabled:opacity-50"
                      >
                        {converting === item.id ? 'Converting...' : 'Create Content Idea'}
                      </button>
                    )}
                    {item.status === 'converted' && (
                      <div className="w-full text-center text-xs text-purple-600 font-medium py-2">
                        ✓ Idea created
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
