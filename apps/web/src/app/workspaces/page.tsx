'use client';

import { useWorkspace } from '@/context/WorkspaceContext';

export default function WorkspaceList() {
  const { workspaces, loading, setCreateModalOpen } = useWorkspace();

  if (loading) {
    return <div className="p-8">Loading workspaces...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Workspaces</h1>
        <button 
          onClick={() => setCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create Workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="border p-8 rounded bg-white text-center">
          <p className="text-gray-500 mb-4">You don&apos;t have any workspaces yet.</p>
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="text-blue-600 hover:underline"
          >
            Create your first workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(workspace => (
            <div key={workspace.id} className="border p-4 rounded bg-white shadow hover:shadow-md transition cursor-pointer">
              <h2 className="font-bold text-lg mb-2">{workspace.name}</h2>
              <p className="text-gray-500 text-sm mb-4">Type: {workspace.type}</p>
              <a href={`/workspaces/${workspace.id}`} className="text-blue-500 hover:underline">Open Workspace →</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
