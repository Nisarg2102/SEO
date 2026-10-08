# Website audit — 9 October 2026

**Result: FAIL. The current workspace is not ready for a production release.**

The audit reviewed the project documents, traced frontend/backend workflows, ran the available checks, exercised every registered API route at least at the access/boundary level, and inspected every frontend page route. It found confirmed cross-workspace deletion, broken onboarding and persistence, incomplete integrations, and failing release checks.

This is a test and audit deliverable. Application source was not changed. The pre-existing GSC service modification and two deleted patch files were preserved.

## Scope and evidence

- 111 registered API routes; 336 HTTP probes across access, validation, CRUD, workflow, and integration cases. See [route-by-route coverage](API_COVERAGE.md).
- 22 workspace page variants at desktop and mobile sizes (44 scenarios), plus the four public routes, onboarding, medical banner, save controls, calendar mode, and a tablet registration check. 52 screenshots were captured and reviewed. See [frontend coverage](FRONTEND_COVERAGE.md).
- Real PostgreSQL 14 database, isolated at `127.0.0.1:55432/seo_audit`. Test users, workspaces, records, and mock OAuth connections exist only there.
- The main HTTP test server used `NODE_ENV=test`, so its AI and OAuth successes are **mock behavior**, not proof of live provider integration. Separate real Ollama and Google Autocomplete requests were tested.
- Next.js development server was used for browser inspection because the production build fails lint checks. Chrome was the browser tested; Safari/Firefox, exhaustive keyboard/screen-reader behavior, load testing, and all possible UI states are not certified.
- No deployment, live social publishing, production data modification, or real OAuth account connection was performed.

## Automated checks

| Check | Result | Evidence |
|---|---|---|
| Main API unit suite | 118 passed, 11 failed; 19 suites passed, 1 failed | `unit-tests.log` |
| Shared SSRF suite | 7 passed | `unit-tests.log` |
| Workspace test command | Fails; AI/database/analytics contain intentional “no test specified” scripts | `unit-tests.log` |
| API typecheck | Fails: GSC test expects `count`, current sync returns `{success}` | `typecheck.log` |
| Web/shared typecheck | Passed | `typecheck.log` |
| Lint / production web build | Fails on two explicit `any` errors and an unescaped apostrophe | `lint.log`, `build.log` |
| Backend build → production start | Build exits successfully but emits no `dist` directory; `start:prod` fails with MODULE_NOT_FOUND for `dist/main` | `api-build-repeat.log`, `api-production-start.log` |
| Existing API E2E tests | 5 passed, 1 failed: unauthorized route returns 500 rather than 401 | `e2e.log` |
| Previously unwired web API-client tests | 2 passed, 3 failed; stale expectations omit `/api` | `extra-tests-network.log` |
| Previously unwired crawler tests | 2 passed, 2 failed with DNS available | `extra-tests-network.log` |
| Compiled Ollama adapter tests | 14 passed; only compiled `.spec.js` exists in this checkout | `ollama-tests.log` |
| Dependency advisory scan | 69 vulnerable dependency entries: 2 critical, 45 high, 18 moderate, 4 low | `dependency-audit.json` |
| Schema initialization | Passed against an empty disposable database | `schema.log` |

The advisory totals include development and transitive dependencies and can count multiple affected packages for the same advisory. They are registry findings, not demonstrated exploits. The critical entries include Next.js and Handlebars. No automatic dependency upgrade was applied.

The initial 295-request harness had 232 status assertions: 21 passed and 211 failed; another 63 were observational. Most failures share one exception-handling problem. All 181 unauthenticated/nonmember probes were denied, but returned 500 instead of the expected 401/403. This must not be described as 181 authorization bypasses. The cross-workspace deletion below is a separate, confirmed bypass using a valid member of a different workspace.

## Confirmed security and data-integrity defects

### S1 — Critical: cross-workspace content deletion

A user who belongs to workspace B can call `DELETE /api/workspaces/B/content-packs/<A-record-id>` and delete workspace A's record. The response was HTTP 200 and included the deleted A record. Membership checks pass for B, but `ContentPacksService.remove()` deletes solely by content ID.

Source: [content-packs.service.ts:141](/Users/mac/Desktop/SEO/apps/api/src/content-packs/content-packs.service.ts:141). Reproduction: `cross tenant pack DELETE` in `api-results.json`. Fix by including both record ID and workspace ID in the lookup/delete and returning 404 for foreign records.

