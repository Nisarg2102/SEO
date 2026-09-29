# Frontend ↔ Backend Integration Report

## API Endpoint Map

| Feature | API Endpoint | Connected? | Real Data? | Notes |
|---|---|---|---|---|
| **Auth: Login** | `POST /auth/login` | ✅ | ✅ | httpOnly cookie set by backend; no token stored in JS |
| **Auth: Register** | `POST /auth/register` | ✅ | ✅ | 409 conflict handled for duplicate emails |
| **Auth: Logout** | `POST /auth/logout` | ✅ | ✅ | Cookie cleared server-side; user state cleared client-side |
| **Auth: Session restore** | `GET /auth/me` | ✅ | ✅ | **New endpoint added to backend**. Allows frontend to restore session on page load from httpOnly cookie |
| **Workspace: List** | `GET /workspaces` | ✅ | ✅ | Loads all workspaces for user; persists active selection |
| **Workspace: Create** | `POST /workspaces` | ✅ | ✅ | Inline creation form in workspace switcher dropdown |
| **Workspace: Update** | `PATCH /workspaces/:id` | ✅ | ✅ | Name editable in Settings |
| **Workspace: Stats** | `GET /workspaces/:id/stats` | ✅ | ✅ | Drives Dashboard stat cards (ideas, drafts, approvals, scheduled) |
| **Brand Profile: Get** | `GET /workspaces/:id/brand-profile` | ✅ | ✅ | Loaded into Settings form; handles 404 (no profile yet) |
| **Brand Profile: Upsert** | `PUT /workspaces/:id/brand-profile` | ✅ | ✅ | Save button in Settings creates or updates profile |
| **Research: List** | `GET /workspaces/:id/research` | ✅ | ✅ | Full research discovery page with filters |
| **Research: Sync** | `POST /workspaces/:id/research/sync` | ✅ | ✅ | "Sync Now" button queues via QStash; shows job message |
| **Research: Convert to Idea** | `POST /workspaces/:id/research/:id/convert` | ✅ | ✅ | Triggered on "Create Content" button on research item |
| **SEO: List Opportunities** | `GET /workspaces/:id/seo-opportunities` | ✅ | ✅ | Aggregate stats + opportunity cards with priority badges |
| **SEO: Convert to Idea** | `POST /workspaces/:id/seo-opportunities/:id/convert` | ✅ | ✅ | "Create Content Idea" button on each opportunity card |
| **Content: List** | `GET /workspaces/:id/content-packs` | ✅ | ✅ | Content Library table with search + status filter |
| **Content: Generate** | `POST /workspaces/:id/content-packs/generate` | ✅ | ✅ | 4-step wizard calls real AI generation |
| **Content: Update** | `PUT /workspaces/:id/content-packs/:id` | ✅ | ✅ | Status workflow (draft→review→approved→scheduled) + Save Draft |
| **Content: Delete** | `DELETE /workspaces/:id/content-packs/:id` | ✅ | ✅ | Delete action in content table row menu |
| **Analytics: Dashboard** | `GET /workspaces/:id/analytics` | ✅ | ✅ | Renders real metrics if present; shows empty state if not configured |
| **Sources: List** | `GET /workspaces/:id/sources` | ✅ | ✅ | Sources table with status indicators |
| **Sources: Create** | `POST /workspaces/:id/sources` | ✅ | ✅ | Inline add form |
| **Sources: Update** | `PUT /workspaces/:id/sources/:id` | ✅ | ✅ | Toggle active/inactive |
| **Sources: Delete** | `DELETE /workspaces/:id/sources/:id` | ✅ | ✅ | Row menu delete action |
| **AI Agent: Chat** | `POST /workspaces/:id/agent/chat` | ✅ | ✅ | Full chat UI with conversation history, suggestion chips, typing indicator |

---

## Endpoints That Already Existed

