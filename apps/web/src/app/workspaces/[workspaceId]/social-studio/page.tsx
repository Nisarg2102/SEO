/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface SocialPost {
  id: string;
  sourceType: string;
  platform: string;
  content: {
    text: string;
    hook?: string;
    cta?: string;
    mediaSuggestion?: string;
    notes?: string[];
  };
  hashtags: string[];
  status: string;
  approvalStatus: string;
  createdAt: string;
  scheduledAt?: string;
}

export default function SocialStudioPage({ params }: { params: { workspaceId: string } }) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [sourceType, setSourceType] = useState('topic');
  const [sourceId, setSourceId] = useState('');
  const [topic, setTopic] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['linkedin']);
  const [objective, setObjective] = useState('awareness');
  const [audience, setAudience] = useState('general');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [editContentText, setEditContentText] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  
  const [scheduleDate, setScheduleDate] = useState('');

  const fetchPosts = async () => {
    try {
      const data = await apiClient.request<SocialPost[]>(`/workspaces/\${params.workspaceId}/social/posts`);
      setPosts(data);
    } catch (e: unknown) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.workspaceId]);

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.request(`/workspaces/\${params.workspaceId}/social/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          sourceId: sourceId || undefined,
          topic: topic || undefined,
          platforms,
          objective,
          audience,
          tone
        })
      });
      await fetchPosts();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.request(`/workspaces/\${params.workspaceId}/social/posts/\${id}/approve`, {
        method: 'POST'
      });
      await fetchPosts();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const handleSchedule = async (id: string) => {
    if (!scheduleDate) {
      setError('Please select a schedule date/time');
      return;
    }
    try {
      await apiClient.request(`/workspaces/\${params.workspaceId}/social/posts/\${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: scheduleDate })
      });
      await fetchPosts();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const startEdit = (post: SocialPost) => {
    setEditPostId(post.id);
    setEditContentText(post.content.text);
    setEditHashtags(post.hashtags.join(', '));
  };

  const saveEdit = async (post: SocialPost) => {
    try {
      await apiClient.request(`/workspaces/\${params.workspaceId}/social/posts/\${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { ...post.content, text: editContentText },
          hashtags: editHashtags.split(',').map(h => h.trim().replace('#', '')).filter(Boolean)
        })
      });
      setEditPostId(null);
      await fetchPosts();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Content Studio</h1>
        <p className="text-gray-600 mb-4">
          Convert SEO content, briefs, and custom topics into platform-specific social posts.
        </p>
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm">
          <strong>Important:</strong> AI-generated social content is a drafting aid. Users remain responsible for reviewing content before approving and publishing.
        </div>
      </header>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: Generation Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
          <h2 className="font-semibold text-lg mb-4">Generate Posts</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium mb-1">Source Type</label>
              <select className="w-full border rounded p-2" value={sourceType} onChange={e => setSourceType(e.target.value)}>
                <option value="topic">Custom Topic</option>
                <option value="draft">SEO Content Draft</option>
                <option value="brief">SEO Content Brief</option>
                <option value="url">External URL</option>
              </select>
            </div>

            {sourceType === 'topic' ? (
              <div>
                <label className="block font-medium mb-1">Topic</label>
                <input className="w-full border rounded p-2" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. 5 tips for mental wellness" />
              </div>
            ) : (
              <div>
                <label className="block font-medium mb-1">Source ID / URL</label>
                <input className="w-full border rounded p-2" value={sourceId} onChange={e => setSourceId(e.target.value)} placeholder={sourceType === 'url' ? 'https://...' : 'ID...'} />
              </div>
            )}

            <div>
              <label className="block font-medium mb-1">Platforms (Select multiple)</label>
              <div className="flex gap-2 flex-wrap">
                {['linkedin', 'twitter', 'instagram', 'facebook'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1 border rounded capitalize \${platforms.includes(p) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-1">Objective</label>
                <select className="w-full border rounded p-2" value={objective} onChange={e => setObjective(e.target.value)}>
                  <option value="awareness">Awareness</option>
                  <option value="education">Education</option>
                  <option value="engagement">Engagement</option>
                  <option value="lead gen">Lead Gen</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Tone</label>
                <select className="w-full border rounded p-2" value={tone} onChange={e => setTone(e.target.value)}>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="humorous">Humorous</option>
                  <option value="empathetic">Empathetic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Target Audience</label>
              <input className="w-full border rounded p-2" value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. IT Professionals" />
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={loading || platforms.length === 0}
              className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 disabled:opacity-50 mt-4"
            >
              {loading ? 'Generating...' : 'Generate AI Posts'}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Drafts & Approvals */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-lg">Social Content Pipeline</h2>
          
          {posts.length === 0 ? (
            <div className="text-gray-500 italic p-6 bg-white rounded border text-center">No posts generated yet.</div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3 border-b pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg capitalize text-indigo-700">{post.platform}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full \${post.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {post.approvalStatus.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full \${post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {post.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">Created: {new Date(post.createdAt).toLocaleDateString()}</div>
                </div>

                {editPostId === post.id ? (
                  <div className="mb-4">
                    <textarea 
                      className="w-full border border-gray-300 rounded p-2 text-sm mb-2 h-32 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={editContentText}
                      onChange={e => setEditContentText(e.target.value)}
                    />
                    <input 
                      className="w-full border border-gray-300 rounded p-2 text-sm mb-2"
                      value={editHashtags}
                      onChange={e => setEditHashtags(e.target.value)}
                      placeholder="hashtags (comma separated)"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(post)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Save</button>
                      <button onClick={() => setEditPostId(null)} className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm mb-3">{post.content.text}</p>
                    {post.hashtags.length > 0 && (
                      <p className="text-blue-600 text-sm">{post.hashtags.map(h => `#\${h}`).join(' ')}</p>
                    )}
                    {post.content.mediaSuggestion && (
                      <div className="mt-3 p-2 bg-gray-50 border rounded text-xs text-gray-600">
                        <strong>Media Suggestion:</strong> {post.content.mediaSuggestion}
                      </div>
                    )}
                  </div>
                )}

                {!editPostId && (
                  <div className="flex justify-between items-center border-t pt-3 mt-2 bg-gray-50 -mx-4 -mb-4 p-4 rounded-b-lg">
                    <div className="flex gap-2">
                      {post.approvalStatus === 'pending' && (
                        <>
                          <button onClick={() => startEdit(post)} className="text-indigo-600 text-sm font-medium hover:underline">Edit</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleApprove(post.id)} className="text-green-600 text-sm font-medium hover:underline">Approve</button>
                        </>
                      )}
                    </div>
                    
                    {post.approvalStatus === 'approved' && post.status !== 'scheduled' && (
                      <div className="flex gap-2 items-center">
                        <input 
                          type="datetime-local" 
                          className="border rounded px-2 py-1 text-xs"
                          value={scheduleDate}
                          onChange={e => setScheduleDate(e.target.value)}
                        />
                        <button 
                          onClick={() => handleSchedule(post.id)}
                          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-indigo-700"
                        >
                          Schedule Post
                        </button>
                      </div>
                    )}
                    {post.status === 'scheduled' && (
                      <div className="text-xs text-blue-700 font-medium">
                        Scheduled for: {new Date(post.scheduledAt!).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
