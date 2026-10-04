# System Architecture

## Overview
A Next.js + NestJS monorepo for Zero-Cost AI SEO & Marketing orchestration.

## Flow of Control

1. **Frontend (Next.js)** -> Interacts securely via `apiClient.ts` (with `credentials: 'include'` for cookies).
2. **API (NestJS)** -> Handles routing, JWT Auth, and `workspaceId` extraction.
3. **Services** -> Contains business logic scoped to exactly 1 workspace at a time.
4. **Prisma (PostgreSQL)** -> Single source of truth.

## External Systems & Responsibilities
- **Application (NestJS + Prisma)**: Source of truth. Stores all data, history, and approval states.
- **Google Search Console**: Data source for true organic performance (Phase 1).
- **SEO Crawler**: Local lightweight fetcher bounded to prevent unbounded crawling (Phase 3).
- **AI Provider (Gemini/OpenAI)**: Abstraction handling structured generation and Agent loops.
- **Instagram**: Handles final scheduling and native publishing to X, LinkedIn, etc (Phase 7).
- **QStash**: Reliable application-level micro-execution queue. (Used for GSC retries, SEO queues, etc).
- **n8n**: High-level macro orchestration (e.g. "Run Weekly SEO workflow"). App receives a secure ping, handles the logic natively, and returns completion.
