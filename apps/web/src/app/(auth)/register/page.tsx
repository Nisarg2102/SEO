import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            AI Marketing
          </h1>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-10 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="pt-2">
              <Link href="/dashboard">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Sign up</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
