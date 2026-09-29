import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, TrendingUp, Search, AlertCircle } from "lucide-react"

export default function SEOPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">SEO Performance</h1>
          <p className="text-gray-500">Track rankings and discover optimization opportunities.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">Run Site Audit</Button>
          <Button>Generate Report</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <BarChart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-green-600 font-medium">+12% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Search className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14,320</div>
            <p className="text-xs text-green-600 font-medium">+5% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.6%</div>
            <p className="text-xs text-green-600 font-medium">+1.2% vs last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Position</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.2</div>
            <p className="text-xs text-green-600 font-medium">+1.2 vs last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Keyword Opportunities</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { kw: "managed IT services pricing", pos: 12, imp: 1200, ctr: "1.2%", rec: "Improve page title and meta description. High impressions but low CTR." },
            { kw: "IT support for small business", pos: 15, imp: 850, ctr: "2.4%", rec: "Update content with 2026 statistics to improve relevance and ranking." }
          ].map((item, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{item.kw}</h3>
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      <span>Pos: {item.pos}</span>
                      <span>Imp: {item.imp}</span>
                      <span>CTR: {item.ctr}</span>
                    </div>
                  </div>
                  <Badge variant="warning">Opportunity</Badge>
                </div>
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                  <p>{item.rec}</p>
                </div>
                <div className="pt-2 flex gap-2">
                  <Button size="sm" variant="outline">View Page</Button>
                  <Button size="sm">Create Content Idea</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
