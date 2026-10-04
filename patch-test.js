const fs = require('fs');
let content = fs.readFileSync('services/seo/src/providers/technical-seo.provider.spec.ts', 'utf8');

const linkTests = `
  it('extracts and classifies links correctly', async () => {
    const html = \`
      <html>
        <body>
          <a href="https://example.com/internal">Internal Link</a>
          <a href="https://other.com/external" rel="nofollow sponsored ugc">External Link</a>
        </body>
      </html>
    \`;

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
`;

content = content.replace(/}\);\s*$/g, linkTests + '\n});');
fs.writeFileSync('services/seo/src/providers/technical-seo.provider.spec.ts', content);
