# Vercel Migration Plan

This document outlines the step-by-step phased approach for migrating the current Docker-based AI SEO Assistant to Vercel, Neon, and Upstash.

## PHASE 1: Repository / Vercel Preparation (✅ COMPLETED)
- **Objective:** Configure the monorepo structure to deploy successfully on Vercel.
- **Action:** 
  1. Add a `vercel.json` to the root for proxy routing.
  2. Install `@vendia/serverless-express` in `apps/api`.
  3. Create `apps/api/src/serverless.ts` wrapper file for NestJS.

## PHASE 2: Neon PostgreSQL
- **Objective:** Move the database off Docker.
- **Action:** 
  1. Create a Neon project.
  2. Enable the `pgvector` extension in the Neon dashboard.
  3. Obtain the pooled (`DATABASE_URL`) and unpooled (`DIRECT_URL`) connection strings.
  4. Update `schema.prisma` to support `directUrl = env("DIRECT_URL")`.

## PHASE 3: Upstash Redis
- **Objective:** Migrate from local Redis container to managed Upstash cache.
- **Action:**
  1. Create an Upstash Redis database.
  2. Retrieve the `REDIS_URL` / `UPSTASH_REDIS_REST_URL`.
  3. Update standard caching logic (if any) to point to the Upstash instance.

## PHASE 4: Background Jobs / Upstash QStash
- **Objective:** Remove the Vercel-incompatible BullMQ dependency.
- **Action:**
  1. Uninstall `@nestjs/bullmq` and `bullmq` from `apps/api/package.json`.
  2. Install `@upstash/qstash`.
  3. Refactor `AnalyticsProcessor`, `WebhooksProcessor`, `ResearchProcessor`, and `SeoProcessor` into standard NestJS Controllers (e.g. `QueuesController`).
  4. Replace all `.add(...)` queue calls with `qstash.publishJSON(...)`.
  5. Add QStash signature verification guards to the new queue endpoints.

## PHASE 5: Backend/API Compatibility
- **Objective:** Ensure all long-running routes are optimized.
- **Action:** 
  1. Set `maxDuration: 60` (or higher) in Vercel config for AI-heavy routes like `/content-packs` and `/reports` to prevent 504 timeouts.
  2. Ensure CORS is correctly configured in `main.ts` to accept the Vercel production domain.

## PHASE 6: Environment Variables
- **Objective:** Safely provision all secrets.
- **Action:** Input all variables from `VERCEL_ENVIRONMENT_VARIABLES.md` into the Vercel Project Settings dashboard.

## PHASE 7: Vercel Deployment
- **Objective:** Initial infrastructure launch.
- **Action:** 
  1. Import the GitHub repository into Vercel.
  2. Override the Root Directory if necessary, or let Vercel auto-detect the monorepo framework (Next.js).
  3. Trigger the initial build and verify that the `serverless.ts` NestJS function compiles successfully alongside Next.js.

## PHASE 8: Domain Configuration
- **Objective:** Assign the production URL.
- **Action:** 
  1. Add `app.yourdomain.com` in Vercel Settings -> Domains.
  2. Update `FRONTEND_URL` and CORS configurations in Vercel environment variables to match.

## PHASE 9: Authentication & OAuth
- **Objective:** Ensure JWTs and Google Login work.
- **Action:** 
  1. Set production `JWT_SECRET`.
  2. Update Google Cloud Console with the new Vercel OAuth Callback URL (e.g., `https://app.yourdomain.com/api/auth/google/callback`).

## PHASE 10: AI Integrations
- **Objective:** Verify AI responses.
- **Action:** Configure `AI_API_KEY` and test synchronous text generation routes to ensure they complete within Vercel's `maxDuration` window.

## PHASE 11: Research & OpenSEO & Postiz & n8n
- **Objective:** Connect external platforms.
- **Action:** Add API keys and verify outbound network requests succeed from the Vercel edge/serverless environment.

## PHASE 12: Full Integration Testing
- **Objective:** End-to-end verification.
- **Action:** Execute a complete core flow (Login -> Workspace -> Research -> Content Idea -> Generate Pack -> Schedule) on the live Vercel domain to confirm all replaced components (Neon, QStash) function together smoothly.
