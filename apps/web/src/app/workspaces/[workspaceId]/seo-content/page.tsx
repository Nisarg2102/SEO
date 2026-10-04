/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState, useEffect } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface PriorityAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}

interface AnalysisResult {
  summary: string;
  keywordAnalysis: {
    primaryKeyword: string;
    usage: string;
    placement: string;
    relatedTerms: string[];
  };
  title: {
    current: string;
    recommended: string;
    reason: string;
  };
  metaDescription: {
    current: string;
    recommended: string;
    reason: string;
  };
  headings: {
    issues: string[];
    recommendations: string[];
  };
  content: {
    strengths: string[];
    weaknesses: string[];
    missingTopics: string[];
    recommendations: string[];
  };
  internalLinks: {
    recommendations: string[];
  };
  technical: {
    issues: string[];
    recommendations: string[];
  };
  searchIntent: {
    detected: string;
    confidence: 'low' | 'medium' | 'high';
    reason: string;
  };
  priorityActions: PriorityAction[];
}

interface AnalysisRecord {
  id: string;
  url: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  country: string | null;
  language: string | null;
  searchIntent: string | null;
  sourceSnapshot: {
    title: string;
    metaDesc: string;
    h1: string;
    wordCount: number;
    techIssues: number;
    inboundLinks: number;
  };
  analysisResult: AnalysisResult | null;
  status: 'pending' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: string;
}

