'use client';
import { AppShell } from '@/components/layout/Shell';
import { useRequireAuth } from '@/context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useRequireAuth();
  
  if (loading || !user) {
    return null; // Return nothing while redirecting
  }
  
  return <AppShell>{children}</AppShell>;
}
