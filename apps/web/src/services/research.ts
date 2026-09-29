import { apiClient } from '@/lib/apiClient';
import type { ResearchItem, ResearchFilters } from '@/types/api';

export const researchApi = {
  list(workspaceId: string, filters?: ResearchFilters) {
    return apiClient.get<ResearchItem[]>(`/workspaces/${workspaceId}/research`, {
      params: filters as Record<string, string>,
    });
  },

  get(workspaceId: string, id: string) {
    return apiClient.get<ResearchItem>(`/workspaces/${workspaceId}/research/${id}`);
  },

  sync(workspaceId: string) {
    return apiClient.post<{ message: string; jobId: string }>(
      `/workspaces/${workspaceId}/research/sync`,
    );
  },

  convertToIdea(workspaceId: string, id: string, title?: string) {
    return apiClient.post<{ id: string }>(`/workspaces/${workspaceId}/research/${id}/convert`, {
      title,
    });
  },
};
