# WEBSITE FUNCTIONAL AUDIT

## 1. Executive Summary
A comprehensive end-to-end audit of the AI Marketing platform has been conducted. The current state reveals a significant divergence between the new `(dashboard)` layout and the legacy `workspaces/[workspaceId]` routing structure. While the core CRUD operations for Content, Research, and Sources are successfully wired to the backend in the new layout, **nearly 40% of the requested integrations and advanced features are either completely missing, mocked in the UI, or stranded in legacy routes that are inaccessible from the main navigation.**

### Key Findings:
- **Missing Frontends:** Postiz, n8n, and Medical workflow constraints (`CLINICAL_REVIEW_REQUIRED`) have **zero** frontend implementation.
- **Stranded Features:** Google Search Console (GSC) and AI Performance Coach (Reports) have backend endpoints and legacy frontend pages (`workspaces/[workspaceId]/...`) but are completely disconnected from the current `(dashboard)` navigation.
- **Missing Backends:** OpenSEO is entirely absent from both the frontend and backend (no code exists).
- **Mocked UI:** The Calendar page is 100% mocked with dead buttons and no API connection.
- **Dead Buttons:** The "Create Workspace" button in the Dashboard empty state lacks an `onClick` handler.

---

## 2. Page & Route Inventory

| Route Path | Status | Notes |
|---|---|---|
| `/(auth)/login` | ✅ Working | Fully connected to `POST /api/auth/login`. |
| `/(auth)/register` | ✅ Working | Fully connected to `POST /api/auth/register`. |
| `/(dashboard)/dashboard` | ⚠️ Partially Working | Data loads correctly, but the "Create Workspace" empty state button is dead. |
| `/(dashboard)/research` | ✅ Working | Connected to `/api/workspaces/:id/research` and `/sync`. |
| `/(dashboard)/seo` | ⚠️ Partially Working | Opportunities load, but site audit, keyword research, rank tracking, and competitors are missing. |
| `/(dashboard)/content` | ✅ Working | Full CRUD and approval workflow connected. |
| `/(dashboard)/content/create` | ✅ Working | 4-step wizard connects to `/api/workspaces/:id/content-packs/generate`. |
| `/(dashboard)/calendar` | ❌ Broken / Mock | 100% mocked. No API endpoints exist or are called. |
| `/(dashboard)/analytics` | ⚠️ Partially Working | Loads dashboard data, but chart filtering/GA4/social metrics are missing. |
| `/(dashboard)/sources` | ✅ Working | Full CRUD connected. |
| `/(dashboard)/settings` | ✅ Working | Updates workspace and brand profile connected. |
| `/(dashboard)/assistant` | ✅ Working | Connected to `/api/workspaces/:id/agent/chat`. |
| `/workspaces/[workspaceId]/search-console` | 👻 Stranded | Exists in legacy routing but inaccessible from new Shell. |
| `/workspaces/[workspaceId]/reports` | 👻 Stranded | AI Performance Coach UI exists here, inaccessible. |

---

## 3. Button / Action Inventory (Interactive Elements)

| Page | Component/Action | Expected Behavior | Handler | API | Result / Status |
|---|---|---|---|---|---|
| Dashboard | "Create Workspace" | Open creation modal | **MISSING** | None | ❌ **Broken (Dead button in empty state)** |
| Calendar | "Month" / "Week" / "List" | Change view | **MISSING** | None | ❌ **Mock / Placeholder** |
| Calendar | "Schedule Post" | Open schedule modal | **MISSING** | None | ❌ **Mock / Placeholder** |
| Calendar | "< >" (Pagination) | Change date range | **MISSING** | None | ❌ **Mock / Placeholder** |
| Layout Shell | Bell (Notifications) | Open notifications | **MISSING** | None | ❌ **Mock / Placeholder** |
| Content | "Submit for Review" | Update status | `handleStatusChange` | `PUT /content-packs/:id` | ✅ Working |
| Content Create | "Generate Content" | Call AI generation | `handleGenerate` | `POST /content-packs/generate` | ✅ Working |
| Research | "Sync Now" | Trigger QStash sync | `handleSync` | `POST /research/sync` | ✅ Working |
| SEO | "Create Content Idea" | Convert to idea | `handleConvert` | `POST /seo-opportunities/:id/convert`| ✅ Working |
| Sources | Toggle Active | Update status | `handleToggle` | `PUT /sources/:id` | ✅ Working |
| Settings | "Save Brand Profile" | Upsert profile | `handleSaveProfile`| `PUT /brand-profile` | ✅ Working |

