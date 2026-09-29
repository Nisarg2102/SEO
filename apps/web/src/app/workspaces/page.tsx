export default function WorkspaceList() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Workspaces</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          + Create Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Mock Data for visual structure */}
        <div className="border p-4 rounded bg-white shadow hover:shadow-md transition cursor-pointer">
          <h2 className="font-bold text-lg mb-2">Acme Corp SEO</h2>
          <p className="text-gray-500 text-sm mb-4">Type: Marketing</p>
          <a href="/workspaces/mock-id-1" className="text-blue-500 hover:underline">Open Workspace →</a>
        </div>
      </div>
    </div>
  );
}