### S2 — High: VIEWER can mutate and delete

A VIEWER renamed workspace A (200) and deleted its source (204). `WorkspaceGuard` attaches the membership role but does not enforce it. Apply action-specific role checks to all mutable endpoints.

Source: [workspace.guard.ts:32](/Users/mac/Desktop/SEO/apps/api/src/auth/workspace.guard.ts:32). Evidence: `viewer edits workspace`, `viewer deletes source`.

### S3 — High: RSS collection bypasses SSRF protection

`ResearchService` passes source URLs directly to `rssParser.parseURL`. A controlled loopback RSS server was fetched twice, and its item was persisted. The same fixture also confirmed duplicate-item suppression on the second sync. No private system other than the audit fixture was contacted.

Source: [research.service.ts:154](/Users/mac/Desktop/SEO/apps/api/src/research/research.service.ts:154). Evidence: `RSS private network fetch` in `integration-results.json`. Use the shared safe-fetch path, validate redirect destinations, and parse fetched XML rather than letting the parser fetch arbitrary URLs.

### S4 — High: OAuth state is a workspace ID, not session-bound state

Both GSC and Instagram use the workspace ID directly as OAuth state. Public callbacks validate its UUID shape without authenticating ownership or verifying a one-time nonce. In test mode, an unauthenticated caller using a guessed workspace ID and fake code created a mock connection. That demonstrates missing state/session binding; it does not prove a successful real-provider code exchange with a fake code.

Sources: [gsc.service.ts:30](/Users/mac/Desktop/SEO/apps/api/src/gsc/gsc.service.ts:30), [instagram.service.ts:24](/Users/mac/Desktop/SEO/apps/api/src/instagram/instagram.service.ts:24). Production missing-credential branches also enable mock behavior. Use signed, expiring, one-use state bound to the initiating user/workspace; fail closed when provider configuration is absent.

### S5 — High: medical workflow can be bypassed

A record in `CLINICAL_REVIEW_REQUIRED` accepted `status: PUBLISHED` directly (200). Only selected transitions are checked, and status accepts arbitrary strings. This changes the database/UI status; no actual post was published. Separately, SEO Studio checks lowercase `medical`/`psychiatrist`, while workspace creation stores uppercase `MEDICAL`; a captured medical brief prompt omitted its medical safety instructions.

Sources: [content-packs.service.ts:112](/Users/mac/Desktop/SEO/apps/api/src/content-packs/content-packs.service.ts:112), [seo-studio.service.ts:72](/Users/mac/Desktop/SEO/apps/api/src/seo-studio/seo-studio.service.ts:72). Use an enumerated, complete transition matrix and consistent workspace-type handling, including Analytics and SEO Content.

### S6 — High: known JWT fallback remains

AuthModule returns a hardcoded secret when configuration is missing or shorter than 32 characters. JwtStrategy separately reads the environment or its fallback; a short nonempty secret can also make signing and verification disagree. This is a code-confirmed configuration defect, not an exploited production deployment.

Source: [auth.module.ts:11](/Users/mac/Desktop/SEO/apps/api/src/auth/auth.module.ts:11). Fail startup on invalid configuration and share the validated secret.

### S7 — High: OAuth token field names do not provide encryption

GSC writes raw `tokens.access_token` and `tokens.refresh_token` into fields named `*Encrypted`; Instagram also stores its access token directly. There is no encryption operation on these write paths. The singleton GSC OAuth client also has mutable credentials shared across requests, which requires a concurrency review.

Source: [gsc.service.ts:71](/Users/mac/Desktop/SEO/apps/api/src/gsc/gsc.service.ts:71). Storage-at-rest infrastructure was not inspected; the claim here is specifically absence of application-level token encryption promised in the documents.

### S8 — Medium: legacy n8n receiver fails open without configuration

When both the configured secret and request header are absent, `/webhooks/n8n`'s equality test succeeds. Direct controller execution returned `{success:true}`. This route only logs and acknowledges; the separate automation receiver correctly rejects absent configuration.

Source: [webhooks.controller.ts:13](/Users/mac/Desktop/SEO/apps/api/src/webhooks/webhooks.controller.ts:13). Require a configured secret before comparing.

