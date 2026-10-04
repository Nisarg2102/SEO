/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface BriefData {
  id: string;
  primaryKeyword: string;
  status: string;
  createdAt: string;
  briefData?: {
    topic: string;
    titleOptions: string[];
    recommendedOutline: Array<{ level: number; heading: string; purpose: string; topicsToCover: string[] }>;
    contentGuidance: { tone: string; style: string; importantPoints: string[]; thingsToAvoid: string[] };
    internalLinkOpportunities: Array<{ sourcePage: string; targetPage: string; anchorSuggestion: string; reason: string }>;
    metadata: { title: string; description: string };
  };
}

interface DraftData {
  id: string;
  title: string;
  content: string;
  version: number;
  status: string;
  metadata: { title: string; description: string };
}

export default function SeoStudioPage({ params }: { params: { workspaceId: string } }) {
  const [keyword, setKeyword] = useState('');
  const [briefs, setBriefs] = useState<BriefData[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<BriefData | null>(null);
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [regenHeading, setRegenHeading] = useState('');
  const [regenInstructions, setRegenInstructions] = useState('');
  const [regenResult, setRegenResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchBriefs = async () => {
    try {
      const data = await apiClient.request<BriefData[]>(`/workspaces/\${params.workspaceId}/seo/content-briefs`);
      setBriefs(data);
    } catch (e: unknown) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBriefs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.workspaceId]);

  const loadBrief = async (id: string) => {
    try {
      const b = await apiClient.request<BriefData>(`/workspaces/\${params.workspaceId}/seo/content-briefs/\${id}`);
      setSelectedBrief(b);
      setSelectedDraft(null);
      const ds = await apiClient.request<DraftData[]>(`/workspaces/\${params.workspaceId}/seo/content-briefs/\${id}/drafts`);
      setDrafts(ds);
      if (ds.length > 0) {
        setSelectedDraft(ds[0]);
        setEditTitle(ds[0].title);
        setEditContent(ds[0].content);
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleCreateBrief = async () => {
    if (!keyword) return;
    setLoading(true);
    setError(null);
    try {
      const payload = { primaryKeyword: keyword };
      const newBrief = await apiClient.request<BriefData>(`/workspaces/\${params.workspaceId}/seo/content-briefs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setKeyword('');
      await fetchBriefs();
      await loadBrief(newBrief.id);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!selectedBrief) return;
    setDrafting(true);
    setError(null);
    try {
      await apiClient.request(`/workspaces/\${params.workspaceId}/seo/content-briefs/\${selectedBrief.id}/generate-draft`, {
        method: 'POST'
      });
      await loadBrief(selectedBrief.id);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setDrafting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedDraft) return;
    try {
      const updated = await apiClient.request<DraftData>(`/workspaces/\${params.workspaceId}/seo/content-drafts/\${selectedDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      // reload
      if (selectedBrief) await loadBrief(selectedBrief.id);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleRegenerateSection = async () => {
    if (!selectedDraft || !regenHeading || !regenInstructions) return;
    try {
      const res = await apiClient.request<any>(`/workspaces/\${params.workspaceId}/seo/content-drafts/\${selectedDraft.id}/regenerate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionHeading: regenHeading, instructions: regenInstructions }),
      });
      setRegenResult(res.newSectionContent);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Content Studio</h1>
        <p className="text-gray-600 mb-4">
          Generate SEO-optimized content briefs and drafts using existing audit and keyword data.
        </p>
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm">
          <strong>Important:</strong> AI-generated content is a drafting aid, not a guarantee of search rankings. All content requires human review and approval.
        </div>
      </header>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded">{error}</div>}

      <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
        {/* Left Sidebar - Briefs */}
        <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col">
          <h2 className="font-semibold text-lg mb-4">Content Briefs</h2>
          
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Primary Keyword" 
              className="w-full px-3 py-2 border rounded text-sm mb-2"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <button 
              onClick={handleCreateBrief} 
              disabled={loading || !keyword}
              className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Generating Brief...' : 'Create Brief'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 border-t pt-4">
            {briefs.map(b => (
              <div 
                key={b.id} 
                onClick={() => loadBrief(b.id)}
                className={`p-3 border rounded cursor-pointer text-sm hover:bg-gray-50 \${selectedBrief?.id === b.id ? 'border-indigo-500 bg-indigo-50' : ''}`}
              >
                <div className="font-semibold text-gray-900 truncate">{b.primaryKeyword}</div>
                <div className="text-xs text-gray-500 flex justify-between mt-1">
                  <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                  <span className="capitalize">{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle - Brief Overview */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col overflow-y-auto">
          {selectedBrief ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-xl">Brief Details</h2>
                {selectedBrief.status === 'completed' && (
                  <button 
                    onClick={handleGenerateDraft} 
                    disabled={drafting}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {drafting ? 'Drafting...' : 'Generate AI Draft'}
                  </button>
                )}
              </div>
              
              {selectedBrief.briefData ? (
                <div className="space-y-6 text-sm">
                  <div>
                    <h3 className="font-bold text-gray-700 mb-1 border-b pb-1">Topic & Keyword</h3>
                    <p><strong>Keyword:</strong> {selectedBrief.primaryKeyword}</p>
                    <p><strong>Topic:</strong> {selectedBrief.briefData.topic}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-gray-700 mb-1 border-b pb-1">Content Guidance</h3>
                    <p><strong>Tone:</strong> {selectedBrief.briefData.contentGuidance.tone}</p>
                    <p><strong>Style:</strong> {selectedBrief.briefData.contentGuidance.style}</p>
                    <div className="mt-2 text-gray-600">
                      <strong>Important:</strong> {selectedBrief.briefData.contentGuidance.importantPoints.join(', ')}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-700 mb-1 border-b pb-1">Recommended Outline</h3>
                    <ul className="space-y-2">
                      {selectedBrief.briefData.recommendedOutline.map((out, i) => (
                        <li key={i} className={`pl-\${(out.level - 1) * 4}`}>
                          <strong className="text-gray-900">H{out.level}: {out.heading}</strong>
                          <p className="text-xs text-gray-500 mt-1">{out.purpose}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-700 mb-1 border-b pb-1">Internal Links</h3>
                    {selectedBrief.briefData.internalLinkOpportunities.length === 0 ? (
                      <p className="text-gray-500 italic">No suitable known internal links found.</p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedBrief.briefData.internalLinkOpportunities.map((link, i) => (
                          <li key={i} className="bg-gray-50 p-2 rounded border text-xs">
                            <span className="font-bold">Target:</span> {link.targetPage}<br/>
                            <span className="font-bold">Anchor:</span> {link.anchorSuggestion}<br/>
                            <span className="text-gray-500">{link.reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 italic">Brief data is pending or failed.</div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 mt-20">Select or create a brief to view details.</div>
          )}
        </div>

        {/* Right - Editor */}
        <div className="w-full lg:w-5/12 bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
          <h2 className="font-semibold text-xl mb-4">Content Editor</h2>
          {selectedDraft ? (
            <div className="flex flex-col h-full">
              <div className="mb-4 flex justify-between items-center text-sm text-gray-500">
                <span>Version {selectedDraft.version}</span>
                <button onClick={handleSaveDraft} className="text-indigo-600 font-medium hover:underline">Save New Version</button>
              </div>

              <input 
                className="w-full text-xl font-bold border-b border-gray-200 pb-2 mb-4 focus:outline-none" 
                value={editTitle} 
                onChange={e => setEditTitle(e.target.value)} 
              />
              
              <textarea 
                className="w-full flex-1 border border-gray-200 rounded p-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-4"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
              />

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Regenerate Section</h4>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Heading (e.g. Intro)" className="border px-2 py-1 text-sm rounded w-1/3" value={regenHeading} onChange={e => setRegenHeading(e.target.value)} />
                  <input type="text" placeholder="Instructions..." className="border px-2 py-1 text-sm rounded flex-1" value={regenInstructions} onChange={e => setRegenInstructions(e.target.value)} />
                  <button onClick={handleRegenerateSection} className="bg-gray-800 text-white px-3 py-1 text-sm rounded hover:bg-gray-900">Run</button>
                </div>
                {regenResult && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded p-2 text-sm text-indigo-900 h-32 overflow-y-auto">
                    <div className="font-bold mb-1 flex justify-between">
                      <span>Result (Copy & Paste above)</span>
                      <button onClick={() => setRegenResult('')} className="text-indigo-600">Clear</button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans">{regenResult}</pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-20">
              {selectedBrief?.status === 'completed' ? 'Click "Generate AI Draft" to begin drafting.' : 'No draft available.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
