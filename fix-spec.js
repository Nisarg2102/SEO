const fs = require('fs');
const specPath = 'apps/api/src/seo-content/seo-content.service.spec.ts';
let spec = fs.readFileSync(specPath, 'utf8');

if (!spec.includes("jest.mock('@ai-marketing/shared'")) {
  spec = spec.replace(
    "describe('SeoContentService', () => {",
    "jest.mock('@ai-marketing/shared', () => ({\n  safeFetch: jest.fn(),\n}));\n\ndescribe('SeoContentService', () => {"
  );
  fs.writeFileSync(specPath, spec);
  console.log('Fixed spec mock');
}
