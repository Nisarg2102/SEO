/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../../lib/apiClient';
import { Card, CardHeader, CardTitle, CardContent, } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function InstagramDashboardPage({ params }: { params: { workspaceId: string } }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [topContent, setTopContent] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const st = await apiClient.get<any>(`/workspaces/${params.workspaceId}/social/instagram/status`);
      setStatus(st);
      if (st.connected) {
        const ins = await apiClient.get<any>(`/workspaces/${params.workspaceId}/social/instagram/insights`);
        const top = await apiClient.get<any[]>(`/workspaces/${params.workspaceId}/social/instagram/top-content`);
        setInsights(ins);
        setTopContent(top);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [params.workspaceId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await apiClient.post(`/workspaces/${params.workspaceId}/social/instagram/sync`, {});
      await loadData();
      alert('Sync complete!');
    } catch (e: any) {
      alert(`Sync failed: ${e.message || 'Unknown error'}`);
    }
    setSyncing(false);
  };

  if (loading) return <div>Loading Instagram Data...</div>;

  if (!status?.connected) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">Instagram Analytics</h1>
          <p className="text-gray-500">Connect your Instagram Professional account to import and analyze content.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <h2 className="text-xl font-bold mb-4">Instagram Not Connected</h2>
            <p className="text-gray-500 mb-6">You need to connect an Instagram Professional account to view analytics.</p>
            <Button onClick={() => window.location.href = `/settings`}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Instagram Analytics</h1>
          <p className="text-gray-500">@{status.username} • Read-only analysis</p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? 'Synchronizing...' : 'Sync Now'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recent Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.recentReach || 'Data unavailable'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recent Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.recentImpressions || 'Data unavailable'}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8">Top Performing Content</h2>
      {topContent.length === 0 ? (
        <p className="text-gray-500">No Instagram data available yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topContent.map(post => (
            <Card key={post.id} className="overflow-hidden">
              {post.thumbnailUrl || post.mediaUrl ? (
                <div 
                  className="h-48 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${post.thumbnailUrl || post.mediaUrl})` }} 
                />
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                  No Media
                </div>
              )}
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2 truncate">{post.caption || 'No caption'}</p>
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span className="capitalize">{post.contentType?.toLowerCase() || 'Post'}</span>
                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>❤️ {post.metrics.likes}</span>
                  <span>💬 {post.metrics.comments}</span>
                </div>
                {post.permalink && (
                  <a href={post.permalink} target="_blank" rel="noreferrer" className="block mt-4 text-center text-sm text-blue-600 hover:underline">
                    View on Instagram
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
