import { apiClient, ApiError } from './apiClient';

describe('apiClient', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_API_URL;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('uses NEXT_PUBLIC_API_URL when set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    expect(apiClient.getBaseUrl()).toBe('https://api.example.com');
  });

  it('defaults to http://localhost:3001 if no env is set', () => {
    expect(apiClient.getBaseUrl()).toBe('http://localhost:3001');
  });

  it('sends credentials with requests for cookie auth', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    });

    await apiClient.get('/test');

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/test', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('throws ApiError on non-2xx response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Validation Failed' })
    });

    await expect(apiClient.get('/error')).rejects.toThrow(ApiError);
  });
  
  it('handles 204 No Content correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => { throw new Error('Should not be called'); }
    });

    const result = await apiClient.delete('/test');
    expect(result).toEqual({});
  });
});