export default function SeoContentPage({ params }: { params: { workspaceId: string } }) {
  const [url, setUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [searchIntent, setSearchIntent] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);

  const fetchAnalyses = async () => {
    try {
      const data = await apiClient.request<AnalysisRecord[]>(
        `/workspaces/\${params.workspaceId}/seo/content/analyses`
      );
      setAnalyses(data);
    } catch (e: unknown) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnalyses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.workspaceId]);

  const handleAnalyze = async () => {
    if (!url || !primaryKeyword) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        url,
        primaryKeyword,
        secondaryKeywords: secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean),
        country: country || undefined,
        language: language || undefined,
        searchIntent: searchIntent || undefined,
      };
      await apiClient.request(`/workspaces/\${params.workspaceId}/seo/content/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setUrl('');
      setPrimaryKeyword('');
      setSecondaryKeywords('');
      await fetchAnalyses();
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to start analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisDetails = async (id: string) => {
    try {
      const data = await apiClient.request<AnalysisRecord>(
        `/workspaces/\${params.workspaceId}/seo/content/analyses/\${id}`
      );
      setSelectedAnalysis(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleReanalyze = async (id: string) => {
    try {
      await apiClient.request(`/workspaces/\${params.workspaceId}/seo/content/analyses/\${id}/reanalyze`, {
        method: 'POST'
      });
      await loadAnalysisDetails(id);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Content Optimizer</h1>
        <p className="text-gray-600">
          AI-assisted content optimization using your local technical audit and search console data.
        </p>
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200">
          <strong>Workflow:</strong> This tool provides recommendations based on available crawl data. It does not automatically apply changes to your website. You must review and approve all AI suggestions.
        </div>
      </header>

      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Analyze Page</h2>
        {error && <div className="mb-4 text-red-600 text-sm font-medium">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target URL *</label>
            <input
              type="url"
              className="w-full px-4 py-2 border rounded-md"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Keyword *</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md"
              placeholder="e.g. network security"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Keywords (comma separated)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md"
              placeholder="e.g. firewall, cyber defense"
              value={secondaryKeywords}
              onChange={(e) => setSecondaryKeywords(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Intent</label>
            <select className="w-full px-4 py-2 border rounded-md" value={searchIntent} onChange={e => setSearchIntent(e.target.value)}>
              <option value="">Auto-detect</option>
              <option value="informational">Informational</option>
              <option value="transactional">Transactional</option>
              <option value="commercial">Commercial</option>
              <option value="navigational">Navigational</option>
            </select>
          </div>
          <div>
             <button
              className="w-full px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
              onClick={handleAnalyze}
              disabled={loading || !url || !primaryKeyword}
            >
              {loading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Past Analyses</h2>
          {analyses.length === 0 ? (
            <p className="text-sm text-gray-500">No analyses found.</p>
          ) : (
            <ul className="space-y-3 max-h-[800px] overflow-y-auto">
              {analyses.map((a) => (
                <li 
                  key={a.id} 
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 \${selectedAnalysis?.id === a.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                  onClick={() => loadAnalysisDetails(a.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900 break-all text-sm">{new URL(a.url).pathname || '/'}</span>
                  </div>
                  <div className="text-xs text-indigo-700 font-medium mb-2">{a.primaryKeyword}</div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    <span className="capitalize">{a.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-3">
          {selectedAnalysis ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Analysis Results</h2>
                  <a href={selectedAnalysis.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">
                    {selectedAnalysis.url}
                  </a>
                </div>
                <div>
                  <button onClick={() => handleReanalyze(selectedAnalysis.id)} className="px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50 mr-2">Re-analyze</button>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full \${selectedAnalysis.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {selectedAnalysis.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedAnalysis.status === 'failed' && (
                <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-md">
                  <strong>Error: </strong> {selectedAnalysis.errorMessage}
                </div>
              )}

              {selectedAnalysis.status === 'completed' && selectedAnalysis.analysisResult && (
                <div className="space-y-8">
                  {/* Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Summary</h3>
                    <p className="text-gray-700">{selectedAnalysis.analysisResult.summary}</p>
                  </div>

                  {/* Priority Actions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-red-700">Priority Actions</h3>
                    <div className="space-y-3">
                      {selectedAnalysis.analysisResult.priorityActions.map((action, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-md">
                          <span className="font-bold text-red-800 uppercase text-xs mt-1">{action.priority}</span>
                          <div>
                            <div className="font-medium text-gray-900">{action.action}</div>
                            <div className="text-sm text-gray-600">{action.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Keyword & Intent */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border rounded-md">
                      <h3 className="text-lg font-semibold mb-3">Keyword Analysis</h3>
                      <div className="text-sm space-y-2 text-gray-700">
                        <p><strong>Primary:</strong> {selectedAnalysis.analysisResult.keywordAnalysis.primaryKeyword}</p>
                        <p><strong>Usage:</strong> {selectedAnalysis.analysisResult.keywordAnalysis.usage}</p>
                        <p><strong>Placement:</strong> {selectedAnalysis.analysisResult.keywordAnalysis.placement}</p>
                        <p><strong>Related:</strong> {selectedAnalysis.analysisResult.keywordAnalysis.relatedTerms.join(', ')}</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h3 className="text-lg font-semibold mb-3">Search Intent</h3>
                      <div className="text-sm space-y-2 text-gray-700">
                        <p><strong>Detected:</strong> <span className="capitalize">{selectedAnalysis.analysisResult.searchIntent.detected}</span></p>
                        <p><strong>Confidence:</strong> <span className="capitalize">{selectedAnalysis.analysisResult.searchIntent.confidence}</span></p>
                        <p><strong>Reasoning:</strong> {selectedAnalysis.analysisResult.searchIntent.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Title & Meta */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2">Title & Meta Description</h3>
                    
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-2">Title Tag</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 border rounded-md">
                          <div className="text-xs text-gray-500 uppercase font-bold mb-1">Current</div>
                          <div className="text-gray-800">{selectedAnalysis.analysisResult.title.current || <em className="text-gray-400">Missing</em>}</div>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="text-xs text-green-700 uppercase font-bold mb-1">Recommended</div>
                          <div className="text-gray-900 font-medium mb-1">{selectedAnalysis.analysisResult.title.recommended}</div>
                          <div className="text-xs text-gray-600">{selectedAnalysis.analysisResult.title.reason}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Meta Description</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 border rounded-md">
                          <div className="text-xs text-gray-500 uppercase font-bold mb-1">Current</div>
                          <div className="text-gray-800">{selectedAnalysis.analysisResult.metaDescription.current || <em className="text-gray-400">Missing</em>}</div>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="text-xs text-green-700 uppercase font-bold mb-1">Recommended</div>
                          <div className="text-gray-900 font-medium mb-1">{selectedAnalysis.analysisResult.metaDescription.recommended}</div>
                          <div className="text-xs text-gray-600">{selectedAnalysis.analysisResult.metaDescription.reason}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content & Headings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 border-b pb-2">Headings</h3>
                      {selectedAnalysis.analysisResult.headings.issues.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-1">Issues</h4>
                          <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
                            {selectedAnalysis.analysisResult.headings.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                          </ul>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-1">Recommendations</h4>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {selectedAnalysis.analysisResult.headings.recommendations.map((i, idx) => <li key={idx}>{i}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 border-b pb-2">Content Depth</h3>
                      {selectedAnalysis.analysisResult.content.missingTopics.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-1">Missing Topics</h4>
                          <ul className="list-disc pl-5 text-sm text-orange-600 space-y-1">
                            {selectedAnalysis.analysisResult.content.missingTopics.map((i, idx) => <li key={idx}>{i}</li>)}
                          </ul>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-1">Recommendations</h4>
                        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                          {selectedAnalysis.analysisResult.content.recommendations.map((i, idx) => <li key={idx}>{i}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Internal Links & Tech */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 border rounded-md">
                      <h3 className="text-lg font-semibold mb-3">Internal Linking</h3>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {selectedAnalysis.analysisResult.internalLinks.recommendations.map((i, idx) => <li key={idx}>{i}</li>)}
                        {selectedAnalysis.analysisResult.internalLinks.recommendations.length === 0 && <li>No recommendations.</li>}
                      </ul>
                    </div>
                    <div className="p-4 bg-gray-50 border rounded-md">
                      <h3 className="text-lg font-semibold mb-3">Technical SEO</h3>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {selectedAnalysis.analysisResult.technical.recommendations.map((i, idx) => <li key={idx}>{i}</li>)}
                        {selectedAnalysis.analysisResult.technical.recommendations.length === 0 && <li>No recommendations.</li>}
                      </ul>
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
              Select an analysis from the list to view recommendations
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
