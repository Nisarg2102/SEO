# Vercel Services Configuration Report

## 1. Exact Cause of the Error
Vercel returned the error: `"Error: Service "api" detected framework "nestjs" in "apps/api" and must specify an "entrypoint" for runtime "node"."`
In Vercel's unified Services model, when Vercel detects a Node.js framework like NestJS inside a service definition, it requires an explicit `entrypoint` declaration to know exactly which file bootstraps the application, instead of relying purely on zero-config heuristics.

## 2. Exact Configuration Change
Added `"entrypoint": "src/main.ts"` to the `"api"` service block inside `vercel.json`. 

* **Why `entrypoint` was required:** Vercel's strict Services model requires explicit confirmation of the runtime entry point for Node.js backends.
* **Why `src/main.ts` is used:** We verified that `apps/api/src/main.ts` contains the standard NestJS `bootstrap()` function which Vercel's runtime wraps into a Serverless Function natively.

## 3. Final Service Structure & Architecture
```json
{
  "services": {
    "api": {
      "root": "apps/api",
      "entrypoint": "src/main.ts",
      "functions": {
        "src/main.ts": {
          "maxDuration": 60
        }
      }
    },
    "web": {
      "root": "apps/web"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": {
        "service": "api"
      }
    },
    {
      "source": "/(.*)",
      "destination": {
        "service": "web"
      }
    }
  ]
}
```
**Architecture Summary:**
* **ONE Vercel Services project** handling both the frontend and backend.
* **`apps/api` -> `api` service:** Explicitly bootstrapped from `src/main.ts`.
* **`apps/web` -> `web` service:** Next.js application.
* **Routing:** `/(.*)` goes to Next.js; `/api/(.*)` natively forwards to NestJS.

## 4. Functions Configuration & maxDuration
- **Preserved:** The `maxDuration: 60` configuration is absolutely required because AI Agent calls to OpenAI will often exceed the Vercel Hobby/Pro default of 10s or 15s.
- **Location:** Placed strictly on `src/main.ts` inside the `api` service.
- **No Legacy Artifacts:** The legacy `builds` array remains removed, the top-level `functions` block remains removed, and the custom `serverless.ts` wrapper (and `serverless-express` dependency) remain safely deleted.

## 5. Environment Variables
* `NEXT_PUBLIC_API_URL` finding: Since frontend requests to `/api/*` are perfectly proxied to the NestJS API on the same domain (thanks to the Vercel Services rewrite), client-side browser requests actually don't require an absolute URL. *However*, we kept it intact for now because React Server Components (which execute server-side) still require absolute hostnames.
* All existing variables (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `QSTASH_*`) remain required.

## 6. Remaining Vercel Configuration Steps
With the structural ambiguity resolved and precise targeting applied, you can:
1. Commit the project so Vercel picks up the finalized `vercel.json`.
2. Vercel will now properly route the services, use the explicit entrypoint, and attach the 60-second limit exactly to the NestJS Serverless Function.
3. Deploy!
