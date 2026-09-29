# Vercel Services Configuration Report

## 1. Architecture Decision
**Decision: Option A (One Vercel Services Project)**
The repository is perfectly compatible with Vercel's modern `Services` model. By migrating away from the legacy Builds API (`"builds": [...]`), we can deploy both the Next.js frontend and NestJS backend natively within a single Vercel project using the `"services"` block.

This achieves:
* A single shared Vercel domain and project.
* Zero CORS issues (the browser sees a single API).
* Full support for modern Next.js App Router features (which the legacy Builds API breaks).
* Native NestJS zero-config deployment without requiring manual Express Serverless wrappers.

## 2. Exact Routing
```json
"rewrites": [
  {
    "source": "/api/(.*)",
    "destination": { "service": "api" }
  },
  {
    "source": "/(.*)",
    "destination": { "service": "web" }
  }
]
```
* **Frontend Routing:** Any request not matching `/api/*` routes natively to the Next.js `web` service.
* **Backend Routing:** Any request matching `/api/*` seamlessly redirects to the NestJS `api` service.

## 3. Exact Files Changed
1. **`vercel.json`**
   * Replaced the legacy `"builds"` array with the modern `"services"` object.
   * Defined the `api` service (`root: "apps/api"`) and `web` service (`root: "apps/web"`).
   * Swapped legacy route destinations for native Vercel Service bindings (e.g. `"destination": { "service": "api" }`).
   * Moved the 60-second AI timeout to a global `"functions"` block targeting `apps/api/src/main.ts`.

2. **`apps/api/src/serverless.ts` (DELETED)**
   * Vercel's zero-config Node.js builder natively parses NestJS `src/main.ts` and auto-wraps `app.listen()` into a serverless handler.
   * `serverless.ts` was an artifact of the legacy Builds API and is safely removed.

3. **`apps/api/package.json`**
   * Uninstalled `@vendia/serverless-express`, `aws-lambda`, and `@types/aws-lambda` as they are no longer required.

## 4. Environment Variables Required
No changes to the existing Phase 4 environment variables. You still need:
* `DATABASE_URL` (Neon Pooled)
* `DIRECT_URL` (Neon Direct)
* `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`
* `JWT_SECRET`
* `API_URL`, `NEXT_PUBLIC_API_URL`, `FRONTEND_URL`

*Note: `NEXT_PUBLIC_API_URL` is still necessary because the Next.js client-side React components need to know the absolute URI to `fetch()` against for initial client payloads in some setups, though passing `/api` directly could work later.*

## 5. Remaining Manual Vercel Steps
Since the Vercel UI has successfully detected the "Services" model:
1. Complete the Vercel dashboard project creation.
2. Inject your production Environment Variables (Neon, QStash, JWT).
3. Click **Deploy**.

## 6. Limitations & Risks
* **Cold Starts:** NestJS boot times can introduce a cold-start delay of 1-3 seconds on the first API request after a period of inactivity. This is standard for Serverless NestJS and is fully managed by Vercel.
* **In-Memory State:** As previously audited, all queues/cron jobs now use stateless Upstash QStash, so Vercel's ephemeral serverless nature is perfectly safe.
