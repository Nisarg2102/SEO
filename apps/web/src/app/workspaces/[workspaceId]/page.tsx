'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/apiClient';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
      <div className="text-gray-400 mb-2">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No data found</h3>
      <p className="text-gray-500 text-sm text-center">Get started by setting up your brand profile and research sources.</p>
      <button className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700">
        Setup Brand Profile
      </button>
    </div>
  );
}

export default function WorkspaceDashboard({ params }: { params: { workspaceId: string } }) {
  const [stats, setStats] = useState<{
    researchIdeas: number;
    draftContent: number;
    pendingApprovals: number;
    scheduledPosts: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using a real API call to the backend
    apiClient.get<{ researchIdeas: number; draftContent: number; pendingApprovals: number; scheduledPosts: number }>(`workspaces/${params.workspaceId}/stats`)
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.workspaceId]);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  const totalItems = stats ? (stats.researchIdeas + stats.draftContent + stats.pendingApprovals + stats.scheduledPosts) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium">
          + New Content Idea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Research Ideas Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 mb-1">Research Ideas</span>
          <span className="text-3xl font-bold text-gray-900">{stats?.researchIdeas || 0}</span>
        </div>

        {/* Draft Content Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 mb-1">Draft Content</span>
          <span className="text-3xl font-bold text-gray-900">{stats?.draftContent || 0}</span>
        </div>

        {/* Pending Approvals Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 mb-1">Pending Approvals</span>
          <span className="text-3xl font-bold text-orange-600">{stats?.pendingApprovals || 0}</span>
        </div>

        {/* Scheduled Posts Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 mb-1">Scheduled Posts</span>
          <span className="text-3xl font-bold text-green-600">{stats?.scheduledPosts || 0}</span>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        {totalItems === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <p className="text-gray-500 italic">Activity feed would render here...</p>
          </div>
        )}
      </div>
    </div>
  );
}
