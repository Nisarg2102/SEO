#!/usr/bin/env node
// db-push.js — run from project root: node db-push.js
// Reads DATABASE_URL from .env and pushes Prisma schema

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env
const envFile = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envFile, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  let val = trimmed.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1');
  // Expand simple ${VAR} references
  val = val.replace(/\$\{(\w+)\}/g, (_, k) => envVars[k] || process.env[k] || '');
  envVars[key] = val;
}

const dbUrl = envVars.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('📦 Pushing Prisma schema...');
console.log('   DB:', dbUrl.replace(/:([^:@]+)@/, ':***@'));

try {
  execSync(
    `node node_modules/prisma/dist/prisma.js db push --schema=packages/database/prisma/schema.prisma --accept-data-loss`,
    {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'inherit',
      cwd: __dirname,
    }
  );
  console.log('✅ Schema pushed successfully!');
} catch (e) {
  console.error('❌ Push failed:', e.message);
  process.exit(1);
}
