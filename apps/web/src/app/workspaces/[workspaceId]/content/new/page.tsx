'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../../lib/apiClient';

const MEDICAL_ALLOWED_TOPICS = [
  'Mental health awareness',
  'Myths and facts about depression',
  'Help-seeking behaviour',
  'Caregiver education',
  'Treatment literacy',
  'Stigma reduction',
  'General wellbeing education'
];

export default function NewContentPack({ params }: { params: { workspaceId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [workspaceType, setWorkspaceType] = useState('GENERAL');
  const [formData, setFormData] = useState({
    topic: '',
    platform: 'LinkedIn',
    audience: ''
  });

  const platforms = ['LinkedIn', 'Instagram', 'Facebook', 'YouTube', 'Blog', 'Google Business Profile'];

  useEffect(() => {
    const fetchWs = async () => {
      try {
        const ws = await apiClient.get<{ type?: string }>(`workspaces/${params.workspaceId}`);
        setWorkspaceType(ws.type || 'GENERAL');
      } catch {
        // keep default
      }
    };
    fetchWs();
  }, [params.workspaceId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiClient.post<{ id: string }>(`workspaces/${params.workspaceId}/content-packs/generate`, formData);
      router.push(`/workspaces/${params.workspaceId}/content/${data.id}`);
    } catch {
      alert('Error communicating with server');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Create Content Pack</h1>

      {workspaceType === 'MEDICAL' && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
            <span>⚕️</span> Medical Workspace — Educational Content Only
          </p>
          <p className="text-xs text-blue-700 mt-1 mb-3">
            Content generated in this workspace focuses on general mental health education, awareness, and stigma reduction.
            The AI will not generate diagnoses, treatment plans, or patient outcome claims.
          </p>
          <p className="text-xs font-semibold text-blue-800">Suggested topic areas:</p>
          <ul className="mt-1 space-y-0.5">
            {MEDICAL_ALLOWED_TOPICS.map(t => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, topic: t })}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleGenerate} className="bg-white p-6 rounded shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <input 
            type="text" 
            required
            placeholder={workspaceType === 'MEDICAL' ? 'e.g. Mental health awareness for caregivers' : 'e.g. 5 SEO Tips for Local Businesses'}
            className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.topic}
            onChange={e => setFormData({...formData, topic: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
          <input 
            type="text" 
            required
            placeholder={workspaceType === 'MEDICAL' ? 'e.g. Family members of people with depression' : 'e.g. Small business owners, marketing managers'}
            className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.audience}
            onChange={e => setFormData({...formData, audience: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
          <select 
            className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.platform}
            onChange={e => setFormData({...formData, platform: e.target.value})}
          >
            {platforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {workspaceType === 'MEDICAL'
              ? 'AI will generate educational content with mandatory compliance notes.'
              : 'AI will automatically construct the rest of the pack based on these inputs.'}
          </p>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? 'Generating with AI...' : '✨ Generate'}
          </button>
        </div>
      </form>
    </div>
  );
}
