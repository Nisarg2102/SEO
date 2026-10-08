export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null) {
    for (const key of ['details', 'message'] as const) {
      const value = key in error.data ? (error.data as Record<string, unknown>)[key] : undefined;
      if (typeof value === 'string' && value) return value;
      if (Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string')) {
        return value.join(', ');
      }
    }
  }
  return error instanceof Error && error.message ? error.message : 'Unknown error';
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  rawResponse?: boolean;
}

export const apiClient = {
  getBaseUrl() {
    // In browser on Vercel or any non-localhost host, use relative /api
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return '/api';
    }
    // Locally (or SSR), use the env var and ensure it ends with /api
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  },

  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, rawResponse, ...customConfig } = options;

    let url = `${this.getBaseUrl()}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += `?${qs}`;
      }
    }

    const config: RequestInit = {
      ...customConfig,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const response = await fetch(url, config);

    if (rawResponse) {
      if (!response.ok) {
        return null as unknown as T;
      }
      return response.json() as Promise<T>;
    }

    if (response.status === 204) {
      return {} as T;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        (data as Record<string, string>)?.message ||
        response.statusText ||
        'An error occurred';
      throw new ApiError(response.status, message, data);
    }

    return data as T;
  },

  get<T = unknown>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = unknown>(endpoint: string, data?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
  },

  put<T = unknown>(endpoint: string, data?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
  },

  patch<T = unknown>(endpoint: string, data?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
  },

  delete<T = unknown>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
