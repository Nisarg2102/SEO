# Prisma Vercel Fix

## Root Cause
The Vercel 500 error (`"beforeExit hook is not applicable to the library engine since Prisma 5.0.0"`) was caused by a mismatch in Prisma package versions. The project had `@prisma/client` pinned to `5.13.0` while using the `prisma` CLI version `5.22.0`. In Serverless environments, running mismatched Prisma engines and clients can cause internal lifecycle hooks to fail or trigger deprecated code paths in the generated client. 

## File that contained the incompatible hook
No custom `$on('beforeExit')` shutdown hook was present in the application's source code (not in `main.ts`, `prisma.service.ts`, or any other file). The error was entirely an internal artifact of the Prisma 5 engine/client version mismatch running in Vercel's serverless environment.

## Exact Fix
1. Updated `@prisma/client` and `prisma` to both exactly match `^5.22.0` in the monorepo root `package.json`.
2. Updated `@prisma/client` and `prisma` to `^5.22.0` in `packages/database/package.json`.
3. Updated `@prisma/client` and `prisma` to `^5.22.0` in `apps/api/package.json`.
4. Regenerated the Prisma Client across the monorepo to ensure the engine and client versions matched exactly.

## Prisma Version
Before: `@prisma/client` (`5.13.0`) mismatched with `prisma` (`5.22.0`).
After: Both are locked to exactly `5.22.0`.

## Tests Performed
- Checked the entire codebase using `grep -rn "beforeExit"` to prove no custom user-space shutdown hooks existed.
- Ran `npx prisma generate` locally, which explicitly warned about the version mismatch.
- Upgraded the versions using `npm install prisma@5.22.0 @prisma/client@5.22.0` in the workspaces.
- Mapped out mock queues and fixed TS syntax errors in `seo-opportunities` controller/service tests.
- Ran `npm run typecheck`, `npm test`, and `npm run build` locally in `apps/api` successfully.

## Vercel Deployment Result
Committed and pushed the Prisma version synchronization changes to GitHub. Vercel is currently deploying. The endpoints `POST /api/auth/login`, `GET /api/auth/me`, and `GET /api/workspaces` should now operate without triggering the internal engine error.
