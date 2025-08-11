#!/bin/bash

echo "🚀 Initializing Dokploy deployment..."

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL..."
sleep 10

# Find the backend container
BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)
echo "📦 Backend container: $BACKEND_CONTAINER"

# Run Prisma migrations
echo "🗄️ Running database migrations..."
docker exec $BACKEND_CONTAINER npx prisma migrate deploy || {
    echo "⚠️ Migrations failed, trying to push schema..."
    docker exec $BACKEND_CONTAINER npx prisma db push
}

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker exec $BACKEND_CONTAINER npx prisma generate

# Create test users
echo "👥 Creating test users..."
docker exec $BACKEND_CONTAINER node scripts/create-dokploy-users.js || {
    echo "⚠️ User creation script failed, trying inline..."
    docker exec $BACKEND_CONTAINER node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUsers() {
  const users = [
    { email: 'admin@escola.com', password: 'admin123', name: 'Administrador', role: 'ADMIN' },
    { email: 'secretaria@escola.com', password: 'secretaria123', name: 'Secretária', role: 'SECRETARIA' },
    { email: 'professor@escola.com', password: 'professor123', name: 'Professor', role: 'PROFESSOR' }
  ];

  for (const userData of users) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await prisma.user.upsert({
        where: { email: userData.email },
        update: { password: hashedPassword },
        create: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role
        }
      });
      console.log('✅ User created/updated:', userData.email);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  await prisma.\$disconnect();
}

createUsers();
"
}

echo "✅ Initialization complete!"
echo ""
echo "📋 Test accounts:"
echo "   admin@escola.com / admin123"
echo "   secretaria@escola.com / secretaria123"
echo "   professor@escola.com / professor123"