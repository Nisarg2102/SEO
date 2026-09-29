import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Sparkles, TrendingUp, BarChart, PenTool } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Good morning, User</h1>
          <p className="text-gray-500">Here&apos;s what&apos;s happening with Drashti Softex today.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline"><Search className="mr-2 h-4 w-4" /> Research</Button>
          <Button><Plus className="mr-2 h-4 w-4" /> Create Content</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Opportunities</CardTitle>
            <Search className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-500">+2 since yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Drafts</CardTitle>
            <PenTool className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-gray-500">2 pending review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Position</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.2</div>
            <p className="text-xs text-green-600 font-medium">+1.2 vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <BarChart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-green-600 font-medium">+12% vs last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Top Opportunities</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">IT Support Best Practices 2026</span>
                        <Badge variant="blue">High Confidence</Badge>
                      </div>
                      <p className="text-sm text-gray-500">Trending in your industry sources. Low competition.</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent Content</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">Why your business needs managed IT...</p>
                      <p className="text-sm text-gray-500">LinkedIn • Scheduled for tomorrow</p>
                    </div>
                    <Badge variant={i === 1 ? "success" : "secondary"}>
                      {i === 1 ? "Scheduled" : "Draft"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
