import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, BookOpen, ExternalLink, Filter, TrendingUp } from "lucide-react"

export default function ResearchPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Research Discovery</h1>
          <p className="text-gray-500">AI-curated opportunities based on your industry sources.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          <Button><Sparkles className="mr-2 h-4 w-4" /> Discover Now</Button>
        </div>
      </div>

      <div className="grid gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden hover:border-blue-200 transition-colors">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={i === 1 ? "blue" : "secondary"}>
                        {i === 1 ? <TrendingUp className="mr-1 h-3 w-3" /> : null}
                        {i === 1 ? "Emerging Topic" : "Frequent Topic"}
                      </Badge>
                      <span className="text-sm text-gray-500 flex items-center">
                        <BookOpen className="mr-1 h-3 w-3" />
                        TechCrunch • 2 hours ago
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">The Rise of AI in Managed IT Services</h3>
                  </div>
                </div>

                <p className="text-gray-600">
                  Recent reports indicate a 40% increase in MSPs adopting AI for predictive maintenance.
                  This presents a strong opportunity to educate your audience on how AI-driven IT support
                  reduces downtime.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline">Target: IT Decision Makers</Badge>
                  <Badge variant="outline">Intent: Educational</Badge>
                  <Badge variant="outline">Formats: LinkedIn, Blog</Badge>
                </div>
              </div>

              <div className="bg-gray-50 p-6 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col justify-center space-y-3 min-w-[200px]">
                <Button className="w-full"><Sparkles className="mr-2 h-4 w-4" /> Create Content</Button>
                <Button variant="outline" className="w-full">Save for Later</Button>
                <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700">
                  View Source <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
