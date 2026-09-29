'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/auth';
import { ApiError } from '@/lib/apiClient';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Probe the /auth/me endpoint to restore the session from the httpOnly cookie.
 * The backend issues the cookie on login/register; we never touch it from JS.
 */
async function fetchCurrentUser(): Promise<User | null> {
  try {
    // We re-use the existing apiClient which always sends credentials:'include'
    const { apiClient } = await import('@/lib/apiClient');
    const data = await apiClient.get<{ user: User }>('/auth/me', { rawResponse: true } as never);
    return (data as unknown as { user: User })?.user ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from the httpOnly cookie via the server
  useEffect(() => {
    fetchCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await authApi.login({ email, password });
    setUser(u);
    router.push('/dashboard');
  }, [router]);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const { user: u } = await authApi.register({ email, name, password });
    setUser(u);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Redirect to /login if not authenticated. Returns true while checking. */
export function useRequireAuth(): { loading: boolean; user: User | null } {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  return { loading, user };
}

export { ApiError };
