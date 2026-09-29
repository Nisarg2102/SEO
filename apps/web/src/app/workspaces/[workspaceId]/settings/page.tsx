export default function WorkspaceSettings() {
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>
      
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Workspace Name</label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Workspace Type</label>
          <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
            <option>Marketing</option>
            <option>E-commerce</option>
            <option>SaaS</option>
            <option>Local Business</option>
          </select>
        </div>

        <button type="button" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
          Save Settings
        </button>
      </form>
    </div>
  );
}
