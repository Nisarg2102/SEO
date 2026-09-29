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

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  rawResponse?: boolean;
}

export const apiClient = {
  getBaseUrl() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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
