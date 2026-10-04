import { FreeTechnicalSeoProvider } from './technical-seo.provider';

describe('FreeTechnicalSeoProvider', () => {
  let provider: FreeTechnicalSeoProvider;
  
  beforeEach(() => {
    provider = new FreeTechnicalSeoProvider();
    
    // Mock global fetch
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('crawls successfully and extracts title and description', async () => {
    const html = `
      <html>
        <head>
          <title>Test Page Title Is Long Enough</title>
          <meta name="description" content="This is a test description.">
          <link rel="canonical" href="https://example.com/test">
        </head>
        <body>
          <h1>Main Heading</h1>
          <a href="https://example.com/page2">Page 2</a>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: 'https://example.com/',
      headers: new Headers({ 'content-type': 'text/html' }),
      arrayBuffer: async () => new TextEncoder().encode(html).buffer,
    });
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: 'https://example.com/page2',
      headers: new Headers({ 'content-type': 'text/html' }),
      arrayBuffer: async () => new TextEncoder().encode('<html><head><title>P2</title></head><body><h1>H</h1></body></html>').buffer,
    });

    const result = await provider.crawl('https://example.com', { maxPages: 2, maxDepth: 1 });
    
    expect(result.summary.pagesCrawled).toBe(2);
    expect(result.pages[0].title).toBe('Test Page Title Is Long Enough');
    expect(result.pages[0].metaDesc).toBe('This is a test description.');
    expect(result.pages[0].h1).toBe('Main Heading');
    expect(result.pages[0].canonicalUrl).toBe('https://example.com/test');
    
    // page 2
    expect(result.pages[1].title).toBe('P2');
  });
  
  it('detects missing tags as issues', async () => {
    const html = `
      <html>
        <head>
        </head>
        <body>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: 'https://example.com/',
      headers: new Headers({ 'content-type': 'text/html' }),
      arrayBuffer: async () => new TextEncoder().encode(html).buffer,
    });

    const result = await provider.crawl('https://example.com', { maxPages: 1, maxDepth: 0 });
    const page = result.pages[0];
    
    expect(page.issues.some(i => i.code === 'MISSING_TITLE')).toBe(true);
    expect(page.issues.some(i => i.code === 'MISSING_DESC')).toBe(true);
    expect(page.issues.some(i => i.code === 'MISSING_H1')).toBe(true);
    expect(page.issues.some(i => i.code === 'MISSING_CANONICAL')).toBe(true);
  });
  
  it('blocks private IP SSRF attempts', async () => {
    // Attempting to crawl a private IP
    await expect(provider.crawl('http://192.168.1.1', { maxPages: 1, maxDepth: 0 }))
      .rejects.toThrow(/SSRF protection: Resolved to private IPv4/);
  });

  it('extracts and classifies links correctly', async () => {
    const html = `
      <html>
        <body>
          <a href="https://example.com/internal">Internal Link</a>
          <a href="https://other.com/external" rel="nofollow sponsored ugc">External Link</a>
        </body>
      </html>
    `;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      url: 'https://example.com/',
      headers: new Headers({ 'content-type': 'text/html' }),
      arrayBuffer: async () => new TextEncoder().encode(html).buffer,
    });

    const result = await provider.crawl('https://example.com', { maxPages: 1, maxDepth: 0 });
    const page = result.pages[0];
    
    expect(page.links).toHaveLength(2);
    
    const internal = page.links.find(l => l.linkType === 'INTERNAL');
    expect(internal?.targetUrl).toBe('https://example.com/internal');
    expect(internal?.anchorText).toBe('Internal Link');
    expect(internal?.isNofollow).toBe(false);

    const external = page.links.find(l => l.linkType === 'EXTERNAL');
    expect(external?.targetUrl).toBe('https://other.com/external');
    expect(external?.anchorText).toBe('External Link');
    expect(external?.isNofollow).toBe(true);
    expect(external?.isSponsored).toBe(true);
    expect(external?.isUgc).toBe(true);
  });

});