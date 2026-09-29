#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# migrate.sh — Run Prisma migrations against the production database
#
# Use this to run migrations manually before a deployment, or to roll
# back by connecting to the database directly.
#
# Usage:
#   DATABASE_URL="postgresql://..." ./infrastructure/scripts/migrate.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is required"
  exit 1
fi

echo "Running Prisma migrations against: $(echo $DATABASE_URL | sed 's/:\/\/[^@]*@/:\\/\\/*****@/')"

cd "$(dirname "$0")/../../packages/database"

npx prisma migrate deploy

echo "Migrations complete."
