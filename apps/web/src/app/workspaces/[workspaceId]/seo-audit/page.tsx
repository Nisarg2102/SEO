'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface AuditRecord {
  id: string;
  baseUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  maxPages: number;
  maxDepth: number;
  pagesCrawled: number;
  pagesFailed: number;
  issueCount: number;
  criticalCount: number;
  warningCount: number;
  passedCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface AuditIssue {
  id: string;
  code: string;
  severity: 'critical' | 'warning' | 'info' | 'pass';
  title: string;
  description: string;
  evidence: string | null;
  recommendation: string;
  url?: string;
}

interface AuditPage {
  id: string;
  url: string;
  finalUrl: string | null;
  statusCode: number | null;
  responseTime: number | null;
  pageSize: number | null;
  wordCount: number | null;
  title: string | null;
  metaDesc: string | null;
  h1: string | null;
  isIndexable: boolean;
  hasCanonical: boolean;
  crawlDepth: number;
  failed: boolean;
  failReason: string | null;
}

interface AuditDetails extends AuditRecord {
  pages: AuditPage[];
  issues: AuditIssue[];
}

export default function SeoAuditPage({ params }: { params: { workspaceId: string } }) {
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(25);
  const [maxDepth, setMaxDepth] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditDetails | null>(null);

  const fetchAudits = async () => {
    try {
      const data = await apiClient.request<AuditRecord[]>(
        `/workspaces/${params.workspaceId}/seo/audits`
      );
      setAudits(data);
    } catch (e: unknown) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAudits();
    const interval = setInterval(fetchAudits, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [params.workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRunAudit = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.request(`/workspaces/${params.workspaceId}/seo/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, maxPages, maxDepth }),
      });
      setUrl('');
      await fetchAudits();
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to start audit');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditDetails = async (auditId: string) => {
    try {
      const data = await apiClient.request<AuditDetails>(
        `/workspaces/${params.workspaceId}/seo/audits/${auditId}`
      );
      setSelectedAudit(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Technical SEO Audit</h1>
        <p className="text-gray-600">
          Run a local on-page crawler to analyze basic technical SEO factors like broken links, metadata, and headings. 
          This is a crawler-based technical audit and does not replace Google Search Console data.
        </p>
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200">
          <strong>Note:</strong> Crawl limits are restricted for the free tier. Exact search volumes and competitor metrics are not available.
        </div>
      </header>

      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Start New Audit</h2>
        {error && <div className="mb-4 text-red-600 text-sm font-medium">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input
              type="url"
              className="w-full px-4 py-2 border rounded-md"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Pages (Max 100)</label>
            <input
              type="number"
              min="1"
              max="100"
              className="w-full px-4 py-2 border rounded-md"
              value={maxPages}
              onChange={(e) => setMaxPages(parseInt(e.target.value, 10))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Depth (Max 5)</label>
            <input
              type="number"
              min="1"
              max="5"
              className="w-full px-4 py-2 border rounded-md"
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
            />
          </div>
        </div>
        <button
          className="mt-4 px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
          onClick={handleRunAudit}
          disabled={loading || !url}
        >
          {loading ? 'Starting...' : 'Run Audit'}
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Past Audits</h2>
          {audits.length === 0 ? (
            <p className="text-sm text-gray-500">No audits found.</p>
          ) : (
            <ul className="space-y-3">
              {audits.map((a) => (
                <li 
                  key={a.id} 
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedAudit?.id === a.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                  onClick={() => loadAuditDetails(a.id)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900 truncate" title={a.baseUrl}>
                      {new URL(a.baseUrl).hostname}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'completed' ? 'bg-green-100 text-green-800' : a.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    {a.status === 'completed' && (
                       <span>{a.pagesCrawled} pages, {a.criticalCount} critical</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-2">
          {selectedAudit ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Audit Details</h2>
                  <a href={selectedAudit.baseUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">
                    {selectedAudit.baseUrl}
                  </a>
                </div>
                <div className={`px-3 py-1 text-sm font-medium rounded-full ${selectedAudit.status === 'completed' ? 'bg-green-100 text-green-800' : selectedAudit.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {selectedAudit.status.toUpperCase()}
                </div>
              </div>

              {selectedAudit.status === 'failed' && (
                <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-md">
                  <strong>Error: </strong> {selectedAudit.errorMessage}
                </div>
              )}

              {selectedAudit.status === 'completed' && (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-md border text-center">
                      <div className="text-2xl font-bold text-gray-900">{selectedAudit.pagesCrawled}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Pages</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md border text-center">
                      <div className="text-2xl font-bold text-gray-900">{selectedAudit.issueCount}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Total Issues</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-md border border-red-100 text-center">
                      <div className="text-2xl font-bold text-red-700">{selectedAudit.criticalCount}</div>
                      <div className="text-xs text-red-600 uppercase tracking-wide mt-1">Critical</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-md border border-yellow-100 text-center">
                      <div className="text-2xl font-bold text-yellow-700">{selectedAudit.warningCount}</div>
                      <div className="text-xs text-yellow-600 uppercase tracking-wide mt-1">Warnings</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-md border border-green-100 text-center">
                      <div className="text-2xl font-bold text-green-700">{selectedAudit.passedCount}</div>
                      <div className="text-xs text-green-600 uppercase tracking-wide mt-1">Passed</div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">Critical & Warning Issues</h3>
                  <div className="space-y-4 mb-8">
                    {selectedAudit.issues.filter(i => i.severity === 'critical' || i.severity === 'warning').length === 0 ? (
                      <p className="text-gray-500 italic">No critical or warning issues found!</p>
                    ) : (
                      selectedAudit.issues
                        .filter(i => i.severity === 'critical' || i.severity === 'warning')
                        .map(issue => (
                          <div key={issue.id} className={`p-4 border rounded-md ${issue.severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                            <div className="flex gap-2 items-center mb-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${issue.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                {issue.severity}
                              </span>
                              <span className="font-semibold text-gray-900">{issue.title}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                            <p className="text-sm text-gray-900 font-medium bg-white p-2 border rounded"><strong>Recommendation:</strong> {issue.recommendation}</p>
                            {issue.evidence && <p className="text-xs text-gray-500 mt-2 font-mono">{issue.evidence}</p>}
                            {issue.url && <p className="text-xs text-gray-500 mt-1 truncate"><strong>Page:</strong> {issue.url}</p>}
                          </div>
                        ))
                    )}
                  </div>

                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">Crawled Pages</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-2 font-medium text-gray-600">URL</th>
                          <th className="p-2 font-medium text-gray-600">Status</th>
                          <th className="p-2 font-medium text-gray-600">Title</th>
                          <th className="p-2 font-medium text-gray-600">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAudit.pages.map(page => (
                          <tr key={page.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="p-2 truncate max-w-xs text-indigo-600" title={page.url}>
                              <a href={page.url} target="_blank" rel="noreferrer">{new URL(page.url).pathname || '/'}</a>
                            </td>
                            <td className="p-2">
                              {page.failed ? (
                                <span className="text-red-600">Failed</span>
                              ) : (
                                <span className={page.statusCode === 200 ? "text-green-600" : "text-yellow-600"}>{page.statusCode}</span>
                              )}
                            </td>
                            <td className="p-2 truncate max-w-xs" title={page.title || ''}>{page.title || '-'}</td>
                            <td className="p-2 text-gray-500">{page.pageSize ? Math.round(page.pageSize / 1024) + ' KB' : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
              Select an audit from the list to view details
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
