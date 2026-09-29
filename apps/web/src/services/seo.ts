import { apiClient } from '@/lib/apiClient';
import type { SeoOpportunity } from '@/types/api';

export const seoApi = {
  listOpportunities(workspaceId: string, filters?: { type?: string; priority?: string }) {
    return apiClient.get<SeoOpportunity[]>(`/workspaces/${workspaceId}/seo-opportunities`, {
      params: filters as Record<string, string>,
    });
  },

  convertToIdea(workspaceId: string, opportunityId: string) {
    return apiClient.post<{ id: string }>(
      `/workspaces/${workspaceId}/seo-opportunities/${opportunityId}/convert`,
    );
  },
};
