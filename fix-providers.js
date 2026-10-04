const fs = require('fs');

const files = [
  'services/seo/src/providers/trends.provider.ts',
  'services/seo/src/providers/autocomplete.provider.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('safeFetch')) {
    content = "import { safeFetch } from '@ai-marketing/shared';\n" + content;
    content = content.replace(/await fetch\(/g, "await safeFetch(");
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
