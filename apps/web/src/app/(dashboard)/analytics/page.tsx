
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics</h1>
          <p className="text-gray-500">Measure the impact of your marketing efforts.</p>
        </div>
        <div className="flex items-center space-x-2">
          <select className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Custom range</option>
          </select>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>

      <EmptyState
        icon={BarChart3}
        title="No analytics data yet"
        description="Connect your social media accounts and Google Search Console to start tracking your performance."
        action={<Button>Connect Integrations</Button>}
      />
    </div>
  )
}
