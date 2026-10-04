const fs = require('fs');
const content = `import { apiClient } from '@/lib/apiClient';
import type {
  Workspace,
  WorkspaceStats,
  CreateWorkspacePayload,
  BrandProfile,
  UpsertBrandProfilePayload,
  WorkspaceIntegrations
} from '@/types/api';

export const workspacesApi = {
  list() {
    return apiClient.get<Workspace[]>('/workspaces');
  },

  create(data: CreateWorkspacePayload) {
    return apiClient.post<Workspace>('/workspaces', data);
  },

  get(workspaceId: string) {
    return apiClient.get<Workspace>(\`/workspaces/\${workspaceId}\`);
  },

  getStats(workspaceId: string) {
    return apiClient.get<WorkspaceStats>(\`/workspaces/\${workspaceId}/stats\`);
  },

  update(workspaceId: string, data: { name?: string }) {
    return apiClient.patch<Workspace>(\`/workspaces/\${workspaceId}\`, data);
  },

  getBrandProfile(workspaceId: string) {
    return apiClient.get<BrandProfile>(\`/workspaces/\${workspaceId}/brand-profile\`);
  },

  upsertBrandProfile(workspaceId: string, data: UpsertBrandProfilePayload) {
    return apiClient.put<BrandProfile>(\`/workspaces/\${workspaceId}/brand-profile\`, data);
  },

  getIntegrations(workspaceId: string) {
    return apiClient.get<WorkspaceIntegrations>(\`/workspaces/\${workspaceId}/integrations\`);
  },

  togglePostiz(workspaceId: string, connect: boolean) {
    return apiClient.post(\`/workspaces/\${workspaceId}/integrations/postiz\`, { connect });
  }
};
`;
fs.writeFileSync('apps/web/src/services/workspaces.ts', content);
