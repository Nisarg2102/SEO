const fs = require('fs');
const file = 'services/seo/src/providers/technical-seo.provider.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import { safeFetch } from '@ai-marketing/shared';")) {
  code = "import { safeFetch } from '@ai-marketing/shared';\n" + code;
}
code = code.replace("if (page.pageSize > 5 * 1024 * 1024) {", "if (page.pageSize && page.pageSize > 5 * 1024 * 1024) {");

fs.writeFileSync(file, code);
