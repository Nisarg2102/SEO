'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface Source {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  sourceTier: string;
  active: boolean;
}

const SOURCE_TYPES = [
  { value: 'rss', label: 'RSS Feed' },
  { value: 'atom', label: 'Atom Feed' },
  { value: 'news', label: 'News (RSS)' },
  { value: 'website', label: 'Website (manual review only)' },
  { value: 'other', label: 'Other' },
];

const SOURCE_TIERS = [
  { value: 'tier1', label: 'Tier 1 – High Priority / Primary' },
  { value: 'tier2', label: 'Tier 2 – General Industry News' },
  { value: 'tier3', label: 'Tier 3 – Competitors / Low Priority' },
];

export default function SourcesPage({ params }: { params: { workspaceId: string } }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '', sourceType: 'rss', sourceTier: 'tier2' });
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Source[]>(`workspaces/${params.workspaceId}/sources`);
      setSources(data);
    } catch {
      setError('Failed to load sources. Please try again.');
    }
    setLoading(false);
  }, [params.workspaceId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await apiClient.post(`workspaces/${params.workspaceId}/sources`, formData);
      setShowModal(false);
      setFormData({ name: '', url: '', sourceType: 'rss', sourceTier: 'tier2' });
      fetchSources();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setFormError(msg || 'Failed to add source. Check the URL and try again.');
    }
  };

  const toggleActive = async (source: Source) => {
    try {
      await apiClient.put(`workspaces/${params.workspaceId}/sources/${source.id}`, { active: !source.active });
      fetchSources();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this source and its research items? This cannot be undone.')) return;
    try {
      await apiClient.delete(`workspaces/${params.workspaceId}/sources/${id}`);
      fetchSources();
    } catch {}
  };

    const handleSyncAll = async () => {
    setSyncingAll(true);
    setSyncMessage(null);
    try {
      const result = await apiClient.post<{ message: string; jobId: string }>(
        `workspaces/${params.workspaceId}/research/sync`,
      );
      setSyncMessage(`✓ ${result.message}`);
    } catch (err: unknown) {
      setSyncMessage(`Sync failed: ${(err as Error).message || 'Unknown error'}`);
    }
    setSyncingAll(false);
  };

  const tierLabel = (tier: string) => SOURCE_TIERS.find(t => t.value === tier)?.label?.split(' – ')[0] || tier;
  const typeLabel = (type: string) => SOURCE_TYPES.find(t => t.value === type)?.label || type;
  const canAutoCollect = (type: string) => ['rss', 'atom', 'news'].includes(type);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Research Sources</h1>
          <p className="text-sm text-gray-500">Manage RSS/Atom feeds and other sources for research collection.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleSyncAll}
            disabled={syncingAll || sources.filter(s => s.active).length === 0}
            className="border border-green-600 text-green-700 px-4 py-2 rounded font-medium text-sm hover:bg-green-50 disabled:opacity-40"
          >
            {syncingAll ? 'Queuing...' : 'Sync All Active'}
          </button>
          <button
            onClick={() => { setShowModal(true); setFormError(null); }}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-blue-700"
          >
            + Add Source
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className={`mb-4 p-3 rounded text-sm ${syncMessage.startsWith('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {syncMessage}
          <button onClick={() => setSyncMessage(null)} className="ml-2 opacity-50 hover:opacity-100">×</button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 divide-y">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={fetchSources} className="mt-2 text-red-600 underline text-sm">Retry</button>
        </div>
      ) : sources.length === 0 ? (
        <div className="bg-white p-12 text-center rounded shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500 mb-2 font-medium">No sources configured yet.</p>
          <p className="text-sm text-gray-400 mb-4">
            Add an RSS or Atom feed URL. The research engine will automatically collect and analyze articles from active sources.
          </p>
          <button onClick={() => setShowModal(true)} className="text-blue-600 font-medium hover:underline text-sm">
            + Add your first source
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sources.map(source => (
                <tr key={source.id} className={!source.active ? 'opacity-60' : ''}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{source.name}</div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-blue-600 hover:underline max-w-xs truncate block"
                    >
                      {source.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {typeLabel(source.sourceType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {tierLabel(source.sourceTier)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canAutoCollect(source.sourceType) ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">Auto-collected</span>
                    ) : (
                      <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-200">Manual review</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(source)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${source.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {source.active ? '● Active' : '○ Disabled'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(source.id)}
                      className="text-red-600 hover:text-red-800 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Source Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Research Source</h2>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {formError}
              </div>
            )}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Search Engine Journal"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feed URL <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="url"
                  className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="https://www.searchenginejournal.com/feed/"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">Must be a valid http:// or https:// URL</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <select
                  className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.sourceType}
                  onChange={e => setFormData({ ...formData, sourceType: e.target.value })}
                >
                  {SOURCE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {!canAutoCollect(formData.sourceType) && (
                  <p className="text-xs text-amber-600 mt-1">⚠ This type is not automatically collected — items must be added manually.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Tier <span className="text-red-500">*</span></label>
                <select
                  className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.sourceTier}
                  onChange={e => setFormData({ ...formData, sourceTier: e.target.value })}
                >
                  {SOURCE_TIERS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(null); }}
                  className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700">
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
