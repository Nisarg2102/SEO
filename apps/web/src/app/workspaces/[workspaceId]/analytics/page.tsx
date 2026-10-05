/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../../../lib/apiClient';

export default function AnalyticsDashboard({ params }: { params: { workspaceId: string } }) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date().toISOString();
      
      const q = `?start=${start}&end=${end}`;
      const [overview, keywords, pages, opps, tech, links, content, social] = await Promise.all([
        apiClient.get(`workspaces/${params.workspaceId}/analytics/overview${q}`),
        apiClient.get(`workspaces/${params.workspaceId}/analytics/keywords${q}`),
        apiClient.get(`workspaces/${params.workspaceId}/analytics/pages${q}`),
        apiClient.get(`workspaces/${params.workspaceId}/analytics/opportunities${q}`),
        apiClient.get(`workspaces/${params.workspaceId}/analytics/technical`),
        apiClient.get(`workspaces/${params.workspaceId}/analytics/links`),
        apiClient.get(`workspaces/${params.workspaceId}/analytics/content`),
        apiClient.get(`workspaces/${params.workspaceId}/analytics/social`)
      ]);
      
      setData({ overview, keywords, pages, opps, tech, links, content, social });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [params.workspaceId, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

    const generateInsights = async () => {
    if (!data?.overview?.hasData) {
      alert("No analytics data is available for this date range. Sync Search Console/analytics data first, then generate insights.");
      return;
    }
    setGenerating(true);
    try {
      const res = await apiClient.post<any>(`workspaces/${params.workspaceId}/analytics/insights`, { start: dateRange });
      setInsights(res);
    } catch (e: any) {
      alert(`AI Insight Generation Failed: ${e.message || 'Unknown error. Check AI configuration.'}`);
    }
    setGenerating(false);
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  const { overview, keywords, pages, opps, tech, links, content, social } = data;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Performance</h1>
          <p className="text-gray-500">Comprehensive overview of your workspace performance.</p>
        </div>
        <div>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="border-gray-300 rounded shadow-sm text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="28">Last 28 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {insights ? (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-2">AI Performance Summary</h3>
          <p className="text-blue-800 mb-4">{insights.summary}</p>
          <h4 className="font-semibold text-sm text-blue-900 uppercase">Recommended Actions</h4>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-blue-800">
            {insights.recommendedActions?.map((a: string, i: number) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      ) : (
        <button 
          onClick={generateInsights}
          disabled={generating}
          className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {generating ? 'Generating Insights...' : 'Generate AI Insights'}
        </button>
      )}

      {overview?.hasData ? (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Clicks</p>
            <p className="text-2xl font-bold">{overview.summary.clicks}</p>
          </div>
          <div className="p-4 bg-white rounded shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Impressions</p>
            <p className="text-2xl font-bold">{overview.summary.impressions}</p>
          </div>
          <div className="p-4 bg-white rounded shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Avg CTR</p>
            <p className="text-2xl font-bold">{(overview.summary.ctr * 100).toFixed(2)}%</p>
          </div>
          <div className="p-4 bg-white rounded shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Avg Position</p>
            <p className="text-2xl font-bold">{overview.summary.averagePosition.toFixed(1)}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded text-gray-500">No SEO data available for this date range.</div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-4">Top Keywords</h3>
          {keywords?.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Query</th><th className="text-right">Clicks</th><th className="text-right">Pos</th></tr></thead>
              <tbody>
                {keywords.slice(0,5).map((k: any) => (
                  <tr key={k.query} className="border-b"><td className="py-2">{k.query}</td><td className="text-right">{k.clicks}</td><td className="text-right">{k.position.toFixed(1)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-gray-500">No data</p>}
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4">SEO Opportunities</h3>
          {opps?.length > 0 ? (
            <ul className="space-y-3">
              {opps.slice(0,4).map((o: any, i: number) => (
                <li key={i} className="p-3 bg-yellow-50 rounded border border-yellow-100 text-sm">
                  <strong className="text-yellow-800 block">{o.type}</strong>
                  <span className="text-yellow-700 truncate block max-w-[300px]">{o.page}</span>
                  <span className="text-yellow-600 block text-xs">{o.description}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-500">No immediate opportunities detected.</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="font-bold mb-3">Technical SEO</h3>
          {tech?.hasData ? (
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>Pages Crawled:</span> <span className="font-medium">{tech.pagesCrawled}</span></li>
              <li className="flex justify-between text-red-600"><span>Critical Issues:</span> <span className="font-medium">{tech.criticalIssues}</span></li>
              <li className="flex justify-between text-yellow-600"><span>Warnings:</span> <span className="font-medium">{tech.warnings}</span></li>
            </ul>
          ) : <p className="text-sm text-gray-500">No audit data</p>}
        </div>
        
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="font-bold mb-3">Link Intelligence</h3>
          {links?.hasData ? (
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>Internal Links:</span> <span className="font-medium">{links.internalLinks}</span></li>
              <li className="flex justify-between"><span>External Links:</span> <span className="font-medium">{links.externalLinks}</span></li>
              <li className="flex justify-between text-red-600"><span>Broken Links:</span> <span className="font-medium">{links.brokenLinks}</span></li>
              <li className="mt-3 text-xs text-gray-400 italic">{links.message}</li>
            </ul>
          ) : <p className="text-sm text-gray-500">No link data</p>}
        </div>

        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="font-bold mb-3">Content Studio</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Analyses Run:</span> <span className="font-medium">{content?.analyses || 0}</span></li>
            <li className="flex justify-between"><span>Active Briefs:</span> <span className="font-medium">{content?.briefs || 0}</span></li>
            <li className="flex justify-between"><span>Drafts:</span> <span className="font-medium">{content?.drafts || 0}</span></li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-4">Social Media Overview</h3>
        {social?.hasData ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {social.posts.map((p: any, i: number) => (
              <div key={i} className="min-w-[150px] p-4 bg-gray-50 border border-gray-200 rounded text-center">
                <span className="block capitalize font-bold">{p.platform}</span>
                <span className="block text-gray-500 text-sm capitalize">{p.status}</span>
                <span className="block text-xl font-bold mt-2">{p.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No social posts have been generated yet. {social?.message}</p>
        )}
      </div>

    </div>
  );
}