## Functional and release blockers

| ID | Severity | Confirmed behavior and cause | Source/evidence |
|---|---|---|---|
| F1 | High | New accounts cannot create a workspace in the UI. Clicking Create Workspace changes no visible content and opens no form; modal state has no renderer. Anonymous `/` also lands on this empty screen without a sign-in path. | `browser-followup-results.json`; `WorkspaceContext.tsx`, `workspaces/page.tsx` |
| F2 | High | Brand Profile and Settings Save buttons issue no requests; values disappear after reload. Neither form loads existing data. | `browser-results.json`; `brand-profile/page.tsx:1`, `settings/page.tsx:1` |
| F3 | High | First brand save and content generation fail even with valid deterministic AI output. `withWorkspace()` adds unsupported `where` to Prisma `create()`. | `integration-results.json`; `prisma.service.ts:59` |
| F4 | High | Intended 400/401/403/404 responses become 500. App resolves Nest common 10.4.22, core resolves 10.4.15; the exception classes are different identities. | `nest-dependencies.log`, `Nest exception identity`, existing E2E failure |
| F5 | High | SEO Studio and SEO Content send literal `${params.workspaceId}` and `${id}` in URLs due to escaped interpolation. Some dynamic style classes are similarly literal. | `literal-interpolations.txt`; browser failed-request evidence |
| F6 | High | Link Intelligence has the same interpolation issue and uses `/seo/links/*` instead of registered `/seo/audits/links/*`. Requests return 404. | `seo-links/page.tsx:53`; browser evidence |
| F7 | High | AI Assistant crashes at desktop and mobile with `destroy is not a function`. Its effect returns `scrollIntoView()`; in the tested Chrome this returns a Promise, which React treats as cleanup. | `agent/page.tsx:22`; screenshots and follow-up return-type probe |
| F8 | High | Agent UI expects `conversationId` and conversation-history routes. AppModule mounts AiAgentModule, which returns `{role,content}`; AgentModule with history routes is not mounted. Replies will not render through the current success path even after the crash is fixed. | `app.module.ts`, both agent controllers, `agent/page.tsx`; history GET 404 |
| F9 | High | GSC sync stores new SearchConsole tables, while Analytics and integration summaries read old GscMetric/Integration tables. A successful mocked sync persisted 10 clicks yet Analytics returned `hasData:false`. | `integration-results.json`; `gsc.service.ts`, `analytics.service.ts`, `workspaces.service.ts` |
| F10 | High | Technical audit queue URL is literally `${baseUrlString}/api/...`. GSC/SEO queue defaults omit `/api`. With no QStash token, an audit is accepted and remains pending without execution. | Captured queue payloads in `integration-results.json`; `seo-audit.service.ts:39`, `gsc.controller.ts:67` |
| F11 | High | QStash guard reserializes parsed JSON. A valid locally signed whitespace-containing payload passed as raw text but failed after parsing; bootstrap does not preserve/use raw body. | `boundary-results.json`; `qstash.guard.ts:34` |
| F12 | High | Production web build and lint fail. Backend typecheck fails. Existing reports claiming green release checks are stale. | `build.log`, `lint.log`, `typecheck.log` |
| F13 | Medium | Scheduling only saves `SCHEDULED` and a date; the publishing integration was removed. There is no verified delivery path. | `content-packs.service.ts:132` |
| F14 | Medium | “SEO Audit” automation returns completed without creating an audit; “Performance Report” reads overview without creating a report; opportunity automation reads existing opportunities instead of running detection. Schedules are stored, not registered with an external scheduler by this code. | `automations.service.ts:110`; successful-run metadata in `api-results.json` |
| F15 | Medium | Exported n8n workflow is invalid JSON (`\$` escape, line 35), so cannot be imported as supplied. Its callback URL also lacks `/api`. | `boundary-results.json`; `sample-weekly-report.json` |
| F16 | Medium | Dashboard uses lowercase `draft`/`scheduled`, while workflow writes uppercase statuses. It showed zero scheduled posts with a scheduled fixture present. | `workspaces.service.ts:50`; `remaining-api-results.json` and dashboard screenshot |
| F17 | Medium | GSC aggregate CTR is an average of row percentages: fixture gives 5.5%, correct aggregate is 100/9100 = 1.10%. Average position is also unweighted. | `GSC weighted CTR fixture`; `gsc.service.ts:getPerformance` |
| F18 | Medium | Updating only a source's name changes `active:true` to false. Optional boolean transform converts undefined to false. URL normalization also lowercases case-sensitive path/query text. | Source create/update responses; `sources/dto.ts`, `sources.service.ts:11` |
| F19 | Medium | Legacy site-audit endpoint reports score 100 with an explicit “implementation pending” issue. Legacy keyword/rank services contain placeholders. A 2xx here does not mean real SEO analysis. | `remaining-api-results.json`; `local-crawler-seo.provider.ts` |
| F20 | Medium | At the crawl depth limit, link extraction is skipped along with traversal. A page with two links yields none at maxDepth 0. Error/evidence strings also contain escaped interpolation. | `extra-tests-network.log`; `technical-seo.provider.ts:296` |
| F21 | Medium | `/seo/audits/backlinks` is captured by earlier `:auditId` route, producing a Prisma invalid-UUID error instead of the intended unavailable-data response. | Member GET probe; `seo-audit.controller.ts:32` and `:70` |
| F22 | Medium | Zod `.parse()` errors are not mapped to 400. Several missing-resource and transition cases throw generic Error. These remain issues even after NestJS is deduplicated. | Invalid audit/brief/analysis/transition probes |
| F23 | Medium | Header hardening is absent: helmet is not installed; responses expose Express and lack expected security headers. No application auth-rate-limit implementation was found despite security documentation claims. | Bootstrap warning, health headers, `main.ts` |
| F24 | Medium | Medical calendar cannot select clinical-review states; list is generic. Month/week are explicitly under construction. Date input displays UTC text as local time. | `calendar/page.tsx`; clicked month mode and screenshot |
| F25 | Low | `/auth/me` returns JWT `userId,email,role`, whereas login returns `id,email,name,role`. Reload loses user display name and violates the declared frontend User shape. Cookie persists seven days but JWT expires after eight hours. | `auth.controller.ts:47`, `AuthContext.tsx`, `auth.module.ts` |
| F26 | High | Repeating the documented API build then `start:prod` produces no `dist` directory and fails to find `dist/main`. Incremental compilation combined with `deleteOutDir` needs investigation; the runtime audit used ts-node. | `api-build-repeat.log`, `api-production-start.log`, `tsconfig.json`, `nest-cli.json` |

