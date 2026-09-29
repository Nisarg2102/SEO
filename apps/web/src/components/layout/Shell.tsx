"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Search,
  PenTool,
  FileText,
  Calendar,
  BarChart3,
  Link as LinkIcon,
  Bot,
  Settings,
  Bell,
  User,
  ChevronDown
} from "lucide-react"

import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Research', href: '/research', icon: Search },
  { name: 'SEO', href: '/seo', icon: PenTool },
  { name: 'Content', href: '/content', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Sources', href: '/sources', icon: LinkIcon },
  { name: 'AI Assistant', href: '/assistant', icon: Bot },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          AI Marketing
        </span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-5 w-5 flex-shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export function Topbar() {
  return (
    <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between items-center">
        <div className="flex items-center gap-x-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="h-6 w-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
              DS
            </div>
            <span className="text-sm font-medium text-gray-900">Drashti Softex</span>
            <ChevronDown className="h-4 w-4 text-gray-500 ml-2" />
          </div>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />
          <button type="button" className="flex items-center gap-x-2 -m-1.5 p-1.5">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
