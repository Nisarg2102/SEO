# Deployment Guide

> **Last updated:** 2026-09-29  
> **Stack:** Next.js 14 · NestJS 12 · PostgreSQL 15 + pgvector · nginx

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Building Images](#building-images)
5. [Database Migrations](#database-migrations)
6. [Deploying with Docker Compose](#deploying-with-docker-compose)
7. [TLS / HTTPS Setup](#tls--https-setup)
8. [Health Checks](#health-checks)
9. [Logging](#logging)
10. [Scaling Considerations](#scaling-considerations)
11. [CI/CD Pipeline Sketch](#cicd-pipeline-sketch)
12. [Rollback Procedure](#rollback-procedure)
13. [External Services Configuration](#external-services-configuration)

---

## Architecture Overview

```
Internet
    │  HTTPS :443
    ▼
┌──────────┐
│  nginx   │  Reverse proxy — TLS termination, routing, rate limiting
└──────────┘
  │        │
  │ /api/* │ /*
  ▼        ▼
┌─────┐  ┌─────┐
│ api │  │ web │  Two isolated Docker containers
│3001 │  │3000 │  Non-root users, resource limits
└──┬──┘  └─────┘
   │ internal network only
   ▼
┌──────────┐
│ postgres │  pgvector — NOT exposed to host
└──────────┘
```

### Container Summary

| Container | Image | User | Memory limit |
|---|---|---|---|
| `postgres` | `ankane/pgvector:latest` | postgres (internal) | 1 GB |
| `api` | custom NestJS build | `nestjs` (uid 1001) | 512 MB |
| `web` | custom Next.js build | `nextjs` (uid 1001) | 512 MB |
| `nginx` | `nginx:1.27-alpine` | nginx | 64 MB |

### Network Isolation

- **`internal` network** — only `postgres` and `api`. The database is never reachable from outside Docker.
- **`public` network** — `nginx`, `web`, `api`. nginx is the only container with host-mapped ports.

---

## Prerequisites

On the deployment host:
- Docker ≥ 25.0
- Docker Compose plugin ≥ 2.24
- 2 GB+ RAM
- A registered domain with DNS pointing to the host
- TLS certificates (see [TLS Setup](#tls--https-setup))

---

## Environment Configuration

### 1. Create the production env file

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and fill **every** blank value. All the `<CHANGE_ME>` markers must be replaced.

### 2. Generate secrets

```bash
# JWT secret (minimum 32 chars)
openssl rand -hex 32

# N8N webhook secret
openssl rand -hex 32

# Postiz webhook secret
openssl rand -hex 32

# Database password
openssl rand -hex 24
```

### Required environment variables

| Variable | Description |
|---|---|
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password — generated above |
| `POSTGRES_DB` | Database name |
| `JWT_SECRET` | JWT signing key — ≥ 32 chars |
| `FRONTEND_URL` | Public URL of the web app, e.g. `https://app.yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | Public URL of the API, e.g. `https://app.yourdomain.com/api` |
| `AI_API_KEY` | OpenAI API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Must match what is registered in Google Cloud Console |
| `N8N_WEBHOOK_SECRET` | Shared secret for n8n → API webhooks |
| `POSTIZ_WEBHOOK_SECRET` | Shared secret for Postiz → API webhooks |
| `DOMAIN` | Your domain, e.g. `app.yourdomain.com` |
| `TLS_CERT_PATH` | Host path to TLS cert directory |

> **Important:** `NEXT_PUBLIC_API_URL` is **baked into the Next.js bundle at build time**. Rebuilding the image is required if this value changes.

---

## Building Images

Build from the repository root (not from inside `apps/`):

```bash
# Build both images
docker compose -f docker-compose.production.yml --env-file .env.production build

# Build with a specific tag for a CI pipeline
docker compose -f docker-compose.production.yml --env-file .env.production build \
  --build-arg NEXT_PUBLIC_API_URL=https://app.yourdomain.com/api

# Tag and push to a registry
docker tag local/ai-marketing-api:latest your-registry.com/ai-marketing-api:v1.2.3
docker tag local/ai-marketing-web:latest your-registry.com/ai-marketing-web:v1.2.3
docker push your-registry.com/ai-marketing-api:v1.2.3
docker push your-registry.com/ai-marketing-web:v1.2.3
```

---

## Database Migrations

Migrations run **automatically** on API container startup via the `docker-entrypoint.sh` script using `prisma migrate deploy`.

`prisma migrate deploy`:
- Is **idempotent** — safe to run multiple times
- Only applies **pending** migrations — never rolls back
- Will **fail fast** and prevent the container from starting if a migration fails

### Running migrations manually

```bash
# Using the migrate script (requires DATABASE_URL in environment)
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
./infrastructure/scripts/migrate.sh

# Or via docker exec on a running API container
docker exec ai_marketing_api_prod \
  npx prisma migrate deploy \
  --schema /app/packages/database/prisma/schema.prisma
```

### Skip migrations (read-only replicas)

Set `SKIP_MIGRATIONS=true` in the container environment.

---

## Deploying with Docker Compose

### First deployment

```bash
# Pull or build images
docker compose -f docker-compose.production.yml --env-file .env.production build

# Start all services
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Watch startup logs
docker compose -f docker-compose.production.yml logs -f
```

### Subsequent deployments (zero-downtime not guaranteed without a load balancer)

```bash
# 1. Build new images
docker compose -f docker-compose.production.yml --env-file .env.production build api web

# 2. Restart with new images (brief downtime — ~30s)
docker compose -f docker-compose.production.yml --env-file .env.production \
  up -d --no-deps api web
```

> For true zero-downtime deployments, use a managed orchestrator (ECS, Kubernetes, Cloud Run) or a Traefik rolling update strategy.

---

## TLS / HTTPS Setup

### Option A: Let's Encrypt (recommended for single-server)

```bash
# Install certbot
apt-get install certbot

# Obtain certificate
certbot certonly --standalone -d yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Set in .env.production
TLS_CERT_PATH=/etc/letsencrypt/live/yourdomain.com
```

### Option B: Cloud-managed TLS (recommended for production)

Use your cloud provider's load balancer (AWS ALB, GCP Load Balancer, Cloudflare) to terminate TLS. In this case, remove the `nginx` service from the compose file and configure your LB to forward HTTP to ports 3000/3001 on the host.

### Auto-renewal

```bash
# Add to crontab
0 3 * * * certbot renew --quiet && \
  docker exec ai_marketing_nginx_prod nginx -s reload
```

---

## Health Checks

All services expose health endpoints. The Docker health checks use these.

| Service | Endpoint | Expected response |
|---|---|---|
| api | `GET /health` | `{"status":"ok","database":{"connected":true}}` |
| web | `GET /` | HTTP 200, HTML body |
| nginx | `GET /health` | Proxied from API |
| postgres | `pg_isready` | Connection accepted |

Check health status:

```bash
docker compose -f docker-compose.production.yml ps
```

---

## Logging

All containers use the `json-file` driver with rotation (50 MB × 5 files per container).

```bash
# Follow all service logs
docker compose -f docker-compose.production.yml logs -f

# Follow a specific service
docker compose -f docker-compose.production.yml logs -f api

# View nginx access log
docker exec ai_marketing_nginx_prod cat /var/log/nginx/access.log
```

nginx writes structured JSON access logs:

```json
{
  "time": "2026-09-29T10:00:00+00:00",
  "remote_addr": "1.2.3.4",
  "method": "GET",
  "uri": "/api/health",
  "status": 200,
  "request_time": 0.012
}
```

### Sending logs to an external collector

For production, pipe logs to a centralised collector:

```yaml
# In docker-compose.production.yml, replace logging driver:
logging:
  driver: awslogs
  options:
    awslogs-group: /ai-marketing/api
    awslogs-region: us-east-1
```

---

## Scaling Considerations

### Horizontal scaling limitations (current architecture)

| Concern | Current state | Solution |
|---|---|---|
| JWT is stateless | ✅ Safe to scale | Already stateless |
| Session / token denylist | ❌ In-memory | Add Redis for token revocation |
| Database connections | Default pool | Set `DATABASE_URL` connection pool limits via `?connection_limit=N` |
| File uploads | None yet | Use S3-compatible object storage when added |
| Background jobs (research sync) | n8n → webhook | n8n runs externally; naturally separated |

### Scaling the API

```bash
# Run 3 API instances behind nginx upstream
docker compose -f docker-compose.production.yml \
  --env-file .env.production \
  up -d --scale api=3
```

Update `nginx.conf` upstream block to use least_conn load balancing if scaling.

---

## CI/CD Pipeline Sketch

```yaml
# Suggested GitHub Actions workflow
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test --workspaces
      - name: Build images
        run: |
          docker build -f apps/api/Dockerfile -t $REGISTRY/api:$SHA .
          docker build -f apps/web/Dockerfile \
            --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
            -t $REGISTRY/web:$SHA .
      - name: Push images
        run: |
          docker push $REGISTRY/api:$SHA
          docker push $REGISTRY/web:$SHA
      - name: Deploy
        run: |
          ssh deploy@your-host "
            IMAGE_TAG=$SHA \
            docker compose -f docker-compose.production.yml \
              --env-file .env.production up -d --no-deps api web
          "
```

---

## Rollback Procedure

```bash
# Identify the previous working image tag (from your CI/CD registry)
PREVIOUS_TAG=v1.2.2

# Roll back API
docker pull your-registry.com/ai-marketing-api:$PREVIOUS_TAG
IMAGE_TAG=$PREVIOUS_TAG \
  docker compose -f docker-compose.production.yml \
  --env-file .env.production up -d --no-deps api

# Roll back Web
docker pull your-registry.com/ai-marketing-web:$PREVIOUS_TAG
IMAGE_TAG=$PREVIOUS_TAG \
  docker compose -f docker-compose.production.yml \
  --env-file .env.production up -d --no-deps web
```

> ⚠️ If the new version included a database migration, rolling back the application code will NOT automatically reverse the migration. Consult the Prisma migration history and restore from backup if needed.

---

## External Services Configuration

### Google Search Console OAuth

Register the callback URL in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

```
Authorized redirect URI: https://yourdomain.com/api/gsc/callback
```

### n8n

Set the webhook base URL in n8n to point to the API:
```
https://yourdomain.com/api/webhooks/n8n/research-sync
Header: X-N8N-API-KEY = <N8N_WEBHOOK_SECRET>
```

See `docs/N8N_WORKFLOWS.md` for full workflow documentation.

### Postiz

Set the sync webhook in Postiz to:
```
https://yourdomain.com/api/webhooks/postiz/sync
Header: X-Postiz-Webhook-Secret = <POSTIZ_WEBHOOK_SECRET>
```

---

## File Reference

| File | Purpose |
|---|---|
| [`apps/api/Dockerfile`](apps/api/Dockerfile) | Multi-stage API image |
| [`apps/web/Dockerfile`](apps/web/Dockerfile) | Multi-stage web image |
| [`apps/api/docker-entrypoint.sh`](apps/api/docker-entrypoint.sh) | Runs migrations on startup |
| [`docker-compose.production.yml`](docker-compose.production.yml) | Production orchestration |
| [`docker-compose.yml`](docker-compose.yml) | Local development (DB only) |
| [`infrastructure/nginx/nginx.conf`](infrastructure/nginx/nginx.conf) | nginx main config |
| [`infrastructure/nginx/conf.d/app.conf`](infrastructure/nginx/conf.d/app.conf) | nginx server block |
| [`infrastructure/scripts/migrate.sh`](infrastructure/scripts/migrate.sh) | Standalone migration script |
| [`.env.production.example`](.env.production.example) | Production env template |
| [`SECURITY.md`](SECURITY.md) | Security architecture and review |
