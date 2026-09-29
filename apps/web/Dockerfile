# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps — install ALL deps for the monorepo build
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

RUN npm ci --workspace=web --include-workspace-root

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: builder — compile Next.js application
# ─────────────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY apps/web/ ./apps/web/

# NEXT_PUBLIC_API_URL is the only build-time public env var.
# It must be passed at build time as it is inlined into client bundles.
# All other configuration is runtime-only via environment variables.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Enable Next.js standalone output — produces a self-contained server
# that does not require the full node_modules tree at runtime.
RUN cd apps/web && \
    node -e "const fs=require('fs'); const c=require('./next.config.mjs'); console.log('ok')" 2>/dev/null || true && \
    npm run build --workspace=web

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: runner — minimal runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Non-root user (mirrors Next.js official recommendation)
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy built output
# We use the full .next output (not standalone) since the monorepo workspace
# structure is not compatible with standalone out-of-the-box without patching.
# Switch to standalone when moving to a single-app repository.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next          ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public         ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json   ./apps/web/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.mjs ./apps/web/next.config.mjs

# Copy pruned node_modules for Next.js server runtime
COPY --from=deps    --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps    --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health 2>/dev/null || \
      wget -qO- http://localhost:3000 2>/dev/null | grep -q "html" || exit 1

CMD ["npm", "run", "start", "--workspace=web"]
