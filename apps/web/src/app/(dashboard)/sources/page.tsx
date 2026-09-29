'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LinkIcon, Plus, MoreHorizontal, AlertCircle, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { sourcesApi } from '@/services/sources';
import type { Source } from '@/types/api';
import { ApiError } from '@/lib/apiClient';

export default function SourcesPage() {
  const { activeWorkspace } = useWorkspace();
  const [sources, setSources] = React.useState<Source[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newUrl, setNewUrl] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError('');
    try {
      const data = await sourcesApi.list(activeWorkspace.id);
      setSources(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Session expired. Please sign in again.');
      } else {
        setError('Failed to load sources.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  React.useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace || !newName.trim() || !newUrl.trim()) return;
    setSubmitting(true);
    try {
      const src = await sourcesApi.create(activeWorkspace.id, { name: newName.trim(), url: newUrl.trim() });
      setSources((prev) => [src, ...prev]);
      setAdding(false);
      setNewName('');
      setNewUrl('');
    } catch {
      // non-blocking
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(source: Source) {
    if (!activeWorkspace) return;
    setMenuOpen(null);
    try {
      const updated = await sourcesApi.update(activeWorkspace.id, source.id, {
        isActive: !source.isActive,
      });
      setSources((prev) => prev.map((s) => (s.id === source.id ? updated : s)));
    } catch {
      // non-blocking
    }
  }

  async function handleDelete(id: string) {
    if (!activeWorkspace) return;
    setMenuOpen(null);
    try {
      await sourcesApi.remove(activeWorkspace.id, id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // non-blocking
    }
  }

  if (!activeWorkspace) {
    return <EmptyState icon={LinkIcon} title="No workspace" description="Select a workspace to manage sources." />;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Research Sources</h1>
          <p className="text-gray-500">Manage the feeds and sites that power your AI research.</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Source
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={load} className="ml-auto">Retry</Button>
        </div>
      )}

      {adding && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Add New Source</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Source name (e.g. TechCrunch)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="URL (e.g. https://techcrunch.com/feed)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Source'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {sources.length === 0 ? (
        <EmptyState
          icon={LinkIcon}
          title="No sources yet"
          description="Add RSS feeds, websites, or blogs to power your AI research discovery."
          action={<Button onClick={() => setAdding(true)}><Plus className="mr-2 h-4 w-4" /> Add Source</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Source Name</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">URL</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Last Synced</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sources.map((source) => (
                <tr key={source.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <LinkIcon className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                      <span className="font-medium text-gray-900">{source.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 truncate max-w-[200px] hidden md:table-cell">
                    {source.url}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={source.isActive ? 'success' : 'secondary'}>
                      {source.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">
                    {source.lastSyncedAt
                      ? new Date(source.lastSyncedAt).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle(source)}
                        title={source.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {source.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMenuOpen(menuOpen === source.id ? null : source.id)}
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </Button>
                      {menuOpen === source.id && (
                        <div className="absolute right-0 top-8 z-10 w-40 bg-white border border-gray-200 rounded-lg shadow-lg text-left">
                          <button
                            onClick={() => handleDelete(source.id)}
                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
