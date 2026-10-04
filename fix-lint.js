const fs = require('fs');

let page = fs.readFileSync('apps/web/src/app/(dashboard)/settings/page.tsx', 'utf8');
if (!page.includes('import type { WorkspaceIntegrations }')) {
  page = page.replace("import type { BrandProfile, UpsertBrandProfilePayload } from '@/types/api';", "import type { BrandProfile, UpsertBrandProfilePayload, WorkspaceIntegrations } from '@/types/api';");
}
fs.writeFileSync('apps/web/src/app/(dashboard)/settings/page.tsx', page);

console.log('Fixed linting errors');
