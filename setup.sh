#!/bin/bash
# Setup script - run this manually in terminal
# chmod +x setup.sh && ./setup.sh

set -e

PGBIN="/Library/PostgreSQL/18/bin"
DB_URL="postgresql://postgres@localhost:5432/ai_marketing?schema=public"
REDIS_BIN="/tmp/redis-7.2.7/src"
PRISMA_BIN="node_modules/prisma/dist/prisma.js"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        AI Marketing SEO Assistant - Dev Setup        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Check PostgreSQL ────────────────────────────────────────────────────────
echo "▶ Checking PostgreSQL..."
if $PGBIN/pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo "  ✅ PostgreSQL is running on :5432"
else
  echo "  ⚠️  PostgreSQL is not running. Starting via launchd..."
  sudo launchctl load /Library/LaunchDaemons/postgresql-18.plist 2>/dev/null || true
  sleep 3
  $PGBIN/pg_isready -h localhost -p 5432 && echo "  ✅ PostgreSQL started" || echo "  ❌ Could not start PostgreSQL"
fi

# ── 2. Create database ─────────────────────────────────────────────────────────
echo ""
echo "▶ Creating database 'ai_marketing' if it doesn't exist..."
$PGBIN/psql -U postgres -h localhost -p 5432 -tc "SELECT 1 FROM pg_database WHERE datname = 'ai_marketing'" | grep -q 1 \
  && echo "  ✅ Database already exists" \
  || ($PGBIN/psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE ai_marketing;" && echo "  ✅ Database created")

# ── 3. Check Redis ─────────────────────────────────────────────────────────────
echo ""
echo "▶ Checking Redis..."
if $REDIS_BIN/redis-cli ping > /dev/null 2>&1; then
  echo "  ✅ Redis is running on :6379"
else
  echo "  ⚠️  Redis not running. Starting..."
  $REDIS_BIN/redis-server --daemonize yes --logfile /tmp/redis.log --port 6379
  sleep 1
  $REDIS_BIN/redis-cli ping && echo "  ✅ Redis started" || echo "  ❌ Could not start Redis"
fi

# ── 4. Push Prisma schema ─────────────────────────────────────────────────────
echo ""
echo "▶ Pushing Prisma schema to database..."
DATABASE_URL="$DB_URL" node $PRISMA_BIN db push --schema=packages/database/prisma/schema.prisma
echo "  ✅ Schema pushed"

# ── 5. Generate Prisma client ─────────────────────────────────────────────────
echo ""
echo "▶ Generating Prisma client..."
DATABASE_URL="$DB_URL" node $PRISMA_BIN generate --schema=packages/database/prisma/schema.prisma
echo "  ✅ Client generated"

# ── 6. Done ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Setup complete! Now start the app:               ║"
echo "║                                                      ║"
echo "║  Terminal 1 (API):                                   ║"
echo "║    cd apps/api && npm run start:dev                  ║"
echo "║                                                      ║"
echo "║  Terminal 2 (Frontend):                              ║"
echo "║    cd apps/web && npm run dev                        ║"
echo "║                                                      ║"
echo "║  URLs:                                               ║"
echo "║    Frontend:  http://localhost:3000                  ║"
echo "║    API:       http://localhost:3001                  ║"
echo "║    pgAdmin:   http://localhost:5050                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
