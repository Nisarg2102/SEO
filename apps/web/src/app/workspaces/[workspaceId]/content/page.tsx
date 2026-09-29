'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../../../../lib/apiClient';

interface ContentPackListItem {
  id: string;
  topic?: string;
  objective?: string;
  platform?: string;
  status?: string;
  createdAt: string;
}

export default function ContentList({ params }: { params: { workspaceId: string } }) {
  const [packs, setPacks] = useState<ContentPackListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<ContentPackListItem[]>(`workspaces/${params.workspaceId}/content-packs`)
      .then(data => {
        setPacks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.workspaceId]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Content Packs</h1>
        <Link 
          href={`/workspaces/${params.workspaceId}/content/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium text-sm"
        >
          + Create Content Pack
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading content packs...</div>
      ) : packs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No content packs found.</p>
          <Link 
            href={`/workspaces/${params.workspaceId}/content/new`}
            className="text-blue-600 font-medium hover:underline"
          >
            Create your first one
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map(pack => (
            <Link key={pack.id} href={`/workspaces/${params.workspaceId}/content/${pack.id}`}>
              <div className="bg-white p-5 rounded shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                    {pack.platform}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${pack.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                    {pack.status}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1 truncate">{pack.topic || 'Untitled'}</h3>
                <p className="text-sm text-gray-500 flex-1">{pack.objective}</p>
                <div className="mt-4 text-xs text-gray-400">
                  {new Date(pack.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
