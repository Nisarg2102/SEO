'use client';

import * as React from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, AlertCircle } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { analyticsApi } from '@/services/analytics';
import type { AnalyticsDashboard } from '@/types/api';
import { ApiError } from '@/lib/apiClient';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { activeWorkspace } = useWorkspace();
  const [data, setData] = React.useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError('');
    analyticsApi
      .getDashboard(activeWorkspace.id)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError('Session expired. Please sign in again.');
        } else if (err instanceof ApiError && err.status === 404) {
          setData(null); // no analytics configured yet
        } else {
          setError('Failed to load analytics.');
        }
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const hasData =
    data &&
    (data.totalClicks != null ||
      data.totalImpressions != null ||
      (data.recentMetrics && data.recentMetrics.length > 0));

  if (!activeWorkspace) {
    return <EmptyState icon={BarChart3} title="No workspace" description="Select a workspace to view analytics." />;
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics</h1>
          <p className="text-gray-500">Measure the impact of your marketing efforts.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!error && !hasData && (
        <EmptyState
          icon={BarChart3}
          title="No analytics data yet"
          description="Connect Google Search Console to import SEO performance data, or publish content to start tracking social media engagement."
          action={
            <Button asChild>
              <Link href="/settings">Configure Integrations</Link>
            </Button>
          }
        />
      )}

      {!error && hasData && data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.totalClicks != null && (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-500">Total Clicks</p>
                <p className="text-3xl font-bold mt-1">{data.totalClicks.toLocaleString()}</p>
              </CardContent>
            </Card>
          )}
          {data.totalImpressions != null && (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-500">Impressions</p>
                <p className="text-3xl font-bold mt-1">{data.totalImpressions.toLocaleString()}</p>
              </CardContent>
            </Card>
          )}
          {data.averagePosition != null && (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-500">Avg Position</p>
                <p className="text-3xl font-bold mt-1">{data.averagePosition.toFixed(1)}</p>
              </CardContent>
            </Card>
          )}
          {data.averageCtr != null && (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-500">Avg CTR</p>
                <p className="text-3xl font-bold mt-1">{(data.averageCtr * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
