'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/context/AuthContext';

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceId: string };
}) {
  const { loading, user } = useRequireAuth();
  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="font-bold text-xl tracking-tight text-blue-600">AI Marketing</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {[
              { name: 'Dashboard', path: '' },
              { name: 'AI Agent', path: '/agent' },
              { name: 'Research', path: '/research' },
              { name: 'SEO', path: '/seo' },
              { name: 'Content', path: '/content' },
              { name: 'Instagram', path: '/social' },
              { name: 'Calendar', path: '/calendar' },
              { name: 'Analytics', path: '/analytics' },
              { name: 'Reports', path: '/reports' },
              { name: 'Sources', path: '/sources' },
              { name: 'Brand Profile', path: '/brand-profile' },
              { name: 'Settings', path: '/settings' },
            ].map((item) => (
              <li key={item.name}>
                <Link 
                  href={`/workspaces/${params.workspaceId}${item.path}`} 
                  className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Link href="/workspaces" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            ← Switch Workspace
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-500 mr-2">Active Workspace:</span>
            <span className="text-sm font-bold bg-blue-100 text-blue-800 py-1 px-3 rounded-full">
              {params.workspaceId.substring(0, 8)}...
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
