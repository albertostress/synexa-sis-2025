#!/bin/sh

echo "🚀 Starting application initialization..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U ${DB_USER:-escola_user} -d ${DB_NAME:-escola_db}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Try to run migrations
echo "🗄️ Running Prisma migrations..."
npx prisma migrate deploy 2>/dev/null || {
  echo "⚠️ Migrations failed, trying db push..."
  npx prisma db push --accept-data-loss
}

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the application
echo "🎯 Starting NestJS application..."
if [ -f "dist/main.js" ]; then
  echo "Running production build..."
  node dist/main.js
else
  echo "No production build found, running in development mode..."
  npm run start
fi