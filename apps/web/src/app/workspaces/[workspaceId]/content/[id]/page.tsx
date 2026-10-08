'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getApiErrorMessage } from '../../../../../lib/apiClient';

interface ContentPack {
  id: string;
  topic?: string;
  objective?: string;
  audience?: string;
  platform?: string;
  hook?: string;
  caption?: string;
  script?: string;
  cta?: string;
  hashtags?: string;
  visualDirection?: string;
  primaryKeyword?: string;
  complianceNotes?: string;
  status?: string;
  createdAt?: string;
}

export default function ContentPackDetail({ params }: { params: { workspaceId: string, id: string } }) {
  const router = useRouter();
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [workspaceType, setWorkspaceType] = useState('GENERAL');

  useEffect(() => {
    const fetchPack = async () => {
      setLoading(true);
      try {
        const [wsRes, packRes] = await Promise.all([
          apiClient.get(`workspaces/${params.workspaceId}`, { rawResponse: true }),
          apiClient.get(`workspaces/${params.workspaceId}/content-packs/${params.id}`, { rawResponse: true })
        ]);
        if (wsRes) {
          setWorkspaceType((wsRes as { type?: string }).type || 'GENERAL');
        }
        if (packRes) {
          setPack(packRes as ContentPack);
        }
      } catch {
        setError('Error communicating with server');
      }
      setLoading(false);
    };

    fetchPack();
  }, [params.workspaceId, params.id]);

  const handleSave = async (status: string = pack?.status || 'draft') => {
    if (!pack) return;
    setSaving(true);
    try {
      await apiClient.put(`workspaces/${params.workspaceId}/content-packs/${params.id}`, { ...pack, status });
      alert('Saved successfully!');
    } catch {
      alert('Error saving');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this content pack?')) return;
    try {
      await apiClient.delete(`workspaces/${params.workspaceId}/content-packs/${params.id}`);
      router.push(`/workspaces/${params.workspaceId}/content`);
    } catch {
      alert('Error deleting');
    }
  };

  const handleRegenerate = async () => {
    if (!pack) return;
    if (!confirm('This will overwrite current AI generated fields. Are you sure?')) return;
    setSaving(true);
    try {
      const newPack = await apiClient.post<{ id: string }>(`workspaces/${params.workspaceId}/content-packs/generate`, {
        topic: pack.topic,
        audience: pack.audience,
        platform: pack.platform
      });
      // Navigate to the new one and delete the old one.
      await apiClient.delete(`workspaces/${params.workspaceId}/content-packs/${params.id}`);
      router.push(`/workspaces/${params.workspaceId}/content/${newPack.id}`);
    } catch (e: unknown) {
      const apiMsg = getApiErrorMessage(e);
      alert(`Error regenerating: ${apiMsg}`);
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading content pack...</div>;
  if (error || !pack) return <div className="p-8 text-red-600">{error || 'Not found'}</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 text-sm mb-2 block">
            &larr; Back to list
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-3 flex-wrap">
            {pack.topic}
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
              {pack.platform}
            </span>
            {pack.status === 'CLINICAL_REVIEW_REQUIRED' && (
              <span className="bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded">⚕️ Awaiting Clinical Review</span>
            )}
            {pack.status === 'PROFESSIONALLY_REVIEWED' && (
              <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">✅ Professionally Reviewed</span>
            )}
            {pack.status === 'APPROVED' && (
              <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded">✅ Approved</span>
            )}
            {pack.status === 'DRAFT' && (
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded">Draft</span>
            )}
          </h1>
        </div>
        
        <div className="space-x-2 flex flex-wrap gap-2">
          <button onClick={handleRegenerate} disabled={saving} className="bg-purple-100 text-purple-700 px-4 py-2 rounded font-medium hover:bg-purple-200">
            Regenerate AI
          </button>
          <button onClick={() => handleSave('DRAFT')} disabled={saving} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-50">
            Save Draft
          </button>

          {workspaceType === 'MEDICAL' ? (
            <>
              {pack?.status === 'DRAFT' && (
                <button onClick={() => handleSave('CLINICAL_REVIEW_REQUIRED')} disabled={saving} className="bg-yellow-500 text-white px-4 py-2 rounded font-medium hover:bg-yellow-600">
                  Submit for Clinical Review
                </button>
              )}
              {pack?.status === 'CLINICAL_REVIEW_REQUIRED' && (
                <button onClick={() => handleSave('PROFESSIONALLY_REVIEWED')} disabled={saving} className="bg-blue-500 text-white px-4 py-2 rounded font-medium hover:bg-blue-600">
                  Mark as Professionally Reviewed
                </button>
              )}
              {pack?.status === 'PROFESSIONALLY_REVIEWED' && (
                <button onClick={() => handleSave('APPROVED')} disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700">
                  Approve
                </button>
              )}
            </>
          ) : (
            <button onClick={() => handleSave('IN_REVIEW')} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
              Submit for Approval
            </button>
          )}

          <button onClick={handleDelete} className="bg-red-100 text-red-700 px-4 py-2 rounded font-medium hover:bg-red-200">
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 border-b border-gray-200">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Audience</label>
            <input 
              className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:ring-0 p-1"
              value={pack.audience || ''} onChange={e => setPack({...pack, audience: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Objective</label>
            <input 
              className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:ring-0 p-1"
              value={pack.objective || ''} onChange={e => setPack({...pack, objective: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Primary Keyword</label>
            <input 
              className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:ring-0 p-1"
              value={pack.primaryKeyword || ''} onChange={e => setPack({...pack, primaryKeyword: e.target.value})} 
            />
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Hook</label>
            <textarea 
              rows={2}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              value={pack.hook || ''} onChange={e => setPack({...pack, hook: e.target.value})} 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Main Caption / Body</label>
            <textarea 
              rows={6}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              value={pack.caption || ''} onChange={e => setPack({...pack, caption: e.target.value})} 
            />
          </div>

          {pack.platform === 'YouTube' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Video Script</label>
              <textarea 
                rows={8}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                value={pack.script || ''} onChange={e => setPack({...pack, script: e.target.value})} 
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Call to Action (CTA)</label>
              <input 
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                value={pack.cta || ''} onChange={e => setPack({...pack, cta: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Hashtags</label>
              <input 
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-blue-600"
                value={pack.hashtags || ''} onChange={e => setPack({...pack, hashtags: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Visual Direction</label>
            <textarea 
              rows={3}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
              value={pack.visualDirection || ''} onChange={e => setPack({...pack, visualDirection: e.target.value})} 
            />
          </div>

          {workspaceType === 'MEDICAL' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
                  <span>⚕️</span> Compliance Notes (Required for Medical Content)
                </h3>
                <p className="text-xs text-amber-700 mb-2">
                  This field is mandatory. Describe sources for clinical claims, limitations, and any disclaimers.
                  Do not make diagnostic, treatment, or outcome guarantees.
                </p>
                <textarea 
                  rows={4}
                  className="w-full border border-amber-300 rounded-md shadow-sm p-3 bg-white focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="e.g. Information sourced from WHO Mental Health Atlas 2023. This content is for educational purposes only and does not constitute medical advice..."
                  value={pack.complianceNotes || ''} onChange={e => setPack({...pack, complianceNotes: e.target.value})} 
                />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700 space-y-1">
                <p className="font-bold">This workspace is in Medical Mode. The following are prohibited:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Diagnoses or individualized treatment recommendations</li>
                  <li>Guarantees of recovery or treatment outcomes</li>
                  <li>Claims such as &quot;best psychiatrist&quot; or comparative superiority claims</li>
                  <li>Patient outcome data or identifiable patient information</li>
                  <li>Public speculation about identifiable individuals&apos; mental health</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
