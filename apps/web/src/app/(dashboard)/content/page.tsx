
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, MoreHorizontal, Calendar } from "lucide-react"
import Link from "next/link"

export default function ContentPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Content Library</h1>
          <p className="text-gray-500">Manage, review, and schedule your marketing content.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/content/create">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Content</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">Content</th>
              <th className="px-6 py-3 font-medium">Platform</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[
              { title: "Why your business needs managed IT", type: "LinkedIn Post", status: "Scheduled", date: "Oct 12, 2026", s: "success" },
              { title: "Top 5 cybersecurity threats in 2026", type: "Blog Post", status: "In Review", date: "Oct 15, 2026", s: "warning" },
              { title: "Cloud migration checklist", type: "Twitter Thread", status: "Draft", date: "Oct 18, 2026", s: "secondary" },
              { title: "IT Support Case Study", type: "Facebook Post", status: "Published", date: "Oct 01, 2026", s: "blue" },
            ].map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{item.title}</p>
                </td>
                <td className="px-6 py-4 text-gray-500">{item.type}</td>
                <td className="px-6 py-4">
                  <Badge variant={item.s as "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "blue"}>{item.status}</Badge>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    {item.date}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
