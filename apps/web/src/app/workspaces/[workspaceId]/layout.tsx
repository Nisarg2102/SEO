'use client';

import { useRequireAuth } from '@/context/AuthContext';
import { WorkspaceAppShell } from '@/components/layout/WorkspaceShell';

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
    <WorkspaceAppShell workspaceId={params.workspaceId}>
      {children}
    </WorkspaceAppShell>
  );
}
