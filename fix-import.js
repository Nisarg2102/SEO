const fs = require('fs');
const path = 'apps/web/src/app/(dashboard)/settings/page.tsx';
let page = fs.readFileSync(path, 'utf8');

page = page.replace("import Link from 'next/link';\n'use client';", "'use client';\nimport Link from 'next/link';");
fs.writeFileSync(path, page);
console.log('Fixed import');
