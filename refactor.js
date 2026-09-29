const fs = require('fs');

const files = [
  'apps/web/src/app/workspaces/[workspaceId]/search-console/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/content/new/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/content/[id]/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/content/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/seo-opportunities/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/agent/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/sources/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/seo/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/analytics/page.tsx',
  'apps/web/src/app/workspaces/[workspaceId]/reports/page.tsx'
];

function getRelativeDepth(filePath) {
  const parts = filePath.split('/');
  const srcIndex = parts.indexOf('src');
  const relDepth = parts.length - srcIndex - 2;
  return relDepth > 0 ? '../'.repeat(relDepth) : './';
}

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('localhost:3001')) continue;

  const importPath = getRelativeDepth(file) + 'lib/apiClient';
  if (!code.includes('import { apiClient }')) {
    // Add import statement after the last import
    const lines = code.split('\n');
    let insertIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) insertIdx = i + 1;
    }
    lines.splice(insertIdx, 0, `import { apiClient } from '${importPath}';`);
    code = lines.join('\n');
  }

  // Common pattern 1: GET requests ending with `.then(res => res.json())`
  const getThenRegex = /fetch\(`?http:\/\/localhost:3001\/([^`'"]+)`?,\s*\{\s*headers:\s*\{\s*'?Authorization'?:\s*`Bearer \$\{localStorage\.getItem\('accessToken'\)\}`\s*\}\s*\}\)\s*\.then\(res => res\.json\(\)\)/g;
  code = code.replace(getThenRegex, 'apiClient.get(`$1`)');

  // Common pattern 2: GET with try/catch and res.ok checks
  const getAwaitRegex = /const res = await fetch\(`?http:\/\/localhost:3001\/([^`'"]+)`?,\s*\{\s*headers:\s*\{\s*'?Authorization'?:\s*`Bearer \$\{localStorage\.getItem\('accessToken'\)\}`\s*\}\s*\}\);\s*if \(res\.ok\) \{?\s*([a-zA-Z0-9_]+)\(await res\.json\(\)\);\s*\}?/g;
  code = code.replace(getAwaitRegex, 'const data = await apiClient.get(`$1`);\n      $2(data);');

  // POST request pattern (like POST new content)
  const postAwaitRegex = /const res = await fetch\(`?http:\/\/localhost:3001\/([^`'"]+)`?,\s*\{\s*method:\s*'POST',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*'?Authorization'?:\s*`Bearer \$\{localStorage\.getItem\('accessToken'\)\}`\s*\},\s*body:\s*JSON\.stringify\(([a-zA-Z0-9_]+)\)\s*\}\);/g;
  code = code.replace(postAwaitRegex, 'const res = await apiClient.post(`$1`, $2, { rawResponse: true });');

  // We need to just write specific replacements per file since the regexes miss small variations.
}

console.log("Not executing generic replace. Please do it manually or via explicit replace.");
