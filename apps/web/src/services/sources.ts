import { apiClient } from '@/lib/apiClient';
import type { Source, CreateSourcePayload, UpdateSourcePayload } from '@/types/api';

export const sourcesApi = {
  list(workspaceId: string) {
    return apiClient.get<Source[]>(`/workspaces/${workspaceId}/sources`);
  },

  get(workspaceId: string, id: string) {
    return apiClient.get<Source>(`/workspaces/${workspaceId}/sources/${id}`);
  },

  create(workspaceId: string, data: CreateSourcePayload) {
    return apiClient.post<Source>(`/workspaces/${workspaceId}/sources`, data);
  },

  update(workspaceId: string, id: string, data: UpdateSourcePayload) {
    return apiClient.put<Source>(`/workspaces/${workspaceId}/sources/${id}`, data);
  },

  remove(workspaceId: string, id: string) {
    return apiClient.delete<void>(`/workspaces/${workspaceId}/sources/${id}`);
  },
};
