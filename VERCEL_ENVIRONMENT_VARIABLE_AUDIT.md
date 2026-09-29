# Vercel Environment Variable Audit

## 1. Executive Summary
This audit comprehensively reviews all environment variables used, referenced, and documented across the SEO Monorepo (Next.js frontend + NestJS serverless API). The purpose is to map out the exact configuration required for deploying to Vercel with Neon PostgreSQL and Upstash QStash, while securely managing API keys for external integrations (AI, Google, Postiz, OpenSEO, n8n).

No sensitive production keys or passwords are exposed in this document. Tracked Git files and `.gitignore` directives are correctly implemented to prevent secret leakage.

---

## 2. Complete Variable Inventory

| Variable | Used Where | Required? | Environment | Secret? | Public? | Purpose | Current Status |
| -------- | ---------- | --------- | ----------- | ------- | ------- | ------- | -------------- |
| `DATABASE_URL` | Prisma, Backend | REQUIRED | ALL | SECRET | SERVER-ONLY | Core database connection (pooled for Vercel) | REQUIRES NEON ACCOUNT |
| `DIRECT_URL` | Prisma | REQUIRED | ALL | SECRET | SERVER-ONLY | Direct database connection for Prisma CLI | REQUIRES NEON ACCOUNT |
| `JWT_SECRET` | Backend Auth | REQUIRED | ALL | SECRET | SERVER-ONLY | Sign/verify HTTP-only cookies | REQUIRES CONFIGURATION |
| `FRONTEND_URL` | Backend CORS | REQUIRED | ALL | NON-SECRET | SERVER-ONLY | Restrict origins connecting to backend | REQUIRES CONFIGURATION |
| `API_URL` | Backend | REQUIRED | ALL | NON-SECRET | SERVER-ONLY | Base URL for QStash callbacks | REQUIRES CONFIGURATION |
| `NEXT_PUBLIC_API_URL` | Frontend (`apiClient.ts`) | REQUIRED | ALL | NON-SECRET | BROWSER-EXPOSED | Instructs Next.js where to send API requests | REQUIRES CONFIGURATION |
| `PORT` | Backend Boot | OPTIONAL | LOCAL | NON-SECRET | SERVER-ONLY | Legacy explicit binding (ignored in Vercel serverless) | CONFIGURED LOCALLY |
| `QSTASH_TOKEN` | Backend (`Client`) | REQUIRED | ALL | SECRET | SERVER-ONLY | Publishing QStash messages | REQUIRES UPSTASH ACCOUNT |
| `QSTASH_CURRENT_SIGNING_KEY`| Backend (`Receiver`) | REQUIRED | ALL | SECRET | SERVER-ONLY | Webhook signature validation | REQUIRES UPSTASH ACCOUNT |
| `QSTASH_NEXT_SIGNING_KEY` | Backend (`Receiver`) | REQUIRED | ALL | SECRET | SERVER-ONLY | Webhook signature validation (rollover) | REQUIRES UPSTASH ACCOUNT |
| `AI_API_KEY` | Backend (`ai.service.ts`) | CONDITIONAL | ALL | SECRET | SERVER-ONLY | Provider authentication | REQUIRES EXTERNAL ACCOUNT |
| `AI_MODEL` | Backend (`ai.service.ts`) | CONDITIONAL | ALL | NON-SECRET | SERVER-ONLY | LLM specification (e.g. `gpt-4o`) | REQUIRES CONFIGURATION |
| `GOOGLE_CLIENT_ID` | Backend (`gsc.service.ts`) | CONDITIONAL | ALL | SECRET | SERVER-ONLY | Google OAuth | REQUIRES EXTERNAL ACCOUNT |
| `GOOGLE_CLIENT_SECRET` | Backend (`gsc.service.ts`) | CONDITIONAL | ALL | SECRET | SERVER-ONLY | Google OAuth | REQUIRES EXTERNAL ACCOUNT |
| `GOOGLE_CALLBACK_URL` | Backend (`gsc.service.ts`) | CONDITIONAL | ALL | NON-SECRET | SERVER-ONLY | Google OAuth Redirect | REQUIRES EXTERNAL ACCOUNT |
| `OPENSEO_URL` | Backend (`openseo.service.ts`)| CONDITIONAL | ALL | NON-SECRET | SERVER-ONLY | API base | REQUIRES EXTERNAL ACCOUNT |
| `OPENSEO_API_KEY` | Backend (`openseo.service.ts`)| CONDITIONAL | ALL | SECRET | SERVER-ONLY | API auth | REQUIRES EXTERNAL ACCOUNT |
| `N8N_WEBHOOK_SECRET` | Backend (`n8n.guard.ts`) | CONDITIONAL | ALL | SECRET | SERVER-ONLY | Secure n8n invocations | REQUIRES CONFIGURATION |
| `POSTIZ_URL` | Backend (`postiz.service.ts`) | CONDITIONAL | ALL | NON-SECRET | SERVER-ONLY | Social publishing API | REQUIRES EXTERNAL ACCOUNT |
| `POSTIZ_API_KEY` | Backend (`postiz.service.ts`) | CONDITIONAL | ALL | SECRET | SERVER-ONLY | Postiz API auth | REQUIRES EXTERNAL ACCOUNT |
| `POSTIZ_WEBHOOK_SECRET`| Backend (`postiz-webhook.guard.ts`) | CONDITIONAL | ALL | SECRET | SERVER-ONLY | Validates incoming Postiz events | REQUIRES CONFIGURATION |
| `REDIS_HOST` | Legacy / Local | LOCAL-ONLY | LOCAL | NON-SECRET | SERVER-ONLY | Local Docker stack (unused in Vercel) | CONFIGURED LOCALLY |
| `REDIS_PORT` | Legacy / Local | LOCAL-ONLY | LOCAL | NON-SECRET | SERVER-ONLY | Local Docker stack (unused in Vercel) | CONFIGURED LOCALLY |
| `POSTGRES_*` | Docker Compose | LOCAL-ONLY | LOCAL | SECRET | SERVER-ONLY | Docker DB provisioning | CONFIGURED LOCALLY |

