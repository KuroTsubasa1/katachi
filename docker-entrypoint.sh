#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Wait for database to be ready
until PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c '\q' 2>/dev/null; do
  echo "⏳ Waiting for database to be ready..."
  sleep 2
done

echo "✅ Database is ready"

# Run migrations
npm run db:push || {
  echo "⚠️  Migration failed, but continuing..."
}

echo "🚀 Starting application..."
exec node .output/server/index.mjs
