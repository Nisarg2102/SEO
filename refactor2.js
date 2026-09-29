const fs = require('fs');

const files = [
  'apps/web/src/app/workspaces/[workspaceId]/calendar/page.tsx',
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

function processFile(file) {
  let content = fs.readFileSync(file, 'utf-8');
  if (!content.includes('localhost:3001')) return;

  const importPath = getRelativeDepth(file) + 'lib/apiClient';
  
  if (!content.includes('import { apiClient }')) {
    content = `import { apiClient } from '${importPath}';\n` + content;
  }

  // Common pattern 1: Get requests
  // const res = await fetch(`http://localhost:3001/...`, { headers: ... })
  // if (res.ok) { setItems(await res.json()); }
  // This is too hard to replace via regex accurately because of multi-line.
}
