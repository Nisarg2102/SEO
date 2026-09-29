#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# API Docker Entrypoint
# Runs database migrations before starting the application.
# Exits non-zero on migration failure so the container restarts and does not
# serve traffic against a stale schema.
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "[entrypoint] Starting AI Marketing API..."
echo "[entrypoint] NODE_ENV=$NODE_ENV"

# ── Database migration ────────────────────────────────────────────────────────
# prisma migrate deploy is idempotent and safe to run on every startup.
# It applies only pending migrations; it never rolls back applied ones.
if [ -z "$SKIP_MIGRATIONS" ]; then
  echo "[entrypoint] Running database migrations..."
  cd /app/packages/database
  npx prisma migrate deploy
  cd /app
  echo "[entrypoint] Migrations complete."
else
  echo "[entrypoint] Skipping migrations (SKIP_MIGRATIONS is set)."
fi

# ── Hand off to the main process ─────────────────────────────────────────────
exec "$@"
