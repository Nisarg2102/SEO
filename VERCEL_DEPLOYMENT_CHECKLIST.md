# Vercel Deployment Checklist

Use this checklist during the actual Vercel deployment to ensure all manual prerequisites and architectural constraints have been addressed.

## 1. Third-Party Infrastructure Setup
- [ ] **Neon DB:** Created a Neon PostgreSQL instance.
- [ ] **Neon DB:** Executed `CREATE EXTENSION IF NOT EXISTS vector;` in the Neon SQL Editor.
- [ ] **Upstash QStash:** Account created and tokens obtained.
- [ ] **Upstash Redis:** (Optional) Provisioned if application level caching is built out.

## 2. Codebase Refactoring (The NestJS API)
- [ ] **Serverless Wrapper:** Added `@vendia/serverless-express` to `apps/api`.
- [ ] **Entrypoint:** Created `apps/api/src/serverless.ts` wrapper.
- [ ] **Vercel Config:** Added `vercel.json` to the repository root mapping `/api/*` to the serverless entrypoint.
- [ ] **BullMQ Removed:** Removed `@nestjs/bullmq` and deleted the `QueuesModule`.
- [ ] **QStash Implemented:** Replaced all queue additions with Upstash QStash HTTP publishing.
- [ ] **Processors Converted:** Converted all `*Processor` files into standard NestJS Controllers.
- [ ] **Signature Guards:** Added `@upstash/qstash` signature verification to the new processor controllers.

## 3. Database Migration
- [ ] **Prisma Driver:** Updated `schema.prisma` to use pooled URLs (`DATABASE_URL`) and direct URLs (`DIRECT_URL`).
- [ ] **Local Migration Run:** Ran `npx prisma db push` locally using the Neon connection strings to establish the production schema. *(Do NOT run `migrate reset` or use local dev seeds)*.

## 4. Vercel Configuration
- [ ] **Repository Import:** Connected Vercel to the GitHub repository (`https://github.com/Nisarg2102/SEO`).
- [ ] **Framework Preset:** Verified Vercel detected `Next.js`.
- [ ] **Environment Variables:** All variables from `VERCEL_ENVIRONMENT_VARIABLES.md` are populated in the Vercel dashboard.
- [ ] **Max Duration Limit:** Explicitly configured Vercel function timeout (`maxDuration`) for AI processing routes (Requires Vercel Pro).

## 5. Domain & Security Verification
- [ ] **Domain Assigned:** Custom domain assigned in Vercel.
- [ ] **CORS Verification:** `FRONTEND_URL` exactly matches the Vercel domain, and NestJS CORS is configured strictly.
- [ ] **OAuth Update:** Google Cloud Console Authorized Redirect URIs are updated to use the Vercel production domain.

## 6. Final Smoke Test
- [ ] **Authentication:** Login via Google OAuth completes.
- [ ] **Session Check:** `httpOnly` secure cookies are attached correctly across the Vercel Proxy.
- [ ] **Data Check:** Creating a workspace successfully writes to Neon DB.
- [ ] **Background Check:** Triggering a QStash job properly executes the respective NestJS route.
- [ ] **AI Execution:** Requesting an AI Content Pack does not timeout and correctly returns structured data.
