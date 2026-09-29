import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react"
import Link from "next/link"

export default function CalendarPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Content Calendar</h1>
          <p className="text-gray-500">Plan and schedule your upcoming marketing content.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white rounded-md border border-gray-200 p-1">
            <Button variant="ghost" size="sm" className="h-8">Month</Button>
            <Button variant="secondary" size="sm" className="h-8 shadow-sm">Week</Button>
            <Button variant="ghost" size="sm" className="h-8">List</Button>
          </div>
          <Button asChild><Link href="/content/create"><Plus className="mr-2 h-4 w-4" /> Schedule Post</Link></Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-semibold w-48 text-center">October 25 - 31, 2026</h2>
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button variant="outline">Today</Button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-gray-500">
            <CalendarIcon className="h-12 w-12 text-gray-300" />
            <div>
              <p className="font-medium text-gray-900">No content scheduled for this week</p>
              <p className="text-sm">Create and schedule content to see it appear here.</p>
            </div>
            <Button asChild variant="outline" className="mt-4"><Link href="/content/create"><Plus className="mr-2 h-4 w-4" /> Schedule New Content</Link></Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
