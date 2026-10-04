import { apiClient } from '@/lib/apiClient';
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
    return apiClient.get<Workspace>(`/workspaces/${workspaceId}`);
  },

  getStats(workspaceId: string) {
    return apiClient.get<WorkspaceStats>(`/workspaces/${workspaceId}/stats`);
  },

  update(workspaceId: string, data: { name?: string }) {
    return apiClient.patch<Workspace>(`/workspaces/${workspaceId}`, data);
  },

  getBrandProfile(workspaceId: string) {
    return apiClient.get<BrandProfile>(`/workspaces/${workspaceId}/brand-profile`);
  },

  upsertBrandProfile(workspaceId: string, data: UpsertBrandProfilePayload) {
    return apiClient.put<BrandProfile>(`/workspaces/${workspaceId}/brand-profile`, data);
  },


  getIntegrations(workspaceId: string) {
    return apiClient.get<WorkspaceIntegrations>(`/workspaces/${workspaceId}/integrations`);
  },

  getInstagramAuthUrl(workspaceId: string) {
    return apiClient.get<{ url: string }>(`/workspaces/${workspaceId}/social/instagram/auth-url`);
  },

  syncInstagram(workspaceId: string) {
    return apiClient.post(`/workspaces/${workspaceId}/social/instagram/sync`);
  },

  disconnectInstagram(workspaceId: string) {
    return apiClient.post(`/workspaces/${workspaceId}/social/instagram/disconnect`);
  }
};