## Frontend style and accessibility

Desktop pages mostly render readable light-theme layouts. Registration fits 390px and 768px viewports. The medical banner appears correctly. These visual successes do not imply working data flows.

- **Main navigation disappears below 1024px with no replacement menu.** All 22 mobile workspace page checks had zero visible navigation links.
- **Calendar clips its table on mobile.** Date/action columns extend beyond the viewport and the table wrapper hides overflow. See [mobile calendar](screenshots/mobile-calendar.png).
- Dashboard remains highlighted alongside the actual current section because prefix matching includes every workspace child route.
- Several major routes are absent from the nine-item sidebar; there is no complete navigation path exposed by that shell.
- Forms often have visible labels without `htmlFor`/input IDs or ARIA labels: nine on Brand Profile, eight on Content Detail, and several elsewhere. The user-menu icon also lacks an accessible name after session restoration/mobile hiding.
- Many errors are only logged or swallowed, allowing broken API calls to resemble empty data. SEO Links shows zeros despite failed requests.
- Global headings force dark text even inside colored areas; Geist fonts are loaded but the body specifies Arial. These are style consistency issues, not release blockers by themselves.
- Dynamic selected-state/outline classes in SEO Studio and SEO Content include escaped template expressions; generated spacing classes also need statically discoverable Tailwind mappings.

Screenshots and review contact sheets are in this folder. This review does not assert complete WCAG compliance or evaluate every focus/hover/disabled combination.

## Workflow and integration verdicts

