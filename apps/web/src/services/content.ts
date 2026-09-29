import { apiClient } from '@/lib/apiClient';
import type { ContentPack, GenerateContentPayload, UpdateContentPayload } from '@/types/api';

export const contentApi = {
  list(workspaceId: string) {
    return apiClient.get<ContentPack[]>(`/workspaces/${workspaceId}/content-packs`);
  },

  get(workspaceId: string, id: string) {
    return apiClient.get<ContentPack>(`/workspaces/${workspaceId}/content-packs/${id}`);
  },

  generate(workspaceId: string, data: GenerateContentPayload) {
    return apiClient.post<ContentPack>(`/workspaces/${workspaceId}/content-packs/generate`, data);
  },

  update(workspaceId: string, id: string, data: UpdateContentPayload) {
    return apiClient.put<ContentPack>(`/workspaces/${workspaceId}/content-packs/${id}`, data);
  },

  remove(workspaceId: string, id: string) {
    return apiClient.delete<void>(`/workspaces/${workspaceId}/content-packs/${id}`);
  },
};
