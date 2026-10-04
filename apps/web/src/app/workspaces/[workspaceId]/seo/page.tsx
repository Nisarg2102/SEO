'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SeoDashboard({ params }: { params: { workspaceId: string } }) {
  const [health, setHealth] = useState<string>('checking...');
  const [keywordQuery, setKeywordQuery] = useState('');
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditUrl, setAuditUrl] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auditResult, setAuditResult] = useState<any>(null);

  useEffect(() => {
    apiClient.get<{ status: string }>('seo/health')
      .then(data => setHealth(data.status))
      .catch(() => setHealth('offline'));
  }, []);

  const handleKeywordResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiClient.get<KeywordData[]>(`seo/keywords?q=${encodeURIComponent(keywordQuery)}`);
      setKeywords(data);
    } catch {
      alert('Error fetching keywords');
    }
    setLoading(false);
  };

  const handleSiteAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiClient.post(`seo/audit`, { url: auditUrl });
      setAuditResult(data);
    } catch {
      alert('Error running audit');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-bold">SEO Tools</h1>
          <p className="text-sm text-gray-500">Powered by Local Free Tools</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Service Status:</span>
          <span className={`px-2 py-1 text-xs font-bold rounded ${health === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {health.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Keyword Research */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Keyword Research</h2>
          <form onSubmit={handleKeywordResearch} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Enter seed keyword..." 
              required
              value={keywordQuery}
              onChange={e => setKeywordQuery(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50">
              Analyze
            </button>
          </form>

          {keywords.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-2">Keyword</th>
                    <th className="p-2">Volume</th>
                    <th className="p-2">KD</th>
                    <th className="p-2">Intent</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {keywords.map((k, i) => (
                    <tr key={i}>
                      <td className="p-2 font-medium">{k.keyword}</td>
                      <td className="p-2">{k.volume}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${k.difficulty > 60 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {k.difficulty}/100
                        </span>
                      </td>
                      <td className="p-2 capitalize text-gray-600">{k.intent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Site Audit */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Site Audit</h2>
          <form onSubmit={handleSiteAudit} className="flex gap-2 mb-4">
            <input 
              type="url" 
              placeholder="https://example.com" 
              required
              value={auditUrl}
              onChange={e => setAuditUrl(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50">
              Run Audit
            </button>
          </form>

          {auditResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded border">
                <div className="text-3xl font-black text-blue-600">{auditResult.score}/100</div>
                <div className="text-sm text-gray-600">Overall Health Score</div>
              </div>
              
              <div>
                <h3 className="font-bold text-red-600 mb-2">Issues Found</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {auditResult.issues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-green-600 mb-2">Recommendations</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {auditResult.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
