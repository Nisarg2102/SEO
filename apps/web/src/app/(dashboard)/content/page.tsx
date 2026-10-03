'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, Plus, Search, MoreHorizontal, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { contentApi } from '@/services/content';
import type { ContentPack, ContentStatus } from '@/types/api';
import { ApiError } from '@/lib/apiClient';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'In Review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  rejected: 'Rejected',
  DRAFT: 'Draft',
  CLINICAL_REVIEW_REQUIRED: 'Clinical Review Req',
  PROFESSIONALLY_REVIEWED: 'Professionally Reviewed',
  APPROVED: 'Approved',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published'
};

const STATUS_VARIANTS: Record<ContentStatus, 'success' | 'warning' | 'secondary' | 'blue' | 'destructive'> = {
  published: 'success',
  scheduled: 'blue',
  approved: 'success',
  pending_approval: 'warning',
  draft: 'secondary',
  rejected: 'destructive',
};

type StatusFilter = ContentStatus | 'all';

export default function ContentPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = React.useState<ContentPack[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [menuOpen, setMenuOpen] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError('');
    try {
      const data = await contentApi.list(activeWorkspace.id);
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Session expired. Please sign in again.');
      } else {
        setError('Failed to load content.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!activeWorkspace) return;
    setMenuOpen(null);
    try {
      await contentApi.remove(activeWorkspace.id, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // non-blocking
    }
  }

  async function handleStatusChange(id: string, status: ContentStatus) {
    if (!activeWorkspace) return;
    setMenuOpen(null);
    try {
      const updated = await contentApi.update(activeWorkspace.id, id, { status });
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch {
      // non-blocking
    }
  }

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.topic.toLowerCase().includes(search.toLowerCase()) ||
      item.platform.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!activeWorkspace) {
    return <EmptyState icon={FileText} title="No workspace" description="Select a workspace to manage content." />;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Content Library</h1>
          <p className="text-gray-500">Manage, review, and schedule your marketing content.</p>
        </div>
        <Button asChild>
          <Link href="/content/create"><Plus className="mr-2 h-4 w-4" /> Create Content</Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={load} className="ml-auto">Retry</Button>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          {(Object.keys(STATUS_LABELS) as ContentStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No content found"
          description={
            items.length === 0
              ? 'Create your first piece of content using the AI wizard.'
              : 'No content matches your current filters.'
          }
          action={
            items.length === 0 ? (
              <Button asChild>
                <Link href="/content/create"><Plus className="mr-2 h-4 w-4" /> Create Content</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Content</th>
                <th className="px-6 py-3 font-medium">Platform</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors relative">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-xs">{item.topic}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.platform}</td>
                  <td className="px-6 py-4">
                    <Badge variant={STATUS_VARIANTS[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                      {item.scheduledAt
                        ? new Date(item.scheduledAt).toLocaleDateString()
                        : new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)}
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </Button>
                      {menuOpen === item.id && (
                        <div className="absolute right-0 top-8 z-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg text-left">
                          {(item.status === 'draft' || item.status === 'DRAFT') && (
                            <button
                              onClick={() => handleStatusChange(item.id, activeWorkspace?.type === 'MEDICAL' ? 'CLINICAL_REVIEW_REQUIRED' : 'PENDING_APPROVAL')}
                              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                            >
                              Submit for Review
                            </button>
                          )}
                          {(item.status === 'pending_approval' || item.status === 'CLINICAL_REVIEW_REQUIRED') && (
                            <button
                              onClick={() => handleStatusChange(item.id, activeWorkspace?.type === 'MEDICAL' ? 'PROFESSIONALLY_REVIEWED' : 'APPROVED')}
                              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                            >
                              Approve
                            </button>
                          )}
                          
                          {item.status === 'PROFESSIONALLY_REVIEWED' && (
                            <button
                              onClick={() => handleStatusChange(item.id, 'APPROVED')}
                              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                            >
                              Final Approve
                            </button>
                          )}
{(item.status === 'approved' || item.status === 'APPROVED') && (
                            <button
                              onClick={() => handleStatusChange(item.id, 'SCHEDULED')}
                              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                            >
                              Mark as Scheduled
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
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
