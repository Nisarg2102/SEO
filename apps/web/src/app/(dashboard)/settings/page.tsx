import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your workspace preferences and integrations.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Profile</CardTitle>
            <CardDescription>Update your brand information to help the AI generate better content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Workspace Name</label>
              <input type="text" defaultValue="Drashti Softex" className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm max-w-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Industry</label>
              <input type="text" defaultValue="IT Services & Hardware" className="h-10 rounded-md border border-gray-300 px-3 py-2 text-sm max-w-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Target Audience</label>
              <textarea defaultValue="Small to medium business owners looking for reliable IT infrastructure and support." className="min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect external tools and platforms.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium">Google Search Console</p>
                <p className="text-sm text-gray-500">Import SEO performance data</p>
              </div>
              <Button variant="outline">Connect</Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">LinkedIn</p>
                  <Badge variant="success">Connected</Badge>
                </div>
                <p className="text-sm text-gray-500">Publish posts and track engagement</p>
              </div>
              <Button variant="outline" className="text-red-600 hover:text-red-700">Disconnect</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
