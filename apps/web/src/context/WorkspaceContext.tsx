'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { workspacesApi } from '@/services/workspaces';
import { useAuth } from '@/context/AuthContext';
import type { Workspace } from '@/types/api';

const ACTIVE_WS_KEY = 'activeWorkspaceId';

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  setActiveWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  isCreateModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setLoading(false);
      return;
    }
    try {
      const list = await workspacesApi.list();
      setWorkspaces(list);

      const storedId =
        typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_WS_KEY) : null;
      const restored = storedId ? list.find((w) => w.id === storedId) : null;
      setActiveWorkspaceState(restored ?? list[0] ?? null);
    } catch {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const setActiveWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_WS_KEY, workspace.id);
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  return (
    <WorkspaceContext.Provider
      value={{ 
        workspaces, 
        activeWorkspace, 
        loading, 
        setActiveWorkspace, 
        refreshWorkspaces,
        isCreateModalOpen,
        setCreateModalOpen
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  return ctx;
}