| Workflow/integration | Verified | Verdict / remaining requirement |
|---|---|---|
| Register → login → cookie session | API and browser success; session reload checked | Works for valid credentials; error/status and user-shape defects remain |
| Create workspace → brand profile | API workspace creation succeeds | UI onboarding blocked; brand API create and both save forms broken |
| RSS → research → idea | Real local RSS fixture, AI fixture, real persistence, duplicate suppression, HTTP conversion | Core fixture path works; SSRF bypass and absent live queue delivery block release |
| Content pack → approval → schedule → publish | Seeded pack reads/updates/schedules | Generation persistence broken; status bypass; publishing absent |
| GSC → stored metrics → Analytics | Mock Google sync into real database | Stored metrics exist but dashboard reads different tables; real OAuth/data unverified |
| SEO audit → queue → crawl → links | Queue payload capture; real parser tests with fixture HTML | Queue URL broken; pending-job handling, depth-limit links, and UI routing broken |
| SEO brief → draft → edit → regeneration | Deterministic AI provider and real database; HTTP edit | Service-level fixture pipeline works; UI URLs broken; real long-form generation not certified |
| AI Assistant | HTTP mock response; browser and route checks | Browser crash and response/history contract mismatch |
| Local Ollama | Configured llama3.2 text response `READY`, structured `{status:"ready"}`, health; 14 adapter tests | Basic real adapter works; full long-form/tool-calling/embedding workload remains unverified |
| Google Autocomplete | Real live suggestions | Passed read-only smoke test |
| Google Trends | Endpoint calls returned no usable trend dataset | Not verified as working; fallback/empty behavior observed |
| Instagram | Status/disconnect, invalid-state handling, mock callback, source review | Real account OAuth/import not verified; configuration split across env files; no publishing implementation |
| QStash | Rejects unsigned calls, local signature contract, publish payload capture | No configured live delivery; body verification and callback URL defects |
| n8n | Secret guards, receiver behavior, workflow file parse, manual automation runs | Workflow JSON invalid; legacy receiver fail-open; automation actions incomplete |
| GA4 / YouTube / full backlinks / pgvector RAG | Documentation vs source inspection | Not implemented as advertised/end-to-end; backlink limitation partly explicit |

## Documentation and deployment drift

See [document inventory](DOCUMENT_INVENTORY.md). Several documents are historical and contradict one another or the code:

- Docker production instructions reference deleted Dockerfiles/compose files. BullMQ/Redis worker descriptions are obsolete; current code uses QStash.
- OpenAI/AI_API_KEY setup documents no longer describe the active Ollama-only production provider.
- Security documentation claims startup rejects missing JWT secrets, twelve-character complex passwords, helmet, rate limiting, and encrypted tokens. Current code does not meet those claims; password DTO minimum is six.
- GSC/SEO/n8n docs omit `/api` in several URLs and describe missing workers/endpoints.
- There are no checked-in Prisma migration files; schema push succeeded for the audit, but the documented `migrate deploy` workflow cannot establish a fresh schema from this checkout's migration history.
- Nginx strips `/api`, while NestJS now expects `/api`. The legacy nginx configuration is incompatible with the current API prefix.
- Root `npm run dev` runs workspace scripts sequentially: the long-running API dev process prevents reaching the web script. Start each app separately or use a concurrent runner.
- `apiClient` ignores a configured separate API host on any browser hostname other than exactly `localhost`. IP-based local access and split-domain deployment need explicit verification/fixing.

## Recommended repair order

1. Fix tenant deletion, role enforcement, RSS fetching, OAuth state, JWT configuration, and medical status/type handling.
2. Deduplicate NestJS dependencies; fix Prisma create scoping; restore green build/typecheck/lint and meaningful package test scripts.
3. Restore workspace creation and profile/settings persistence; fix Agent mounting/response handling and browser effect; correct all escaped URLs and route mismatches.
4. Complete the GSC data-model migration across Analytics, integration summaries, opportunity processing, and tests; correct metric aggregation.
5. Repair queue URLs/raw-body verification and pending/failure states; implement actual automation actions and choose/implement a publishing path.
6. Restore mobile navigation, calendar usability, associated form labels, and visible API error states.
7. Refresh setup/security/deployment docs, test clean installation and migrations, and rerun the same isolated regression checks.
8. Finally validate real GSC and Instagram OAuth, real QStash delivery, n8n import/scheduling, deployment routing/TLS, and approved social publishing with appropriate test accounts.

**Unverified external prerequisites:** no real Google OAuth connection, Instagram account import, live QStash delivery, n8n execution, or deployed Vercel/Neon environment was available for this audit. Those cannot truthfully be marked passed. All route coverage here is local, and some routes have access-rejection coverage only, as explicitly recorded in the matrix.
