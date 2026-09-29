export default function BrandProfilePage() {
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Brand Profile</h1>
      <form className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Name</label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Audience</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tone of Voice</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" placeholder="e.g. Professional, Witty" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Industry</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Services</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input type="url" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
        </div>

        <button type="button" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
          Save Brand Profile
        </button>
      </form>
    </div>
  );
}
