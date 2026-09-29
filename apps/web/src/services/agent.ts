import { apiClient } from '@/lib/apiClient';
import type { AgentChatResponse, ChatMessage } from '@/types/api';

export const agentApi = {
  chat(workspaceId: string, message: string, history: ChatMessage[] = []) {
    return apiClient.post<AgentChatResponse>(`/workspaces/${workspaceId}/agent/chat`, {
      message,
      history,
    });
  },
};
