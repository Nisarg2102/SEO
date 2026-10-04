const fs = require('fs');
const path = 'services/seo/src/utils/ssrf.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('safeFetch')) {
  code += `
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
  throw new SsrfError(\`Exceeded maximum redirects (\${maxRedirects})\`);
}
`;
  fs.writeFileSync(path, code);
  console.log('Added safeFetch');
}
