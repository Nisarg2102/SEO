import { validateUrl, SsrfError, UrlValidationError, safeFetch } from './ssrf.util';
import * as dns from 'node:dns/promises';

jest.mock('node:dns/promises', () => ({
  resolve: jest.fn()
}));

describe('SSRF Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUrl', () => {
    it('blocks localhost string', async () => {
      await expect(validateUrl('http://localhost:3000')).rejects.toThrow(SsrfError);
    });

    it('blocks if DNS resolves to private IP', async () => {
      (dns.resolve as jest.Mock).mockResolvedValue(['192.168.1.100']);
      await expect(validateUrl('http://my-internal-app.local')).rejects.toThrow(SsrfError);
    });

    it('allows valid public URL', async () => {
      (dns.resolve as jest.Mock).mockResolvedValue(['93.184.216.34']);
      const res = await validateUrl('https://example.com/path');
      expect(res.href).toBe('https://example.com/path');
    });

    it('blocks cloud metadata', async () => {
      await expect(validateUrl('http://169.254.169.254/latest')).rejects.toThrow(SsrfError);
    });
  });

  describe('safeFetch', () => {
    let originalFetch: any;

    beforeEach(() => {
      originalFetch = global.fetch;
      global.fetch = jest.fn() as any;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('validates URL before fetching', async () => {
      await expect(safeFetch('http://localhost/test')).rejects.toThrow(SsrfError);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('follows safe redirect', async () => {
      (dns.resolve as jest.Mock).mockResolvedValue(['8.8.8.8']);
      
      let fetchCallCount = 0;
      (global.fetch as jest.Mock).mockImplementation(async () => {
        fetchCallCount++;
        if (fetchCallCount === 1) {
          return { status: 301, headers: new Headers({ location: '/new-path' }) };
        }
        return { status: 200, headers: new Headers() };
      });

      const res = await safeFetch('https://example.com/old-path');
      expect(res.status).toBe(200);
      expect(fetchCallCount).toBe(2);
      expect(res.url).toBe('https://example.com/new-path');
    });

    it('blocks unsafe redirect to private IP', async () => {
      let fetchCallCount = 0;
      (dns.resolve as jest.Mock).mockImplementation(async (host) => {
        if (host === 'example.com') return ['8.8.8.8'];
        return ['169.254.169.254'];
      });

      (global.fetch as jest.Mock).mockImplementation(async () => {
        fetchCallCount++;
        if (fetchCallCount === 1) {
          return { status: 302, headers: new Headers({ location: 'http://169.254.169.254/latest' }) };
        }
        return { status: 200, headers: new Headers() };
      });

      await expect(safeFetch('https://example.com/redirect')).rejects.toThrow(SsrfError);
      expect(fetchCallCount).toBe(1);
    });
  });
});