---

## 3. Required for First Vercel Deployment
These variables are structurally required for the NestJS API and Next.js frontend to boot cleanly without initialization errors.

* `DATABASE_URL` (Neon Pooled connection string)
* `DIRECT_URL` (Neon direct connection string)
* `JWT_SECRET` (Secure random string)
* `FRONTEND_URL` (e.g. `https://your-app.vercel.app`)
* `API_URL` (e.g. `https://your-app.vercel.app`)
* `NEXT_PUBLIC_API_URL` (e.g. `https://your-app.vercel.app/api`)
* `QSTASH_TOKEN` (Upstash generated)
* `QSTASH_CURRENT_SIGNING_KEY` (Upstash generated)
* `QSTASH_NEXT_SIGNING_KEY` (Upstash generated)

## 4. Required for Database
* `DATABASE_URL`
* `DIRECT_URL`

## 5. Required for Authentication
* `JWT_SECRET`
* `FRONTEND_URL` (Used strictly for configuring exact CORS matches)

## 6. Required for QStash
* `QSTASH_TOKEN`
* `QSTASH_CURRENT_SIGNING_KEY`
* `QSTASH_NEXT_SIGNING_KEY`
* `API_URL` (Used as the base domain for outbound payload webhooks)

## 7. Required for AI
* `AI_API_KEY`
* `AI_MODEL`

## 8. Required for Google
* `GOOGLE_CLIENT_ID`
* `GOOGLE_CLIENT_SECRET`
* `GOOGLE_CALLBACK_URL`

## 9. Required for Postiz
* `POSTIZ_URL`
* `POSTIZ_API_KEY`
* `POSTIZ_WEBHOOK_SECRET`

## 10. Required for OpenSEO
* `OPENSEO_URL`
* `OPENSEO_API_KEY`

## 11. Required for n8n
* `N8N_WEBHOOK_SECRET`

## 12. Frontend/Public Variables
* `NEXT_PUBLIC_API_URL`: Configures `apiClient.ts` directly in the browser boundary to issue commands against the serverless backend.

## 13. Local-Only Variables
* `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` (Used by `docker-compose.yml`)
* `REDIS_HOST`, `REDIS_PORT` (Used by `docker-compose.yml`)
* `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` (Used by local `docker-compose.yml` for UI)

## 14. Missing Variables
* None. The current codebase matches `.env.example` configurations exactly.

## 15. Unused/Documentation-Only Variables
* In `packages/database/.env`, `DATABASE_URL` duplicates the one found at the project root. This is standard Prisma practice (Prisma auto-detects `packages/database/.env`) and remains structurally fine.

## 16. Hardcoded Configuration Findings
* **`http://localhost:3000` / `3001`**: Present safely as `||` fallback defaults in API codebase for local development routing when Vercel env-vars are completely absent.
* **QStash endpoints**: Rely seamlessly on `process.env.API_URL || (process.env.VERCEL_URL ? \`https://${process.env.VERCEL_URL}\` : 'http://localhost:3001')`.

## 17. Secret Exposure Findings
**Result:** PASSED (Zero real secrets exposed)
* Grep scans for `API_KEY=`, `TOKEN=`, `SECRET=`, `PASSWORD=` inside tracked files yielded **only** dummy example data (e.g., `<YOUR_API_KEY>`, `openssl rand -hex 32` instructions).
* No `.env`, `.env.local`, or `.env.production` files containing live keys are checked into Git.

## 18. `.gitignore` Findings
The root `.gitignore` correctly ignores:
```
.env
.env.*
!.env.example
!.env.production.example
```
Guaranteeing no live configuration is inadvertently pushed.

## 19. Vercel Setup Checklist
1. Create/Import GitHub repo `Nisarg2102/SEO` in Vercel.
2. Select **Next.js** framework (Vercel auto-detects `apps/web/package.json` thanks to `vercel.json`).
3. Set the variables defined in Section 20 immediately before the first build.

## 20. Final Recommended Vercel Variable List
You should add the following variables inside the Vercel dashboard prior to initial deployment:

```text
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
FRONTEND_URL=
API_URL=
NEXT_PUBLIC_API_URL=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
```
*(Add AI/Google/Integrations in a subsequent iteration once base health is verified.)*
