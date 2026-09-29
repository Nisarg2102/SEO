'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart, TrendingUp, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { seoApi } from '@/services/seo';
import type { SeoOpportunity } from '@/types/api';
import { ApiError } from '@/lib/apiClient';
import Link from 'next/link';

function PriorityBadge({ priority }: { priority: SeoOpportunity['priority'] }) {
  const map = { HIGH: 'destructive', MEDIUM: 'warning', LOW: 'secondary' } as const;
  return <Badge variant={map[priority] ?? 'secondary'}>{priority}</Badge>;
}

export default function SEOPage() {
  const { activeWorkspace } = useWorkspace();
  const [opportunities, setOpportunities] = React.useState<SeoOpportunity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [converting, setConverting] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError('');
    seoApi
      .listOpportunities(activeWorkspace.id)
      .then(setOpportunities)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError('Session expired. Please sign in again.');
        } else {
          setError('Failed to load SEO data.');
        }
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  async function handleConvert(opp: SeoOpportunity) {
    if (!activeWorkspace) return;
    setConverting(opp.id);
    try {
      await seoApi.convertToIdea(activeWorkspace.id, opp.id);
    } catch {
      // non-blocking
    } finally {
      setConverting(null);
    }
  }

  if (!activeWorkspace) {
    return <EmptyState icon={Search} title="No workspace" description="Select a workspace to view SEO data." />;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-40 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const totalClicks = opportunities.reduce((s, o) => s + (o.clicks ?? 0), 0);
  const totalImpressions = opportunities.reduce((s, o) => s + (o.impressions ?? 0), 0);
  const avgPosition =
    opportunities.length > 0
      ? opportunities.reduce((s, o) => s + (o.currentPosition ?? 0), 0) / opportunities.length
      : null;
  const avgCtr =
    opportunities.length > 0
      ? opportunities.reduce((s, o) => s + (o.ctr ?? 0), 0) / opportunities.length
      : null;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">SEO Performance</h1>
          <p className="text-gray-500">Keyword opportunities and optimization insights.</p>
        </div>
      </div>

      {opportunities.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <BarChart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Search className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgCtr !== null ? `${(avgCtr * 100).toFixed(1)}%` : '—'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Position</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgPosition !== null ? avgPosition.toFixed(1) : '—'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Keyword Opportunities</h2>

        {opportunities.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No SEO opportunities yet"
            description="Connect Google Search Console or run an analysis to discover keyword opportunities."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.map((opp) => (
              <Card key={opp.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{opp.keyword}</h3>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                        {opp.currentPosition && <span>Pos: {opp.currentPosition}</span>}
                        {opp.impressions && <span>Imp: {opp.impressions.toLocaleString()}</span>}
                        {opp.clicks && <span>Clicks: {opp.clicks.toLocaleString()}</span>}
                        {opp.ctr != null && <span>CTR: {(opp.ctr * 100).toFixed(1)}%</span>}
                      </div>
                    </div>
                    <PriorityBadge priority={opp.priority} />
                  </div>

                  {opp.recommendation && (
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                      <p>{opp.recommendation}</p>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <Link href="/content/create">
                      <Button
                        size="sm"
                        onClick={() => handleConvert(opp)}
                        disabled={converting === opp.id}
                      >
                        {converting === opp.id ? 'Creating...' : 'Create Content Idea'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
