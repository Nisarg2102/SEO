'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Sparkles, BookOpen, ExternalLink, Filter, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { researchApi } from '@/services/research';
import type { ResearchItem } from '@/types/api';
import { ApiError } from '@/lib/apiClient';
import Link from 'next/link';

export default function ResearchPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = React.useState<ResearchItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [syncMessage, setSyncMessage] = React.useState('');

  const load = React.useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError('');
    try {
      const data = await researchApi.list(activeWorkspace.id);
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Session expired. Please sign in again.');
      } else {
        setError('Failed to load research. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  React.useEffect(() => { load(); }, [load]);

  async function handleSync() {
    if (!activeWorkspace) return;
    setSyncing(true);
    setSyncMessage('');
    try {
      const result = await researchApi.sync(activeWorkspace.id);
      setSyncMessage(result.message);
    } catch {
      setSyncMessage('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  }

  async function handleConvert(item: ResearchItem) {
    if (!activeWorkspace) return;
    try {
      await researchApi.convertToIdea(activeWorkspace.id, item.id, item.title);
    } catch {
      // non-blocking — user can retry
    }
  }

  if (!activeWorkspace) {
    return <EmptyState icon={TrendingUp} title="No workspace" description="Select a workspace to view research." />;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Research Discovery</h1>
          <p className="text-gray-500">AI-curated opportunities based on your industry sources.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Link href="/sources">
            <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Sources</Button>
          </Link>
        </div>
      </div>

      {syncMessage && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          {syncMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={load} className="ml-auto">Retry</Button>
        </div>
      )}

      {!error && items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No research items yet"
          description="Add sources and click &ldquo;Sync Now&rdquo; to discover content opportunities from your feeds."
          action={
            <Link href="/sources">
              <Button>Manage Sources</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:border-blue-200 transition-colors">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {item.topic && <Badge variant="blue">{item.topic}</Badge>}
                        {item.sourceName && (
                          <span className="text-sm text-gray-500 flex items-center">
                            <BookOpen className="mr-1 h-3 w-3" />
                            {item.sourceName}
                          </span>
                        )}
                        {item.publishedAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(item.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                    </div>
                  </div>

                  <p className="text-gray-600">{item.summary}</p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {item.targetAudience && (
                      <Badge variant="outline">Target: {item.targetAudience}</Badge>
                    )}
                    {item.intent && <Badge variant="outline">Intent: {item.intent}</Badge>}
                    {item.suggestedFormats?.map((f) => (
                      <Badge key={f} variant="outline">{f}</Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center space-y-3 min-w-[200px]">
                  <Link href="/content/create">
                    <Button className="w-full" onClick={() => handleConvert(item)}>
                      <Sparkles className="mr-2 h-4 w-4" /> Create Content
                    </Button>
                  </Link>
                  {item.sourceUrl && (
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700">
                        View Source <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
