# Vercel Environment Variables

The following environment variables must be configured in the Vercel dashboard prior to deployment. 

**IMPORTANT:** Never commit these values to git. 

| NAME | PURPOSE | WHERE VALUE COMES FROM | ENVIRONMENT | SECRET |
|---|---|---|---|---|
| **Frontend Variables** |
| `NEXT_PUBLIC_API_URL` | Tells Next.js where to send requests | Usually `/api` if proxied via Vercel, or full URL | Dev/Preview/Prod | No |
| **Backend Core** |
| `NODE_ENV` | Production mode optimization | Vercel (Auto) | Prod | No |
| `PORT` | Not strictly required in serverless | Vercel (Auto) | Prod | No |
| `JWT_SECRET` | Signs and verifies session tokens | Generate securely (e.g. `openssl rand -hex 32`) | Prod | **Yes** |
| `FRONTEND_URL` | Used for CORS and email/redirect links | Vercel Domains (`https://app.yourdomain.com`) | Prod | No |
| **Neon PostgreSQL** |
| `DATABASE_URL` | Prisma pooled connection string | Neon Dashboard (Connections -> Pooler) | Preview/Prod | **Yes** |
| `DIRECT_URL` | Prisma unpooled URL for migrations | Neon Dashboard | Preview/Prod | **Yes** |
| **Upstash (Redis & QStash)** |
| `REDIS_URL` | For cache connections (if needed) | Upstash Dashboard -> Redis | Prod | **Yes** |
| `QSTASH_TOKEN` | For publishing background jobs | Upstash Dashboard -> QStash | Prod | **Yes** |
| `QSTASH_CURRENT_SIGNING_KEY` | For verifying incoming webhooks | Upstash Dashboard -> QStash | Prod | **Yes** |
| `QSTASH_NEXT_SIGNING_KEY` | For key rotation verification | Upstash Dashboard -> QStash | Prod | **Yes** |
| **Google (OAuth & Analytics)** |
| `GOOGLE_CLIENT_ID` | OAuth login | Google Cloud Console | Prod | No |
| `GOOGLE_CLIENT_SECRET` | OAuth login | Google Cloud Console | Prod | **Yes** |
| `GOOGLE_CALLBACK_URL` | Redirect after OAuth | Must match GCP exact path (e.g. `/api/auth/google/callback`) | Prod | No |
| **AI Provider** |
| `AI_MODEL` | Default model string | e.g., `gpt-4o`, `claude-3-opus` | Prod | No |
| `AI_API_KEY` | Authentication for AI generations | OpenAI / Anthropic Dashboard | Prod | **Yes** |
| **External Integrations** |
| `OPENSEO_URL` | Free SEO Tools base API URL | Free SEO Tools Documentation | Prod | No |
| `OPENSEO_API_KEY` | Free SEO Tools Authentication | Free SEO Tools Dashboard | Prod | **Yes** |
| `POSTIZ_URL` | Social publishing platform URL | Postiz Hosting | Prod | No |
| `POSTIZ_API_KEY` | Social publishing auth | Postiz Dashboard | Prod | **Yes** |
| `POSTIZ_WEBHOOK_SECRET` | Validate incoming Postiz webhooks | Generated manually and shared with Postiz | Prod | **Yes** |
| `N8N_WEBHOOK_SECRET` | Validate incoming n8n automations | Generated manually and shared with n8n | Prod | **Yes** |
