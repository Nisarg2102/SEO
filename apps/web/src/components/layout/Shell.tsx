'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ChevronDown,
  Plus,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { workspacesApi } from '@/services/workspaces';
import { MedicalWorkspaceBanner } from './MedicalBanner';

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
];

export function Sidebar() {
  const pathname = usePathname();

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
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 h-5 w-5 flex-shrink-0',
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace, refreshWorkspaces, isCreateModalOpen, setCreateModalOpen } = useWorkspace();
  const [open, setOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newType, setNewType] = React.useState<'GENERAL' | 'MEDICAL'>('GENERAL');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isCreateModalOpen) {
      setOpen(true);
      setCreating(true);
    }
  }, [isCreateModalOpen]);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (creating) {
          setCreating(false);
          setCreateModalOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [creating, setCreateModalOpen]);

  const initials = activeWorkspace?.name
    ? activeWorkspace.name.substring(0, 2).toUpperCase()
    : '??';

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const ws = await workspacesApi.create({ name: newName.trim(), type: newType });
      await refreshWorkspaces();
      setActiveWorkspace(ws);
      setCreating(false);
      setCreateModalOpen(false);
      setOpen(false);
      setNewName('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create workspace';
      alert(message);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <div className="h-6 w-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <span className="text-sm font-medium text-gray-900 max-w-[140px] truncate">
          {activeWorkspace?.name ?? 'Select Workspace'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => { setActiveWorkspace(ws); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 p-2 rounded-md text-left text-sm transition-colors',
                  activeWorkspace?.id === ws.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-50 text-gray-700',
                )}
              >
                <div className="h-6 w-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {ws.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="truncate">{ws.name}</span>
                {ws.type === 'MEDICAL' && (
                  <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    Medical
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 p-2">
            {creating ? (
              <div className="space-y-2 p-1">
                <input
                  autoFocus
                  type="text"
                  placeholder="Workspace name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'GENERAL' | 'MEDICAL')}
                  className="w-full text-sm text-gray-900 bg-white border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="GENERAL">General</option>
                  <option value="MEDICAL">Medical / Health</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    className="flex-1 text-xs bg-blue-600 text-white rounded py-1.5 hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setCreating(false);
                      setCreateModalOpen(false);
                    }}
                    className="flex-1 text-xs bg-gray-100 text-gray-700 rounded py-1.5 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 p-2 rounded-md text-sm text-gray-600 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                New Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { activeWorkspace } = useWorkspace();
  const isMedical = activeWorkspace?.type === 'MEDICAL';

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <div className="hidden lg:block lg:w-72 lg:shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        {isMedical && <MedicalWorkspaceBanner />}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-between items-center">
        <WorkspaceSwitcher />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button 
            type="button" 
            onClick={() => alert("No new notifications")}
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-x-2 -m-1.5 p-1.5"
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              {user && (
                <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user.name}
                </span>
              )}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {user && (
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
