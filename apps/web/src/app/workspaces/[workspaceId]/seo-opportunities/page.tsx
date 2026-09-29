'use client';
import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface SeoOpportunity {
  id: string;
  url: string;
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averagePosition: number;
  opportunityType: string;
  recommendation: string;
  priority: string;
  createdAt: string;
}

// Mock Search Console Data to feed into our rules engine for testing
const MOCK_GSC_METRICS = [
  { url: 'https://example.com/blog/seo-tips', keyword: 'seo tips 2024', impressions: 1500, clicks: 12, position: 12 },
  { url: 'https://example.com/pricing', keyword: 'cheap seo tool', impressions: 5200, clicks: 45, position: 8 },
  { url: 'https://example.com/about', keyword: 'about us', impressions: 100, clicks: 5, position: 1 },
];

export default function SeoOpportunitiesPage({ params }: { params: { workspaceId: string } }) {
  const [opportunities, setOpportunities] = useState<SeoOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingStatus, setAnalyzingStatus] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterType) q.set('type', filterType);
      
      const data = await apiClient.get<SeoOpportunity[]>(
        `workspaces/${params.workspaceId}/seo-opportunities${q.toString() ? `?${q.toString()}` : ''}`
      );
      setOpportunities(data);
    } catch {}
    setLoading(false);
  }, [params.workspaceId, filterType]);

  useEffect(() => { 
    fetchOpportunities(); 
  }, [fetchOpportunities]);

  const handleRunAnalysis = async () => {
    setAnalyzingStatus('Queuing analysis...');
    try {
      const data = await apiClient.post<{ message: string, jobId: string }>(
        `workspaces/${params.workspaceId}/seo-opportunities/analyze`, 
        { metrics: MOCK_GSC_METRICS }
      );
      setAnalyzingStatus(`Analysis queued (Job ${data.jobId}). Waiting for completion...`);
      
      // Poll briefly
      setTimeout(() => {
        fetchOpportunities();
        setAnalyzingStatus(null);
      }, 5000);
    } catch {
      alert('Failed to queue analysis');
      setAnalyzingStatus(null);
    }
  };

  const handleConvert = async (id: string) => {
    if (!confirm('Convert this SEO opportunity into a Content Idea?')) return;
    try {
      await apiClient.post(`workspaces/${params.workspaceId}/seo-opportunities/${id}/convert`);
      alert('Converted successfully! Check your Content Ideas.');
    } catch {
      alert('Error converting');
    }
  };

  const filtered = opportunities.filter(o => 
    o.keyword.toLowerCase().includes(search.toLowerCase()) || 
    o.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">SEO Opportunities</h1>
          <p className="text-gray-500 text-sm">Actionable insights from your Search Console metrics.</p>
        </div>
        <button 
          onClick={handleRunAnalysis}
          disabled={!!analyzingStatus}
          className="bg-purple-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-purple-700 disabled:opacity-50"
        >
          {analyzingStatus ? 'Analyzing...' : 'Run GSC Analysis (Mock Data)'}
        </button>
      </div>

      {analyzingStatus && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4 text-sm font-medium border border-blue-200">
          {analyzingStatus}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-4">
        <input 
          type="text" 
          placeholder="Search keywords or URLs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-sm flex-1"
        />
        <select 
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-48"
        >
          <option value="">All Types</option>
          <option value="LOW_CTR">Low CTR</option>
          <option value="PAGE_OPTIMIZATION">Page Optimization</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => (
             <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 h-40 animate-pulse"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4 font-medium">No SEO opportunities found.</p>
          <button onClick={handleRunAnalysis} className="text-blue-600 font-medium hover:underline text-sm">
            Analyze recent metrics
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(opp => (
            <div key={opp.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${opp.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {opp.priority} Priority
                    </span>
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded uppercase">
                      {opp.opportunityType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(opp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">
                    Keyword: &quot;{opp.keyword}&quot;
                  </h3>
                  <a href={opp.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                    {opp.url}
                  </a>
                </div>
                <button 
                  onClick={() => handleConvert(opp.id)}
                  className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded text-sm font-medium hover:bg-blue-100 transition whitespace-nowrap shrink-0"
                >
                  Convert to Idea
                </button>
              </div>

              {/* Evidence Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Impressions</div>
                  <div className="text-lg font-bold">{opp.impressions.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Clicks</div>
                  <div className="text-lg font-bold">{opp.clicks.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">CTR</div>
                  <div className="text-lg font-bold">{opp.ctr}%</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Avg Position</div>
                  <div className="text-lg font-bold">{opp.averagePosition}</div>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="bg-blue-50/50 p-4 rounded border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-600 text-white text-[10px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider">AI Recommendation</span>
                </div>
                <div className="text-blue-900 text-sm whitespace-pre-wrap leading-relaxed">
                  {opp.recommendation}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
