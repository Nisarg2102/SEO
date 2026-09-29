# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps — install ALL deps (including dev) for the monorepo build
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Install build tools for native addons (bcrypt, pg)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ai/package.json ./packages/ai/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY services/analytics/package.json ./services/analytics/
COPY services/research/package.json ./services/research/
COPY services/seo/package.json ./services/seo/
COPY services/social/package.json ./services/social/

RUN npm ci --workspace=api --include-workspace-root

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: builder — compile TypeScript for all workspace packages
# ─────────────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

# Copy source for all packages the API depends on
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY services/ ./services/
COPY apps/api/ ./apps/api/

# Build internal packages first, then the API
RUN npm run build --workspace=packages/ai        --if-present && \
    npm run build --workspace=packages/database  --if-present && \
    npm run build --workspace=packages/config    --if-present && \
    npm run build --workspace=packages/shared    --if-present && \
    npm run build --workspace=services/analytics --if-present && \
    npm run build --workspace=services/research  --if-present && \
    npm run build --workspace=services/seo       --if-present && \
    npm run build --workspace=services/social    --if-present && \
    npm run build --workspace=api

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: production-deps — prune to runtime-only node_modules
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production-deps
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ai/package.json ./packages/ai/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY services/analytics/package.json ./services/analytics/
COPY services/research/package.json ./services/research/
COPY services/seo/package.json ./services/seo/
COPY services/social/package.json ./services/social/

RUN npm ci --workspace=api --include-workspace-root --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: runner — minimal runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs

# Copy runtime node_modules (production-only)
COPY --from=production-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy compiled API dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json

# Copy compiled internal packages
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nestjs:nodejs /app/services ./services

# Copy Prisma schema (needed for migrations entrypoint)
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/prisma ./packages/database/prisma

# Copy entrypoint script
COPY --chown=nestjs:nodejs apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nestjs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Graceful shutdown: SIGTERM is forwarded to the Node process
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/main"]
