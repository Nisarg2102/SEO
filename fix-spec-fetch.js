const fs = require('fs');
const specPath = 'apps/api/src/seo-content/seo-content.service.spec.ts';
let spec = fs.readFileSync(specPath, 'utf8');

spec = spec.replace(/global\.fetch as jest\.Mock/g, "require('@ai-marketing/shared').safeFetch as jest.Mock");
spec = spec.replace(/global\.fetch = jest\.fn\(\) as jest\.Mock;/g, "");
spec = spec.replace(/expect\(global\.fetch\)/g, "expect(require('@ai-marketing/shared').safeFetch)");

fs.writeFileSync(specPath, spec);