All of the following existed before this integration phase and were simply connected:
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET/POST/PATCH /workspaces`, `GET /workspaces/:id/stats`
- `GET/PUT /workspaces/:id/brand-profile`
- `GET/POST /workspaces/:id/research`, `/research/sync`, `/research/:id/convert`
- `GET/POST /workspaces/:id/seo-opportunities`, `/seo-opportunities/:id/convert`
- `GET/POST/PUT/DELETE /workspaces/:id/content-packs`
- `GET /workspaces/:id/analytics`
- `GET/POST/PUT/DELETE /workspaces/:id/sources`
- `POST /workspaces/:id/agent/chat`

## Endpoints Added to the Backend

| Endpoint | Reason |
|---|---|
| `GET /auth/me` | Required to restore the authenticated session on page load from the httpOnly cookie without re-submitting credentials |

## Features Dependent on External Integrations (Not Implemented in This Phase)

| Feature | Dependency | Status |
|---|---|---|
| Google Search Console data | GSC credentials + OAuth | Awaiting admin setup; SEO page will show real data once GSC syncs |
| Social publishing (Postiz) | Postiz API key | Settings page shows correct "Requires Admin Setup" badge |
| Research sync delivering items | Sources + QStash worker | QStash job is queued; workers must be configured in Vercel |
| Analytics chart data | Social account OAuth | Analytics renders real data if connected; empty state if not |
| Calendar scheduling | Postiz integration | Calendar page shows placeholder; scheduling requires Postiz |

## Architecture Notes

### Session Security
- **No JWT in localStorage.** The backend issues an httpOnly cookie on login/register. The frontend never touches it. `credentials:'include'` is set in the centralized `apiClient`, which forwards the cookie on every request automatically.
- The `GET /auth/me` endpoint validates the cookie server-side and returns the current user shape, enabling session restoration on hard page reloads.

### Workspace Isolation
- `WorkspaceContext` fetches all workspaces for the authenticated user, then scopes **every API call** to `activeWorkspace.id`.
- All workspace-scoped API paths use `/workspaces/:workspaceId/...` with the `WorkspaceGuard` enforced server-side, ensuring Workspace A data never leaks into Workspace B.
- The active workspace ID is persisted to `localStorage` (the ID only, never a token) for session continuity across reloads.

### Medical Workspace
- `AppShell` checks `activeWorkspace.type === 'MEDICAL'` and renders the `MedicalWorkspaceBanner` automatically.
- The banner is shown on every page when the medical workspace is active.
- The content creator and assistant pages are fully functional but the compliance notes field from the AI response is prominently displayed in the generated output.

### Error States
Every page handles:
- **Loading**: Skeleton pulse animations
- **401 Unauthorized**: Specific message "Session expired. Please sign in again."
- **Empty**: `EmptyState` component with contextual description and primary action
- **Server error**: Red alert banner with retry button
- **Not found (404)**: Treated as "not configured yet" (e.g., brand profile)

### Type Safety
- `src/types/api.ts`: Centralised type definitions mirroring all NestJS DTOs — `User`, `Workspace`, `ContentPack`, `ResearchItem`, `SeoOpportunity`, `Source`, `BrandProfile`, `ChatMessage`, etc.
- No `any` used in integration code.

## Build Status

| Check | Status |
|---|---|
| `npm run typecheck` (frontend) | ✅ Passes |
| `npm run lint` (frontend) | ✅ Passes (0 warnings, 0 errors) |
| `npm run build` (frontend) | ✅ Passes (18 routes, all compiled) |
| `tsc --noEmit` (API) | ✅ Passes |

---

## Git Status

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   apps/api/src/auth/auth.controller.ts
  modified:   apps/web/src/app/(auth)/login/page.tsx
  modified:   apps/web/src/app/(auth)/register/page.tsx
  modified:   apps/web/src/app/(dashboard)/analytics/page.tsx
  modified:   apps/web/src/app/(dashboard)/assistant/page.tsx
  modified:   apps/web/src/app/(dashboard)/content/create/page.tsx
  modified:   apps/web/src/app/(dashboard)/content/page.tsx
  modified:   apps/web/src/app/(dashboard)/dashboard/page.tsx
  modified:   apps/web/src/app/(dashboard)/layout.tsx
  modified:   apps/web/src/app/(dashboard)/research/page.tsx
  modified:   apps/web/src/app/(dashboard)/seo/page.tsx
  modified:   apps/web/src/app/(dashboard)/settings/page.tsx
  modified:   apps/web/src/app/(dashboard)/sources/page.tsx
  modified:   apps/web/src/app/layout.tsx
  modified:   apps/web/src/components/layout/Shell.tsx

Untracked files:
  apps/web/src/context/     ← AuthContext + WorkspaceContext
  apps/web/src/services/    ← auth, workspaces, research, seo, content, sources, analytics, agent
  apps/web/src/types/       ← api.ts (shared TypeScript types)
```

### git diff --stat
```
 apps/api/src/auth/auth.controller.ts               |  10 +-
 apps/web/src/app/(auth)/login/page.tsx             | 104 +++++--
 apps/web/src/app/(auth)/register/page.tsx          | 129 ++++++---
 apps/web/src/app/(dashboard)/analytics/page.tsx    | 130 +++++++--
 apps/web/src/app/(dashboard)/assistant/page.tsx    | 174 ++++++++++--
 apps/web/src/app/(dashboard)/content/create/page.tsx | 294 ++++++++++++++++----
 apps/web/src/app/(dashboard)/content/page.tsx      | 281 +++++++++++++++----
 apps/web/src/app/(dashboard)/dashboard/page.tsx    | 307 +++++++++++++++------
 apps/web/src/app/(dashboard)/layout.tsx            |  29 +-
 apps/web/src/app/(dashboard)/research/page.tsx     | 205 +++++++++++---
 apps/web/src/app/(dashboard)/seo/page.tsx          | 262 ++++++++++++------
 apps/web/src/app/(dashboard)/settings/page.tsx     | 292 ++++++++++++++++----
 apps/web/src/app/(dashboard)/sources/page.tsx      | 269 ++++++++++++++----
 apps/web/src/app/layout.tsx                        |  30 +-
 apps/web/src/components/layout/Shell.tsx           | 251 ++++++++++++++---
 15 files changed, 2,173 insertions(+), 594 deletions(-)
```
