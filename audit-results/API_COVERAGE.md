# API coverage — 9 October 2026

All paths have `/api` prefix. “Access” exercises authentication/membership rejection; it does not certify the business operation. Observed HTTP 500s often share the duplicated NestJS exception-class cause. Provider success is distinguished from fixture/mock success in the main report.

| Method | Route | HTTP observations | Authenticated/public operation exercised |
|---|---|---|---|
| GET | `/health` | 200 | health |
| GET | `/health/ai` | 200 | AI health mock |
| POST | `/auth/register` | 201, 500 | register A; register B; duplicate registration; invalid registration |
| POST | `/auth/login` | 200, 500 | bad login; valid login; login |
| POST | `/auth/logout` | 200 | logout |
| GET | `/auth/me` | 200 | session |
| POST | `/workspaces` | 201, 500 | create A; create B; create medical |
| GET | `/workspaces` | 500 | Access rejection only; valid business path not verified |
| GET | `/workspaces/:workspaceId` | 200, 500 | member GET /workspaces/:workspaceId |
| GET | `/workspaces/:workspaceId/stats` | 200, 500 | member GET /workspaces/:workspaceId/stats; workspace stats with scheduled fixture |
| PATCH | `/workspaces/:workspaceId` | 200, 500 | viewer edits workspace |
| GET | `/workspaces/:workspaceId/integrations` | 200, 500 | member GET /workspaces/:workspaceId/integrations; integrations view after GSC connect |
| GET | `/workspaces/:workspaceId/brand-profile` | 500 | member GET /workspaces/:workspaceId/brand-profile; brand read |
| PUT | `/workspaces/:workspaceId/brand-profile` | 500 | brand create |
| POST | `/ai/test` | 201, 500 | AI test |
| POST | `/workspaces/:workspaceId/content-packs/generate` | 500 | pack generation test-provider |
| GET | `/workspaces/:workspaceId/content-packs` | 200, 500 | member GET /workspaces/:workspaceId/content-packs |
| GET | `/workspaces/:workspaceId/content-packs/:id` | 200, 500 | member GET /workspaces/:workspaceId/content-packs/:id; pack read; cross tenant pack read |
| PUT | `/workspaces/:workspaceId/content-packs/:id` | 200, 500 | reject schedule draft; approve draft; schedule approved; medical reject direct approval; medical arbitrary published status |
| DELETE | `/workspaces/:workspaceId/content-packs/:id` | 200, 500 | cross tenant pack DELETE |
| POST | `/workspaces/:workspaceId/sources` | 201, 500 | source create; source duplicate; source invalid |
| GET | `/workspaces/:workspaceId/sources` | 200, 500 | member GET /workspaces/:workspaceId/sources |
| GET | `/workspaces/:workspaceId/sources/:id` | 500 | member GET /workspaces/:workspaceId/sources/:id; cross tenant source read |
| PUT | `/workspaces/:workspaceId/sources/:id` | 200, 500 | source update |
| DELETE | `/workspaces/:workspaceId/sources/:id` | 204, 500 | cross tenant source delete; viewer deletes source |
| GET | `/workspaces/:workspaceId/research` | 200, 500 | member GET /workspaces/:workspaceId/research |
| GET | `/workspaces/:workspaceId/research/:id` | 200, 500 | member GET /workspaces/:workspaceId/research/:id; research detail |
| POST | `/workspaces/:workspaceId/research/sync` | 500 | research queue missing configuration |
| POST | `/workspaces/:workspaceId/research/:id/convert` | 201, 500 | research convert |
| GET | `/seo/health` | 200 | SEO health |
| GET | `/seo/keywords` | 200, 500 | legacy seo keywords |
| POST | `/seo/audit` | 201, 500 | legacy audit SSRF |
| GET | `/seo/competitors` | 200, 500 | legacy competitors |
| POST | `/seo/rank` | 201, 500 | legacy rank |
| GET | `/workspaces/:workspaceId/seo-opportunities` | 200, 500 | member GET /workspaces/:workspaceId/seo-opportunities |
| POST | `/workspaces/:workspaceId/seo-opportunities/analyze` | 500 | SEO opportunity queue missing configuration |
| POST | `/workspaces/:workspaceId/seo-opportunities/:id/convert` | 500 | Access rejection only; valid business path not verified |
| GET | `/workspaces/:workspaceId/gsc/auth-url` | 200, 500 | member GET /workspaces/:workspaceId/gsc/auth-url |
| GET | `/workspaces/:workspaceId/gsc/status` | 200, 500 | member GET /workspaces/:workspaceId/gsc/status; GSC status after unauth callback |
| GET | `/workspaces/:workspaceId/gsc/properties` | 500 | member GET /workspaces/:workspaceId/gsc/properties |
| POST | `/workspaces/:workspaceId/gsc/connect-property` | 201, 500 | connect property |
| POST | `/workspaces/:workspaceId/gsc/sync` | 500 | GSC queue missing configuration |
| GET | `/workspaces/:workspaceId/gsc/history/keyword` | 200, 500 | member GET /workspaces/:workspaceId/gsc/history/keyword |
| GET | `/workspaces/:workspaceId/gsc/history/property` | 200, 500 | member GET /workspaces/:workspaceId/gsc/history/property |
| GET | `/workspaces/:workspaceId/gsc/performance` | 200, 500 | member GET /workspaces/:workspaceId/gsc/performance |
| GET | `/workspaces/:workspaceId/gsc/top-queries` | 200, 500 | member GET /workspaces/:workspaceId/gsc/top-queries |
| GET | `/workspaces/:workspaceId/gsc/top-pages` | 200, 500 | member GET /workspaces/:workspaceId/gsc/top-pages |
| GET | `/gsc/callback` | 302 | public GSC callback guessed state |
| POST | `/webhooks/n8n` | 500 | n8n missing secret |
| GET | `/workspaces/:workspaceId/analytics/overview` | 200, 500 | member GET /workspaces/:workspaceId/analytics/overview |
| GET | `/workspaces/:workspaceId/analytics/seo` | 200, 500 | member GET /workspaces/:workspaceId/analytics/seo |
| GET | `/workspaces/:workspaceId/analytics/keywords` | 200, 500 | member GET /workspaces/:workspaceId/analytics/keywords |
| GET | `/workspaces/:workspaceId/analytics/pages` | 200, 500 | member GET /workspaces/:workspaceId/analytics/pages |
| GET | `/workspaces/:workspaceId/analytics/opportunities` | 200, 500 | member GET /workspaces/:workspaceId/analytics/opportunities |
| GET | `/workspaces/:workspaceId/analytics/technical` | 200, 500 | member GET /workspaces/:workspaceId/analytics/technical |
| GET | `/workspaces/:workspaceId/analytics/links` | 200, 500 | member GET /workspaces/:workspaceId/analytics/links |
| GET | `/workspaces/:workspaceId/analytics/content` | 200, 500 | member GET /workspaces/:workspaceId/analytics/content |
| GET | `/workspaces/:workspaceId/analytics/social` | 200, 500 | member GET /workspaces/:workspaceId/analytics/social |
| POST | `/workspaces/:workspaceId/analytics/insights` | 201, 500 | analytics insights mock AI |
| GET | `/workspaces/:workspaceId/reports` | 200, 500 | member GET /workspaces/:workspaceId/reports |
| GET | `/workspaces/:workspaceId/reports/:id` | 200, 500 | member GET /workspaces/:workspaceId/reports/:id |
| POST | `/workspaces/:workspaceId/reports/generate` | 500 | generate report mock AI |
| POST | `/workspaces/:workspaceId/agent/chat` | 201, 500 | agent missing message; agent chat test-provider |
| POST | `/internal/automation/webhook` | 500 | automation missing secret |
| GET | `/workspaces/:workspaceId/automations` | 200, 500 | member GET /workspaces/:workspaceId/automations |
| POST | `/workspaces/:workspaceId/automations` | 201, 500 | automation seed |
| GET | `/workspaces/:workspaceId/automations/:automationId` | 200, 500 | member GET /workspaces/:workspaceId/automations/:automationId; automation detail |
| PATCH | `/workspaces/:workspaceId/automations/:automationId` | 200, 500 | automation disable |
| POST | `/workspaces/:workspaceId/automations/:automationId/run` | 201, 500 | automation run gsc-sync; automation run seo-audit; automation run performance-report; automation run opportunity-detection |
| GET | `/workspaces/:workspaceId/automations/:automationId/runs` | 200, 500 | member GET /workspaces/:workspaceId/automations/:automationId/runs; automation runs gsc-sync; automation runs seo-audit; automation runs performance-report; automation runs opportunity-detection |
| POST | `/internal/queues/analytics/sync-gsc` | 500 | queue no signature /internal/queues/analytics/sync-gsc |
| POST | `/internal/queues/research/sync-workspace` | 500 | queue no signature /internal/queues/research/sync-workspace |
| POST | `/internal/queues/research/sync-all` | 500 | queue no signature /internal/queues/research/sync-all |
| POST | `/internal/queues/seo/analyze-metrics` | 500 | queue no signature /internal/queues/seo/analyze-metrics |
| POST | `/internal/queues/analytics/sync-all-gsc` | 500 | queue no signature /internal/queues/analytics/sync-all-gsc |
| POST | `/internal/queues/seo/audit-run` | 500 | queue no signature /internal/queues/seo/audit-run |
| POST | `/workspaces/:workspaceId/seo/audits` | 201, 500 | audit invalid payload; create technical audit no queue |
| GET | `/workspaces/:workspaceId/seo/audits` | 200, 500 | member GET /workspaces/:workspaceId/seo/audits |
| GET | `/workspaces/:workspaceId/seo/audits/:auditId` | 500 | member GET /workspaces/:workspaceId/seo/audits/:auditId; member GET /workspaces/:workspaceId/seo/audits/backlinks |
| GET | `/workspaces/:workspaceId/seo/audits/links/summary` | 200, 500 | member GET /workspaces/:workspaceId/seo/audits/links/summary |
| GET | `/workspaces/:workspaceId/seo/audits/links/internal` | 200, 500 | member GET /workspaces/:workspaceId/seo/audits/links/internal |
| GET | `/workspaces/:workspaceId/seo/audits/links/external` | 200, 500 | member GET /workspaces/:workspaceId/seo/audits/links/external |
| GET | `/workspaces/:workspaceId/seo/audits/links/broken` | 200, 500 | member GET /workspaces/:workspaceId/seo/audits/links/broken |
| GET | `/workspaces/:workspaceId/seo/audits/links/orphans` | 200, 500 | member GET /workspaces/:workspaceId/seo/audits/links/orphans |
| GET | `/workspaces/:workspaceId/seo/audits/links/sitemap` | 200, 500 | member GET /workspaces/:workspaceId/seo/audits/links/sitemap |
| GET | `/workspaces/:workspaceId/seo/audits/backlinks` | 500 | member GET /workspaces/:workspaceId/seo/audits/backlinks |
| POST | `/workspaces/:workspaceId/seo/content/analyze` | 500 | analysis invalid payload; SEO content SSRF rejection |
| GET | `/workspaces/:workspaceId/seo/content/analyses` | 200, 500 | member GET /workspaces/:workspaceId/seo/content/analyses |
| GET | `/workspaces/:workspaceId/seo/content/analyses/:analysisId` | 500 | member GET /workspaces/:workspaceId/seo/content/analyses/:analysisId |
| POST | `/workspaces/:workspaceId/seo/content/analyses/:analysisId/reanalyze` | 500 | Access rejection only; valid business path not verified |
| POST | `/workspaces/:workspaceId/seo/content-briefs` | 201, 500 | brief invalid payload; create brief mock AI |
| GET | `/workspaces/:workspaceId/seo/content-briefs` | 200, 500 | member GET /workspaces/:workspaceId/seo/content-briefs |
| GET | `/workspaces/:workspaceId/seo/content-briefs/:briefId` | 200, 500 | member GET /workspaces/:workspaceId/seo/content-briefs/:briefId; brief detail |
| POST | `/workspaces/:workspaceId/seo/content-briefs/:briefId/generate-draft` | 500 | generate draft mock AI |
| GET | `/workspaces/:workspaceId/seo/content-briefs/:briefId/drafts` | 200, 500 | member GET /workspaces/:workspaceId/seo/content-briefs/:briefId/drafts; brief drafts |
| GET | `/workspaces/:workspaceId/seo/content-drafts/:draftId` | 200, 500 | member GET /workspaces/:workspaceId/seo/content-drafts/:draftId; draft detail |
| PATCH | `/workspaces/:workspaceId/seo/content-drafts/:draftId` | 200, 500 | draft update |
| POST | `/workspaces/:workspaceId/seo/content-drafts/:draftId/regenerate-section` | 201, 500 | draft regenerate snippet |
| GET | `/workspaces/:workspaceId/social/instagram/auth-url` | 500 | member GET /workspaces/:workspaceId/social/instagram/auth-url |
| GET | `/workspaces/:workspaceId/social/instagram/status` | 200, 500 | member GET /workspaces/:workspaceId/social/instagram/status |
| POST | `/workspaces/:workspaceId/social/instagram/sync` | 500 | Instagram disconnected sync |
| GET | `/workspaces/:workspaceId/social/instagram/top-content` | 200, 500 | member GET /workspaces/:workspaceId/social/instagram/top-content |
| GET | `/workspaces/:workspaceId/social/instagram/insights` | 200, 500 | member GET /workspaces/:workspaceId/social/instagram/insights |
| POST | `/workspaces/:workspaceId/social/instagram/analyze` | 500 | Instagram empty analyze |
| POST | `/workspaces/:workspaceId/social/instagram/disconnect` | 201, 500 | Instagram disconnect |
| GET | `/*instagram/callback` | 302 | Instagram callback; Instagram callback; Instagram callback |
| GET | `/workspaces/:workspaceId/keyword-research` | 200, 500 | member GET /workspaces/:workspaceId/keyword-research; live keyword provider  |
| GET | `/workspaces/:workspaceId/keyword-research/suggestions` | 200, 500 | member GET /workspaces/:workspaceId/keyword-research/suggestions; live keyword provider /suggestions |
| GET | `/workspaces/:workspaceId/keyword-research/trends` | 200, 500 | member GET /workspaces/:workspaceId/keyword-research/trends; live keyword provider /trends |
| GET | `/workspaces/:workspaceId/keyword-research/related` | 200, 500 | member GET /workspaces/:workspaceId/keyword-research/related; live keyword provider /related |
| GET | `/workspaces/:workspaceId/keyword-research/compare` | 200, 500 | member GET /workspaces/:workspaceId/keyword-research/compare; live keyword provider /compare |
