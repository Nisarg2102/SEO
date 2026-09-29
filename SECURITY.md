# Security Architecture & Review

> **Reviewed:** 2026-09-29  
> **Scope:** Full application — backend (NestJS), frontend (Next.js), database (PostgreSQL/Prisma), external integrations.

---

## Table of Contents
1. [Security Architecture](#security-architecture)
2. [Multi-Tenant Workspace Isolation](#multi-tenant-workspace-isolation)
3. [Authentication & Authorization](#authentication--authorization)
4. [Findings & Fixes Applied](#findings--fixes-applied)
5. [Known Limitations](#known-limitations)
6. [Secrets Management](#secrets-management)
7. [Production Recommendations](#production-recommendations)

---

## Security Architecture

```
Browser ──HTTPS──▶ Next.js (frontend)
                         │ Bearer JWT
                         ▼
                   NestJS API (port 3001)
                    │   │   │
             ┌──────┘   │   └──────────┐
             ▼          ▼              ▼
        JwtAuthGuard  WorkspaceGuard  N8nGuard / PostizWebhookGuard
             │          │
             └──────────┴──▶ PrismaService ──▶ PostgreSQL
```

### Layers of Defence

| Layer | Mechanism |
|---|---|
| Transport | HTTPS required in production; CORS restricted to `FRONTEND_URL` |
| Authentication | JWT (HS256) with short expiry (8 h); bcrypt(10) for passwords |
| Authorization | Per-request workspace membership check via `WorkspaceGuard` |
| Input validation | Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true` |
| Security headers | `helmet` on every response |
| Rate limiting | `@nestjs/throttler` — 100 req / 60 s per IP globally |
| Webhook auth | Shared secrets via `timingSafeEqual`; no hardcoded fallbacks |
| AI prompt injection | Input sanitized; history depth capped; tool allowlist enforced |

---

## Multi-Tenant Workspace Isolation

### How Isolation is Enforced

Every workspace-scoped route carries `/:workspaceId` in the URL path.
**Every** such route is decorated with both `JwtAuthGuard` and `WorkspaceGuard`:

```typescript
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('workspaces/:workspaceId/content-packs')
```

`WorkspaceGuard` executes a database lookup on every request:

```typescript
const membership = await prisma.workspaceMember.findUnique({
  where: { workspaceId_userId: { workspaceId, userId: user.userId } },
});
if (!membership) throw new ForbiddenException();
```

This means:
- **User A cannot access Workspace B** even if they know the UUID — the guard rejects before any service logic runs.
- Workspace IDs are UUIDs (v4) — not enumerable integers.
- All service methods re-scope queries using the `workspaceId` from the authenticated route param, not from the request body.

### Attempted Cross-Tenant Attack Scenarios

| Attack | Outcome |
|---|---|
| `GET /workspaces/<B-id>/content-packs` with User A's token | **Blocked** — `WorkspaceGuard` rejects with 403 |
| Sending `workspaceId` in request body instead of URL | **Blocked** — `ValidationPipe(whitelist:true)` strips unknown body fields; services read `workspaceId` from `@Param` only |
| Guessing/enumerating workspace UUIDs | **Impractical** — UUIDs are cryptographically random (2¹²² entropy) |
| OAuth state parameter injection (redirect to attacker URL) | **Blocked** — state is validated as UUID before use; redirect domain is locked to `FRONTEND_URL` |
| Agent tool calling across workspaces | **Blocked** — `workspaceId` is injected into every tool closure at mount time; the AI cannot request a different workspace |

---

## Authentication & Authorization

### JWT
- Algorithm: HS256 (symmetric). For higher assurance, migrate to RS256.
- Expiry: **8 hours** (reduced from original 1 day).
- Secret: Minimum 32 characters required; app refuses to start without it.
- Stored client-side: `localStorage`. See [Known Limitations](#known-limitations).

### Password Storage
- bcrypt with cost factor **10**.
- `RegisterDto` enforces minimum 12 characters with complexity requirements.
- Login responses use identical error messages for unknown user vs. wrong password (prevents user enumeration).

### Workspace Roles
The `WorkspaceGuard` attaches `req.workspaceRole` on every request but currently does not enforce role-based access beyond membership. This is a known limitation — see below.

---

## Findings & Fixes Applied

### 🔴 Critical

| # | Finding | Fix Applied |
|---|---|---|
| C1 | **Hardcoded JWT fallback** — `JWT_SECRET \|\| 'super-secret-jwt-key'` would allow a known secret in any deployment missing an env var | `AuthModule` now calls `process.exit(1)` if `JWT_SECRET` is absent or < 32 chars |
| C2 | **Postiz webhook endpoint completely unauthenticated** — `POST /webhooks/postiz/sync` had no guard at all | `PostizWebhookGuard` created and applied; uses `timingSafeEqual`; fails if `POSTIZ_WEBHOOK_SECRET` not set |
| C3 | **n8n webhook hardcoded fallback secret** — `N8N_WEBHOOK_SECRET \|\| 'dev_n8n_secret_123'` | Fallback removed; app throws if env var absent |

### 🟠 High

| # | Finding | Fix Applied |
|---|---|---|
| H1 | **No CORS restriction** — API accepted requests from any origin | `enableCors` configured with `FRONTEND_URL` env var |
| H2 | **No security headers** | `helmet()` applied globally |
| H3 | **No rate limiting** — auth endpoints could be brute-forced | `ThrottlerModule` applied globally (100 req / 60 s per IP) |
| H4 | **No input validation** — DTOs had bare class fields, no decorators | Global `ValidationPipe(whitelist, forbidNonWhitelisted)` + class-validator on all DTOs |
| H5 | **OAuth open redirect** — `state` param used unvalidated as workspaceId in redirect URL | UUID regex validation before redirect; uses `FRONTEND_URL` env var |
| H6 | **AI prompt injection** — raw user message appended to AI context without sanitization | `sanitizeUserInput()` strips null bytes and excessive newlines; message capped at 4000 chars |
| H7 | **Workspace type mass assignment** — `UpdateWorkspaceDto` accepted `type` field, allowing users to change their workspace type (e.g. escape MEDICAL mode) | `type` removed from `UpdateWorkspaceDto` |
| H8 | **Webhook secrets used with `===`** — vulnerable to timing attacks | All webhook guards use `crypto.timingSafeEqual` |

### 🟡 Medium

| # | Finding | Fix Applied |
|---|---|---|
| M1 | **AI agent tool allowlist not enforced** — if AI hallucinated a tool name, service would silently return "not found" to AI context | Explicit allowlist check; unregistered calls are logged and rejected |
| M2 | **AI history unbounded** — attacker could send thousands of turns to exhaust context | History capped at 20 turns |
| M3 | **Internal error messages returned by AI tools** — `e.message` returned verbatim | Sanitized to generic "Tool execution failed"; error logged server-side |
| M4 | **`FRONTEND_URL` and other secrets hardcoded to localhost** | All redirect/CORS origins read from env vars |
| M5 | **JWT expiry was 24 hours** | Reduced to 8 hours |
| M6 | **No password complexity requirement** | 12 char minimum + uppercase + lowercase + digit + special char enforced |
| M7 | **.env.example missing several required secrets** | Updated with all required variables and generation instructions |

### ℹ️ Informational (not fixed — documented)

| # | Finding | Notes |
|---|---|---|
| I1 | **localStorage for JWT** | See Known Limitations |
| I2 | **No role-based access within workspace** | All members have equal access; planned enhancement |
| I3 | **Prisma `(as any)` casts** | Workaround for Prisma CLI constraint; no security impact but reduces type safety |
| I4 | **AI agent uses HS256 OpenAI session** | API key is server-side only; never exposed to browser |
| I5 | **No CSRF token for state-changing requests** | Mitigated by `Authorization: Bearer` header requirement (not cookie-based); not applicable |

---

## Known Limitations

### JWT in localStorage
Tokens are stored in `localStorage` in the Next.js frontend, which is accessible to JavaScript.

**Risk:** XSS vulnerability in the frontend could lead to token theft.

**Mitigations in place:**
- `helmet` sets `Content-Security-Policy` and `X-XSS-Protection` headers
- Next.js escapes JSX content by default
- Short 8-hour token expiry limits blast radius

**Recommended:** Migrate to `httpOnly` cookies with `SameSite=Strict` for production.

### No Token Revocation
JWTs are stateless; there is no server-side revocation list.

**Recommended:** Add a Redis-backed token denylist for logout or account compromise response.

### Workspace Role Enforcement
`WorkspaceGuard` currently checks membership only. There is no distinction between `OWNER`, `ADMIN`, `EDITOR`, `VIEWER` roles in access decisions.

**Recommended:** Add a `@WorkspaceRole('OWNER')` decorator and check `req.workspaceRole` in guards for destructive operations.

### AI Prompt Injection (Residual)
Prompt injection cannot be fully eliminated at the application layer — it requires model-level mitigations (system prompt pinning, Constitutional AI, etc.).

**Current mitigations:** Input sanitization, length limits, history cap, tool allowlist.

**Do not:** Store sensitive secrets in the AI agent's context or tool results.

### No File Upload Validation
There are no file upload endpoints at present. If added in future, implement: MIME type validation, size limits, virus scanning, and storage in an isolated bucket — never serve user-uploaded files from the same origin as the app.

---

## Secrets Management

### Required Environment Variables

| Variable | Description | How to Generate |
|---|---|---|
| `JWT_SECRET` | JWT signing key (≥32 chars) | `openssl rand -hex 32` |
| `N8N_WEBHOOK_SECRET` | Shared secret for n8n webhooks | `openssl rand -hex 32` |
| `POSTIZ_WEBHOOK_SECRET` | Shared secret for Postiz webhooks | `openssl rand -hex 32` |
| `POSTGRES_PASSWORD` | Database password | Use a password manager |
| `AI_API_KEY` | OpenAI API key | OpenAI dashboard |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud Console |

### Rules
- ❌ Never commit `.env` to version control
- ❌ Never log environment variables
- ❌ Never return secrets in API responses
- ✅ Rotate secrets if compromised
- ✅ Use a secrets manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault) in production

---

## Production Recommendations

### Infrastructure
- [ ] Serve both frontend and backend behind a reverse proxy (nginx / Cloudflare) with TLS termination
- [ ] Set `NODE_ENV=production` — disables stack traces in error responses
- [ ] Use a managed PostgreSQL service (RDS, Cloud SQL) with encrypted storage and automated backups
- [ ] Enable PostgreSQL SSL connections (`?sslmode=require` in `DATABASE_URL`)
- [ ] Run the API as a non-root user inside its container

### Authentication
- [ ] Migrate JWT storage from `localStorage` to `httpOnly; SameSite=Strict; Secure` cookies
- [ ] Implement refresh token rotation
- [ ] Add a Redis token denylist for logout and account compromise
- [ ] Consider RS256 (asymmetric) JWT for easier key rotation

### Rate Limiting
- [ ] Tighten auth endpoints to ~5 req / 60 s (brute force protection)
- [ ] Move rate limiting to the reverse proxy/CDN layer for DDoS protection

### Monitoring & Alerting
- [ ] Centralised structured logging (CloudWatch, Datadog, Loki)
- [ ] Alert on: repeated 403s from same IP, invalid webhook secret attempts, unusual AI token spend
- [ ] Enable PostgreSQL audit logging for sensitive tables

### Dependency Management
- [ ] Run `npm audit` in CI; fail on high/critical severity
- [ ] Enable Dependabot or Renovate for automated security patch PRs

### Medical Workspace Additional Requirements
- [ ] Access audit trail: log who reviewed and approved content in MEDICAL workspaces
- [ ] Consider requiring two-person review (four-eyes principle) for CLINICAL → APPROVED transitions
- [ ] Do not store any patient-identifiable information — enforce at infrastructure level with DLP scanning if needed
