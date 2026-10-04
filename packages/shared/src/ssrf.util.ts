import * as net from 'node:net';
import * as dns from 'node:dns/promises';

/**
 * SSRF protection for the free SEO crawler.
 *
 * Rules enforced:
 * 1. Only http:// and https:// protocols allowed.
 * 2. Hostname must not resolve to any private/loopback/reserved IP.
 * 3. URL must pass Node URL parsing (no malformed URLs).
 * 4. Port must be 80, 443, or absent (no internal service ports).
 * 5. Redirect destinations are re-validated through the same checks.
 */

/** Private and reserved IPv4 CIDR ranges (RFC 1918, RFC 5737, RFC 3927, etc.) */
const PRIVATE_IPv4_RANGES: [number, number, number][] = [
  // loopback
  [0x7f000000, 0xff000000, 127],
  // link-local
  [0xa9fe0000, 0xffff0000, 169],
  // private class A
  [0x0a000000, 0xff000000, 10],
  // private class B
  [0xac100000, 0xfff00000, 172],
  // private class C
  [0xc0a80000, 0xffff0000, 192],
  // IANA local
  [0xc0000000, 0xffffff00, 192],
  // 0.0.0.0/8 — "this" network
  [0x00000000, 0xff000000, 0],
  // 100.64.0.0/10 — shared address space
  [0x64400000, 0xffc00000, 100],
  // 192.0.0.0/24 — IETF protocol
  [0xc0000000, 0xffffff00, 192],
  // 198.18.0.0/15 — benchmark
  [0xc6120000, 0xfffe0000, 198],
  // 198.51.100.0/24 — TEST-NET-2
  [0xc6336400, 0xffffff00, 198],
  // 203.0.113.0/24 — TEST-NET-3
  [0xcb007100, 0xffffff00, 203],
  // 240.0.0.0/4 — reserved
  [0xf0000000, 0xf0000000, 240],
  // 255.255.255.255 — broadcast
  [0xffffffff, 0xffffffff, 255],
];

const ALLOWED_PORTS = new Set([80, 443]);

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  return PRIVATE_IPv4_RANGES.some(([base, mask]) => (n & mask) === (base & mask));
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, '');
  return (
    lower === '::1' || // loopback
    lower.startsWith('fc') || // Unique local
    lower.startsWith('fd') || // Unique local
    lower.startsWith('fe80') || // link-local
    lower.startsWith('::ffff:') || // IPv4-mapped — check the embedded IPv4
    lower === '::' ||
    lower.startsWith('2001:db8') // documentation
  );
}

/** Throws SsrfError if the IP is private/reserved */
function assertPublicIp(ip: string): void {
  if (net.isIPv4(ip)) {
    if (isPrivateIPv4(ip)) throw new SsrfError(`Resolved to private IPv4: ${ip}`);
  } else if (net.isIPv6(ip)) {
    if (isPrivateIPv6(ip)) throw new SsrfError(`Resolved to private IPv6: ${ip}`);
  }
}

export class SsrfError extends Error {
  constructor(reason: string) {
    super(`SSRF protection: ${reason}`);
    this.name = 'SsrfError';
  }
}

export class UrlValidationError extends Error {
  constructor(reason: string) {
    super(`URL validation: ${reason}`);
    this.name = 'UrlValidationError';
  }
}

/**
 * Validates a URL for safe outbound HTTP requests.
 *
 * @throws UrlValidationError for structurally invalid or disallowed URLs
 * @throws SsrfError if the hostname resolves to a private/reserved address
 */
export async function validateUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UrlValidationError(`Malformed URL: ${rawUrl}`);
  }

  // Only allow http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UrlValidationError(`Protocol not allowed: ${parsed.protocol}`);
  }

  // Block numeric IPs immediately (before DNS) — catches literal private IPs
  const hostname = parsed.hostname;
  if (net.isIPv4(hostname)) {
    assertPublicIp(hostname);
    return parsed;
  }
  if (net.isIPv6(hostname)) {
    assertPublicIp(hostname.replace(/^\[|\]$/g, ''));
    return parsed;
  }

  // Block dangerous hostnames
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === 'metadata.google.internal' ||
    lower === '169.254.169.254' ||
    lower.endsWith('.internal') ||
    lower.endsWith('.local') ||
    lower.endsWith('.localhost')
  ) {
    throw new SsrfError(`Hostname blocked: ${hostname}`);
  }

  // Port restriction: only allow 80, 443, or the default (empty port)
  if (parsed.port) {
    const port = parseInt(parsed.port, 10);
    if (!ALLOWED_PORTS.has(port)) {
      throw new UrlValidationError(`Port not allowed: ${parsed.port}`);
    }
  }

  // DNS resolution — resolve all IPs and validate every one
  let addresses: string[];
  try {
    const resolved = await dns.resolve(hostname);
    addresses = resolved;
  } catch {
    throw new SsrfError(`DNS resolution failed for hostname: ${hostname}`);
  }

  for (const addr of addresses) {
    assertPublicIp(addr);
  }

  return parsed;
}

/**
 * Lightweight validation for same-session use when DNS was already checked.
 * Only checks protocol and hostname blocklist — does NOT re-resolve DNS.
 * Use this for redirect destinations on the same host.
 */
export function validateUrlStructureOnly(rawUrl: string, expectedHostname: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UrlValidationError(`Malformed redirect URL: ${rawUrl}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UrlValidationError(`Redirect protocol not allowed: ${parsed.protocol}`);
  }

  // Only allow redirects within the same hostname
  if (parsed.hostname !== expectedHostname) {
    throw new SsrfError(`Redirect to different host blocked: ${parsed.hostname}`);
  }

  return parsed;
}

/**
 * Safely fetches a URL by following redirects manually and validating each hop.
 */
export async function safeFetch(
  url: string, 
  options: RequestInit = {}, 
  maxRedirects = 5
): Promise<Response> {
  let currentUrl = url;
  let redirects = 0;
  
  const fetchOptions: RequestInit = {
    ...options,
    redirect: 'manual'
  };

  while (redirects <= maxRedirects) {
    const parsedUrl = await validateUrl(currentUrl);
    
    const response = await fetch(currentUrl, fetchOptions);
    
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return response; 
      }
      const nextUrl = new URL(location, parsedUrl).href;
      currentUrl = nextUrl;
      redirects++;
    } else {
      Object.defineProperty(response, 'url', { value: currentUrl });
      Object.defineProperty(response, 'redirected', { value: redirects > 0 });
      return response;
    }
  }
  throw new SsrfError(`Exceeded maximum redirects (${maxRedirects})`);
}
