# Vercel Architecture Plan

This document outlines the target Vercel-first architecture for the AI Marketing & SEO Assistant, replacing the current Docker-based, long-running processes with managed serverless infrastructure.

## 1. Target Architecture Overview

```text
Vercel (Serverless)
│
├── Frontend Application (Next.js)
│   ├── User Interface (React/Tailwind)
│   ├── Vercel Edge Cache (for static assets)
│   └── Next.js Middleware (basic routing)
│
└── Backend API (NestJS Serverless)
    ├── Auth & Users
    ├── AI Content & Reports
    ├── Workspaces
    ├── SEO & Analytics integrations
    └── QStash Webhook Receivers (replacing BullMQ workers)

Neon (Serverless Database)
│
└── PostgreSQL + pgvector
    ├── Connection Pooling (Neon built-in)
    └── Persistent State

Upstash (Serverless Cache & Queues)
│
├── Upstash Redis (Session/Cache)
└── Upstash QStash (Background Jobs / Workflows)

External Integrations
│
├── Google Search Console (OAuth & Analytics)
├── Postiz (Social Publishing)
├── Free SEO Tools (SEO metrics)
└── n8n (External Workflow Automation)
```

## 2. Component Compatibility & Replacements

| Component | Current Implementation | Vercel Compatible? | Required Change | Replacement |
|---|---|---|---|---|
| **Frontend** | Next.js (`apps/web`) | ✅ Yes | None | Vercel Next.js Deployment |
| **Backend** | NestJS Node Server (`apps/api`) | ⚠️ Partially | Wrap in Serverless Express | `@vendia/serverless-express` + `vercel.json` |
| **Database** | Dockerized PostgreSQL | ❌ No | Update Prisma connection URL | Neon PostgreSQL Serverless |
| **Vectors** | `pgvector` in local DB | ❌ No | Enable `pgvector` extension | Neon `pgvector` |
| **Cache** | Dockerized Redis | ❌ No | Update Redis connection URL | Upstash Redis |
| **Queues** | BullMQ (`@nestjs/bullmq`) | ❌ No | Replace BullMQ pushes with HTTP calls | Upstash QStash |
| **Workers** | BullMQ Processors (Long-running) | ❌ No | Convert processors to HTTP POST routes | NestJS Controllers + QStash signatures |
| **Cron Jobs** | BullMQ Repeatable Jobs | ❌ No | Use Vercel Cron or QStash Schedules | Vercel Cron / QStash |

## 3. Important Vercel Constraints to Address

1. **No Long-Running Processes:** Vercel functions terminate after the HTTP request ends. BullMQ workers require an active event loop continuously polling Redis. BullMQ must be entirely removed.
2. **Cold Starts:** NestJS has a heavy initialization cost. Booting the entire DI container on every cold start can add 1-3 seconds to request latency.
3. **Execution Limits:** Vercel Hobby limits functions to 10 seconds. Pro limits to 15s (configurable up to 300s). AI generation routes (`AiReportsService`, `ContentPacksService`) currently execute synchronously and take 15-30s. These will hit timeouts on Hobby, and require explicit `maxDuration` configuration on Pro.
4. **Filesystem:** Vercel's local filesystem is ephemeral and read-only.
5. **Connection Pooling:** Serverless functions create hundreds of simultaneous connections during traffic spikes, easily overwhelming standard PostgreSQL. Prisma must connect via Neon's connection pooler URL (usually `postgres://...-pooler.neon.tech`).

## 4. The NestJS Decision

**Current State:** 17 controllers, deeply nested DI, heavily relying on `@nestjs/bullmq`.

**Options:**
- **A. Vercel Serverless Function (Recommended):** Wrap `apps/api` using `@vendia/serverless-express`. Expose it via a `vercel.json` config handling all `/api/*` routes.
  - *Advantages:* Requires almost zero business logic rewrites. Preserves Prisma structure and Auth Guards.
  - *Disadvantages:* Noticeable cold starts; requires replacing BullMQ manually with HTTP endpoints.
- **B. Move to Next.js API Routes:** Rewrite all 17 NestJS controllers into `apps/web/src/app/api/...` route handlers.
  - *Advantages:* Native Vercel integration, edge compatibility.
  - *Disadvantages:* Massive rewrite (months of effort). Loss of NestJS decorators and DI.
- **C. Separate Hosted Backend (e.g., Render/Railway):**
  - *Advantages:* Zero code changes required. BullMQ and long-running workers work perfectly out of the box.
  - *Disadvantages:* Violates your requirement of "Vercel as the primary hosting platform".

**Recommendation:** Proceed with **Option A**. Wrap the NestJS app in Serverless Express for Vercel, allowing us to keep the codebase intact while fulfilling the serverless requirement. 

## 5. BullMQ / Redis Replacement Strategy

BullMQ is fundamentally incompatible with Vercel because it requires a persistent worker loop. 

**Current BullMQ Usage:**
- `ANALYTICS_QUEUE` (`AnalyticsProcessor`)
- `WEBHOOKS_QUEUE` (`WebhooksProcessor`)
- `RESEARCH_QUEUE` (`ResearchProcessor`)
- `SEO_QUEUE` (`SeoProcessor`)

**Target Strategy (Upstash QStash):**
1. When the API previously called `queue.add('sync', data)`, it will now call `qstash.publishJSON({ url: 'https://api.yourdomain.com/internal/queues/sync', body: data })`.
2. The `*Processor.ts` files will be converted into standard NestJS Controllers (e.g., `@Post('internal/queues/sync')`).
3. These routes will be protected by `@upstash/qstash` signature verification to ensure only QStash can trigger them.
4. **Idempotency & Retries:** QStash automatically handles retries (up to 3 times) and exponential backoff, perfectly mirroring the current BullMQ configuration.

## 6. Database (Neon PostgreSQL)

**Required Changes:**
- **Migration:** Run `npx prisma db push` or `npx prisma migrate deploy` locally pointing to the Neon database URL. *Never* run `migrate reset`.
- **URL Configuration:** Set `DATABASE_URL` in Vercel to the pooled Neon connection string (e.g., `postgresql://user:pass@ep-host-pooler.region.aws.neon.tech/neondb?pgbouncer=true&connect_timeout=15`).
- **Direct URL:** Set `DIRECT_URL` in Vercel (unpooled) specifically for Prisma migrations.
- **pgvector:** Run `CREATE EXTENSION IF NOT EXISTS vector;` manually in the Neon SQL editor before running Prisma migrations.

## 7. Security Architecture

- **CORS:** NestJS CORS must be configured to strictly accept the Next.js frontend production URL.
- **Cookies:** `httpOnly`, `Secure`, and `SameSite=Lax` will function correctly, provided both Next.js and NestJS share the same root domain or are properly proxied.
- **Webhook Security:** QStash receivers will strictly validate the `Upstash-Signature` header.
- **Secrets:** All secrets (JWT, OAuth) will be stored strictly in Vercel Environment Variables, never committed to git.
