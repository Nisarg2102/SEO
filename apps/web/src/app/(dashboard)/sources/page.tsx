import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LinkIcon, Plus, MoreHorizontal, RefreshCw } from "lucide-react"

export default function SourcesPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Research Sources</h1>
          <p className="text-gray-500">Manage the feeds, sites, and platforms that power your AI research.</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Add Source</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">Source Name</th>
              <th className="px-6 py-3 font-medium">URL</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Last Synced</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[
              { name: "TechCrunch IT", url: "https://techcrunch.com/it", status: "Active", date: "2 hours ago" },
              { name: "MSP Success Magazine", url: "https://mspsuccess.com/feed", status: "Active", date: "5 hours ago" },
              { name: "Google Updates", url: "https://developers.google.com/search/blog", status: "Active", date: "1 day ago" },
              { name: "Competitor Blog", url: "https://competitor.com/blog", status: "Error", date: "3 days ago" },
            ].map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <LinkIcon className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]">{item.url}</td>
                <td className="px-6 py-4">
                  <Badge variant={item.status === "Active" ? "success" : "destructive"}>{item.status}</Badge>
                </td>
                <td className="px-6 py-4 text-gray-500">{item.date}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="ghost" size="icon" title="Sync now">
                      <RefreshCw className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
