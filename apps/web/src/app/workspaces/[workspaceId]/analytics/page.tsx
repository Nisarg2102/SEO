'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface AnalyticsSnapshot {
  id: string;
  date: string;
  impressions: number;
  reach: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  conversions: number;
  metadata?: string;
}

interface PostMetric {
  id: string;
  externalUrl?: string;
  externalId?: string;
  date: string;
  impressions: number;
  clicks: number;
  metadata?: string;
}

export default function AnalyticsPage({ params }: { params: { workspaceId: string } }) {
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [postMetrics, setPostMetrics] = useState<PostMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ snapshots?: AnalyticsSnapshot[]; postMetrics?: PostMetric[] }>(`workspaces/${params.workspaceId}/analytics`);
        setSnapshots(data.snapshots || []);
        setPostMetrics(data.postMetrics || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAnalytics(); }, [params.workspaceId]);

  // Aggregate totals
  const totalImpressions = snapshots.reduce((acc, curr) => acc + curr.impressions, 0);
  const totalClicks = snapshots.reduce((acc, curr) => acc + curr.clicks, 0);

  if (loading) return <div>Loading Analytics...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-500 text-sm">Unified metrics across all your connected platforms.</p>
      </div>

      {snapshots.length === 0 ? (
        <div className="bg-white p-12 text-center rounded shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500">No analytics data found. Connect a source in Settings and run a sync.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 font-medium">Total Impressions</div>
              <div className="text-3xl font-bold mt-1 text-gray-900">{totalImpressions.toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 font-medium">Total Clicks</div>
              <div className="text-3xl font-bold mt-1 text-gray-900">{totalClicks.toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 font-medium">Avg CTR</div>
              <div className="text-3xl font-bold mt-1 text-gray-900">
                {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'}%
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500 font-medium">Days Tracked</div>
              <div className="text-3xl font-bold mt-1 text-gray-900">{snapshots.length}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Top Performing Pages / Posts</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">URL / Post ID</th>
                    <th className="px-6 py-3 font-medium text-right">Impressions</th>
                    <th className="px-6 py-3 font-medium text-right">Clicks</th>
                    <th className="px-6 py-3 font-medium text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {postMetrics.map(post => {
                    const ctr = post.impressions > 0 ? ((post.clicks / post.impressions) * 100).toFixed(2) : '0';
                    return (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 truncate max-w-sm text-blue-600 font-medium">
                          {post.externalUrl || post.externalId}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{post.impressions.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-medium">{post.clicks.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-medium">{ctr}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
