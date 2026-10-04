const fs = require('fs');

// 1. Update technical-seo.provider.ts
const seoFile = 'services/seo/src/providers/technical-seo.provider.ts';
let seo = fs.readFileSync(seoFile, 'utf8');
if (!seo.includes('safeFetch')) {
  seo = seo.replace("import { URL } from 'url';", "import { URL } from 'url';\nimport { safeFetch } from '@ai-marketing/shared';");
  
  // They have: const response = await fetch(url, { ... redirect: 'follow'
  // safeFetch natively handles redirect: 'manual' and follows them securely.
  // We can just replace fetch with safeFetch and remove redirect: 'follow' (or let safeFetch override it).
  seo = seo.replace(/await fetch\(/g, "await safeFetch(");
  fs.writeFileSync(seoFile, seo);
  console.log('Updated technical-seo');
}

// 2. Update apps/api/src/seo-content/seo-content.service.ts
const contentFile = 'apps/api/src/seo-content/seo-content.service.ts';
let content = fs.readFileSync(contentFile, 'utf8');
if (!content.includes('safeFetch')) {
  content = content.replace("import { Injectable, Logger, NotFoundException } from '@nestjs/common';", "import { Injectable, Logger, NotFoundException } from '@nestjs/common';\nimport { safeFetch } from '@ai-marketing/shared';");
  content = content.replace(/await fetch\(/g, "await safeFetch(");
  fs.writeFileSync(contentFile, content);
  console.log('Updated seo-content');
}
