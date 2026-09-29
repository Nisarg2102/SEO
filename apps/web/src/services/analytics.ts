import { apiClient } from '@/lib/apiClient';
import type { AnalyticsDashboard } from '@/types/api';

export const analyticsApi = {
  getDashboard(workspaceId: string) {
    return apiClient.get<AnalyticsDashboard>(`/workspaces/${workspaceId}/analytics`);
  },
};
