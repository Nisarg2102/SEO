/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { apiClient } from '../../../../lib/apiClient';

interface ContentPack {
  id: string;
  topic: string;
  platform: string;
  status: string;
  scheduledAt?: string;
}

const STATUSES = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'REJECTED'];

export default function CalendarPage({ params }: { params: { workspaceId: string } }) {
  const [packs, setPacks] = useState<ContentPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'month' | 'week'>('list');

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const packData = await apiClient.get<ContentPack[]>(`workspaces/${params.workspaceId}/content-packs`);
      
      
      const combined = [...packData].sort((a, b) => {
        if (!a.scheduledAt) return 1;
        if (!b.scheduledAt) return -1;
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      });
      
      setPacks(combined);
    } catch {}
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPacks(); }, [params.workspaceId]);

  const updatePack = async (id: string, updates: Partial<ContentPack>) => {
    try {
      
        await apiClient.put(`workspaces/${params.workspaceId}/content-packs/${id}`, updates);
      fetchPacks();
    } catch (e) {
      alert(`Error: ${(e as Error).message || 'Failed to update'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-gray-500 text-sm">Schedule and manage your approval workflow.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['list', 'week', 'month'] as const).map(v => (
            <button 
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1 text-sm font-medium rounded-md capitalize ${view === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div>Loading calendar...</div>
      ) : view === 'list' ? (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium tracking-wider">Content</th>
                <th className="px-6 py-3 font-medium tracking-wider">Platform</th>
                <th className="px-6 py-3 font-medium tracking-wider">Status</th>
                <th className="px-6 py-3 font-medium tracking-wider">Scheduled Date</th>
                <th className="px-6 py-3 font-medium tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {packs.map(pack => (
                <tr key={pack.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900 max-w-xs truncate">
                    {pack.topic || 'Untitled'}
                  </td>
                  <td className="px-6 py-4 capitalize">{pack.platform}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={pack.status.toUpperCase()} 
                      onChange={e => updatePack(pack.id, { status: e.target.value})}
                      className="border-gray-300 rounded text-sm p-1 font-medium bg-gray-50"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="datetime-local" 
                      value={pack.scheduledAt ? new Date(pack.scheduledAt).toISOString().slice(0,16) : ''}
                      onChange={e => updatePack(pack.id, { scheduledAt: new Date(e.target.value).toISOString()})}
                      className="border p-1 rounded text-sm bg-gray-50"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/workspaces/${params.workspaceId}/content/${pack.id}`} className="text-blue-600 hover:underline font-medium">
                      Open Content
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500 mb-2">Visual {view} view is currently under construction.</p>
          <button onClick={() => setView('list')} className="text-blue-600 font-medium hover:underline">
            Switch back to List view
          </button>
        </div>
      )}
    </div>
  );
}
