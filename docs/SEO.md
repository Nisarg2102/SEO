# SEO & Opportunities Architecture

## Architecture Overview

The SEO system consists of two primary components:
1. **SEO Service Adapter** (`@ai-marketing/seo`): An adapter layer integrating with OpenSEO.
2. **SEO Opportunities Engine** (`SeoOpportunitiesService`): An analytical engine that evaluates search metrics and uses AI to generate actionable optimization recommendations.

## Provider Adapter Design (OpenSEO)

We implement the `SEOProvider` interface in `services/seo/src/openseo.adapter.ts`.
This ensures controllers and services communicate with an abstract interface rather than raw OpenSEO endpoints.

### Setup and Environment Variables
OpenSEO configuration is injected via environment variables:
- `OPENSEO_URL`: The base REST URL (e.g., `https://api.openseo.example.com`)
- `OPENSEO_API_KEY`: The bearer token for authentication.

**Note:** If `OPENSEO_API_KEY` is not provided (or in `NODE_ENV=test`), the adapter automatically runs in **Mock Mode**, returning synthetic realistic data for Keyword Research, Rank Tracking, and Site Audits. This prevents development blockers and ensures credentials are never hardcoded or leaked.

### Supported Operations
Currently, the adapter implements:
- `healthCheck()`: Validates endpoint reachability.
- `keywordResearch(query)`: Returns volume, difficulty, intent.
- `siteAudit(url)`: Returns an aggregate score, issues, and recommendations.
- `competitorResearch(domain)`: Keyword overlap.
- `rankTracking(domain, keywords)`: Current position and change metrics.

## Opportunity Engine Rules

The engine processes raw Google Search Console metrics (via background queue) to detect SEO opportunities. 

### Detection Rules
- **Rule 1: Low CTR / Page Optimization (`LOW_CTR`)**
  Identifies pages that rank reasonably well and get high impressions, but suffer from poor click-through rates.

### Configurable Thresholds
These rules are driven by configurable environment variables (with sensible defaults):
- `SEO_OPPORTUNITY_MIN_IMPRESSIONS` (Default: 1000)
- `SEO_OPPORTUNITY_MAX_CTR` (Default: 2.5)
- `SEO_OPPORTUNITY_MIN_POSITION` (Default: 1)
- `SEO_OPPORTUNITY_MAX_POSITION` (Default: 20)

### AI Assistance (No "Mystery Scores")
When an opportunity is detected, we do **not** assign an arbitrary "SEO Score". Instead, we pass the raw metrics (Impressions, Clicks, CTR, Position) to the AI service, which generates a structured response containing:
1. Explanation of the opportunity
2. Suggested Title optimization
3. Suggested Meta Description optimization
4. Content recommendations

*Crucially, the AI is explicitly instructed not to invent metrics.*

## Workspace Isolation and Background Processing

- **Queue System**: Metrics analysis is offloaded to BullMQ (`seo` queue) so that large GSC syncing does not block API requests. The controller immediately returns an HTTP 202 Accepted.
- **Isolation**: Every database query (`findMany`, `findFirst`, `create`) requires the `workspaceId`. The `sync-workspace` and `analyze-metrics` background jobs are bound to a specific workspace; cross-tenant data access is structurally impossible.

## Testing the SEO Feature Manually

1. **Start Infrastructure**: Run `docker-compose up -d redis postgres`.
2. **Start API/Web**: `npm run dev`.
3. **Check Health**: Navigate to `/workspaces/:id/seo` in the UI to see the Service Status (should report `OK`).
4. **Mock Research**: Use the Keyword Research tool with any keyword (e.g., `marketing`).
5. **Analyze Opportunities**: Navigate to `/workspaces/:id/seo-opportunities` and click **"Run GSC Analysis (Mock Data)"**.
6. **Wait for Processing**: You will see a "Queuing..." status. The job is dispatched to BullMQ. Within ~5 seconds, the UI will poll and reveal the newly generated AI recommendations.
7. **Convert**: Click "Convert to Idea" to turn the opportunity into an actionable Content Idea.
