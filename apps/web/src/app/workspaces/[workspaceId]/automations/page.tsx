/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../../../lib/apiClient';

interface Automation {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  schedule: string | null;
  runs?: { id: string; status: string; startedAt: string; error?: string }[];
}

export default function AutomationsPage({ params }: { params: { workspaceId: string } }) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    try {
      // Create defaults if none exist, or get existing
      const res = await apiClient.post(`workspaces/${params.workspaceId}/automations`, {});
      setAutomations(res as any);
    } catch (e) {
      console.error('Failed to fetch automations', e);
    }
    setLoading(false);
  }, [params.workspaceId]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const toggleAutomation = async (id: string, currentEnabled: boolean) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !currentEnabled } : a));
    try {
      await apiClient.patch(`workspaces/${params.workspaceId}/automations/${id}`, {
        enabled: !currentEnabled
      });
    } catch (e) {
      alert('Failed to update automation');
      fetchAutomations();
    }
  };

  const runAutomation = async (id: string) => {
    if (!confirm('Are you sure you want to run this automation manually?')) return;
    setRunningId(id);
    try {
      await apiClient.post(`workspaces/${params.workspaceId}/automations/${id}/run`, {});
      alert('Automation completed.');
      await fetchAutomations();
    } catch (e: any) {
      alert('Automation failed: ' + (e.message || 'Unknown error'));
    }
    setRunningId(null);
  };

  if (loading) return <div className="p-8">Loading automations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Workflows & Automations</h1>
          <p className="text-gray-500 text-sm mt-1">Manage scheduled n8n workflows and background syncs for this workspace.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
        <strong>Note on Webhooks:</strong> You can trigger any of these automations securely from your n8n instance by sending a POST request to <code>/internal/automation/webhook</code> with <code>{`{"workspaceId": "${params.workspaceId}", "type": "workflow-type"}`}</code> in the body, and your <code>N8N_WEBHOOK_SECRET</code> in the <code>x-n8n-webhook-secret</code> header.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {automations.map(a => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold">{a.name}</h3>
                <code className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">{a.type}</code>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={a.enabled} onChange={() => toggleAutomation(a.id, a.enabled)} />
                  <div className={`block w-10 h-6 rounded-full transition ${a.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${a.enabled ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
            
            <div className="flex-1 space-y-3 mb-6">
              <div className="text-sm">
                <span className="text-gray-500 block text-xs uppercase tracking-wide font-semibold">Schedule</span>
                <span>{a.schedule ? `Cron: ${a.schedule}` : 'Manual Trigger Only'}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-500 block text-xs uppercase tracking-wide font-semibold">Last Run</span>
                {a.runs && a.runs.length > 0 ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    a.runs[0].status === 'completed' ? 'bg-green-100 text-green-800' : 
                    a.runs[0].status === 'failed' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {a.runs[0].status} ({new Date(a.runs[0].startedAt).toLocaleDateString()})
                  </span>
                ) : (
                  <span className="text-gray-400 italic">Never</span>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <button 
                onClick={() => runAutomation(a.id)}
                disabled={runningId === a.id}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 border border-gray-200 rounded transition disabled:opacity-50"
              >
                {runningId === a.id ? 'Running...' : 'Run Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
