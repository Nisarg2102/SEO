'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../../lib/apiClient';

export default function SearchConsolePage({ params }: { params: { workspaceId: string } }) {
  const [status, setStatus] = useState<{ connected: boolean; propertyUrl?: string; lastSyncAt?: string } | null>(null);
  const [properties, setProperties] = useState<{ siteUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ connected: boolean; propertyUrl?: string; lastSyncAt?: string }>(`workspaces/${params.workspaceId}/gsc/status`);
      setStatus(data);
    } catch {}
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStatus(); }, [params.workspaceId]);

  const handleConnect = async () => {
    try {
      const { url } = await apiClient.get<{ url: string }>(`workspaces/${params.workspaceId}/gsc/auth-url`);
      window.location.href = url;
    } catch {
      alert('Error fetching Auth URL');
    }
  };

  const loadProperties = async () => {
    try {
      const data = await apiClient.get<{ siteUrl: string }[]>(`workspaces/${params.workspaceId}/gsc/properties`);
      setProperties(data);
    } catch {}
  };

  const selectProperty = async (propertyUrl: string) => {
    try {
      await apiClient.post(`workspaces/${params.workspaceId}/gsc/connect-property`, { propertyUrl });
      fetchStatus();
    } catch {}
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Search Console Integration</h1>
        <p className="text-gray-500">Connect your website to import SEO metrics and generate actionable opportunities.</p>
      </div>

      {!status?.connected ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Connect Google Account</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Authorize this application to read your Search Console data. We only request read-only permissions.
          </p>
          <button onClick={handleConnect} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">
            Sign in with Google
          </button>
        </div>
      ) : !status.propertyUrl ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Select Search Console Property</h2>
          <button onClick={loadProperties} className="bg-gray-100 text-gray-800 px-4 py-2 rounded mb-4 text-sm font-medium">
            Load Available Properties
          </button>
          
          {properties.length > 0 && (
            <div className="space-y-2">
              {properties.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                  <span className="font-medium">{p.siteUrl}</span>
                  <button onClick={() => selectProperty(p.siteUrl)} className="text-blue-600 font-medium text-sm">
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connected Property</h2>
              <p className="text-blue-600 font-medium">{status.propertyUrl}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Last Synchronization</div>
              <div className="font-medium text-gray-900">
                {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}
              </div>
            </div>
          </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">Synchronize Data</h3>
              <p className="text-sm text-gray-500">Pulls the latest Search Console metrics.</p>
            </div>
            <div className="flex gap-4 items-center">
              <select 
                id="syncDays" 
                className="border p-2 rounded text-sm bg-white"
                defaultValue="28"
              >
                <option value="7">Last 7 Days</option>
                <option value="28">Last 28 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
              <button 
                onClick={async () => {
                  const days = parseInt((document.getElementById('syncDays') as HTMLSelectElement).value, 10);
                  setSyncing(true);
                  try {
                    const data = await apiClient.post<{ message: string, jobId: string }>(`workspaces/${params.workspaceId}/gsc/sync`, { days });
                    alert(`${data.message}. Job ID: ${data.jobId}`);
                    fetchStatus();
                  } catch {
                    alert('Network error during sync');
                  }
                  setSyncing(false);
                }}
                disabled={syncing}
                className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