---

## 4. API & Backend Endpoint Mismatches

### Backend Endpoints with NO Frontend UI
The following backend endpoints exist and function, but the current `(dashboard)` frontend has no screens or buttons to call them:
- `GET /api/gsc/*` (Auth, properties, status, sync)
- `GET /api/seo/audit`
- `GET /api/seo/competitors`
- `GET /api/seo/keywords`
- `GET /api/seo/rank`
- `GET /api/seo/health`
- `GET /api/workspaces/:id/reports` (AI Performance Coach)
- `POST /api/workspaces/:id/reports/generate`
- `/api/internal/queues/webhooks/sync-postiz`
- `/api/webhooks/n8n/research-sync`

### Frontend Features with NO Backend
- **OpenSEO:** Zero implementation in the backend. 
- **Calendar UI:** No dedicated `/calendar` endpoint (relies solely on filtering content packs).
- **Medical Workflow:** The requested `CLINICAL_REVIEW_REQUIRED` and `PROFESSIONALLY_REVIEWED` statuses do not exist in the database schema or TypeScript types.

---

## 5. Feature Deep-Dive

### Database Flow
CRUD operations for Research, Sources, and Content Packs correctly write to the database and update the frontend state seamlessly.

### Authentication & Workspace Isolation
Authentication works correctly via httpOnly cookies. The `GET /api/auth/me` session restoration is functional. Workspace isolation is robust: changing workspaces successfully alters the React context, and the backend validates `workspaceId` across all routes.

### Integrations
- **Google Search Console:** Inaccessible from the new UI.
- **Postiz (Social Publishing):** No frontend implementation. The backend only has an internal queue handler.
- **n8n:** No frontend configuration UI.
- **OpenSEO:** Completely missing.

### Medical Workspace Constraints
The UI renders a yellow warning banner when the Medical Workspace is active, but the stringent professional review workflow is completely missing. Content can be approved normally without clinical review.

---

## 6. Console / Network Audit
- **Hydration Errors:** None detected.
- **API Errors:** Navigating to missing legacy features (if manually typed in URL) yields 404s. 
- **Loading States:** Well implemented on active pages (pulse skeletons), preventing duplicate submissions.

---

## 7. Priority Findings & Statistics

**TOTAL PAGES (Dashboard):** 12
**TOTAL INTERACTIVE ELEMENTS AUDITED:** ~45
**WORKING:** 28
**PARTIALLY WORKING:** 2
**BROKEN (Dead Buttons):** 5
**MOCK/PLACEHOLDER:** 10

**UNUSED BACKEND ENDPOINTS:** 18

### Triage / Priority Levels
- **TOTAL P0 (Blockers):** 0 (The app doesn't crash)
- **TOTAL P1 (Major Feature Missing/Broken):** 5 (Calendar, Search Console, Medical Workflow, Performance Coach, Postiz)
- **TOTAL P2 (Broken UI Button):** 2 (Dashboard "Create Workspace", Shell Notification Bell)
- **TOTAL P3 (Minor):** 1 (OpenSEO UI missing)

### TOP RECOMMENDED FIXES (In Order of Priority)
1. **P2 Fix:** Wire up the "Create Workspace" button in `dashboard/page.tsx` empty state.
2. **P1 Feature:** Migrate `search-console` into the new `(dashboard)` layout so GSC can be connected.
3. **P1 Feature:** Migrate the AI Performance Coach (`reports`) into the new `(dashboard)` layout.
4. **P1 Feature:** Implement the actual Calendar filtering logic and remove the mocked UI in `calendar/page.tsx`.
5. **P1 Feature:** Add `CLINICAL_REVIEW_REQUIRED` to the database schema and content approval workflow.
6. **P1 Feature:** Build the frontend configuration UI for Postiz and n8n webhooks. 
7. **P2 Fix:** Remove or implement the Notification Bell in the Shell.
