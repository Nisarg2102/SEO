'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Search, Sparkles, TrendingUp, BarChart, PenTool, AlertCircle } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { workspacesApi } from '@/services/workspaces';
import { contentApi } from '@/services/content';
import { researchApi } from '@/services/research';
import type { WorkspaceStats, ContentPack, ResearchItem } from '@/types/api';
import { ApiError } from '@/lib/apiClient';

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ContentStatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'warning' | 'secondary' | 'blue' | 'destructive'> = {
    published: 'success',
    scheduled: 'blue',
    approved: 'success',
    pending_approval: 'warning',
    draft: 'secondary',
    rejected: 'destructive',
  };
  return <Badge variant={map[status] ?? 'secondary'}>{status.replace('_', ' ')}</Badge>;
}

export default function DashboardPage() {
  const { activeWorkspace, setCreateModalOpen } = useWorkspace();
  const [stats, setStats] = React.useState<WorkspaceStats | null>(null);
  const [content, setContent] = React.useState<ContentPack[]>([]);
  const [research, setResearch] = React.useState<ResearchItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError('');
    Promise.all([
      workspacesApi.getStats(activeWorkspace.id),
      contentApi.list(activeWorkspace.id),
      researchApi.list(activeWorkspace.id),
    ])
      .then(([s, c, r]) => {
        setStats(s);
        setContent(c.slice(0, 5));
        setResearch(r.slice(0, 3));
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError('Session expired. Please sign in again.');
        } else {
          setError('Failed to load dashboard data.');
        }
      })
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  if (!activeWorkspace) {
    return (
      <EmptyState
        icon={PenTool}
        title="No workspace selected"
        description="Create or select a workspace to get started."
        action={<Button onClick={() => setCreateModalOpen(true)}>Create Workspace</Button>}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
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

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {activeWorkspace.name}
          </h1>
          <p className="text-gray-500">Here&apos;s an overview of your workspace.</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/research">
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" /> Research
            </Button>
          </Link>
          <Link href="/content/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Content
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Research Opportunities"
          value={stats?.researchIdeas ?? 0}
          icon={Search}
          sub="Pending review"
        />
        <StatCard
          title="Content Drafts"
          value={stats?.draftContent ?? 0}
          icon={PenTool}
          sub="In progress"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals ?? 0}
          icon={TrendingUp}
          sub="Awaiting review"
        />
        <StatCard
          title="Scheduled Posts"
          value={stats?.scheduledPosts ?? 0}
          icon={BarChart}
          sub="Upcoming"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Top Research</h2>
          {research.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No research yet"
              description="Add sources and sync to discover content opportunities."
              action={
                <Link href="/sources">
                  <Button variant="outline" size="sm">Manage Sources</Button>
                </Link>
              }
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {research.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-1 flex-1 min-w-0 pr-4">
                        <p className="font-medium truncate">{item.title}</p>
                        {item.sourceName && (
                          <p className="text-sm text-gray-500">{item.sourceName}</p>
                        )}
                      </div>
                      <Link href="/content/create">
                        <Button variant="ghost" size="icon">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent Content</h2>
          {content.length === 0 ? (
            <EmptyState
              icon={PenTool}
              title="No content yet"
              description="Create your first piece of content using the AI wizard."
              action={
                <Link href="/content/create">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Create Content
                  </Button>
                </Link>
              }
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {content.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-1 flex-1 min-w-0 pr-4">
                        <p className="font-medium truncate">{item.topic}</p>
                        <p className="text-sm text-gray-500">{item.platform}</p>
                      </div>
                      <ContentStatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
