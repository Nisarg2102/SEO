import { apiClient } from '@/lib/apiClient';
import type { AuthResponse } from '@/types/api';

export const authApi = {
  register(data: { email: string; name: string; password: string }) {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  login(data: { email: string; password: string }) {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  logout() {
    return apiClient.post<{ success: boolean }>('/auth/logout');
  },
};
