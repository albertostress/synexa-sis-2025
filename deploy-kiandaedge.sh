#!/bin/bash

# Deploy script for kiandaedge.online

echo "🚀 Deploying Synexa-SIS for kiandaedge.online"
echo "============================================="

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Use the kiandaedge specific files
echo "📋 Using kiandaedge configuration..."
cp .env.kiandaedge .env

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.kiandaedge.yml down

# Build and start with the kiandaedge config
echo "🔨 Building containers..."
docker-compose -f docker-compose.kiandaedge.yml build --no-cache

echo "🚀 Starting containers..."
docker-compose -f docker-compose.kiandaedge.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run migrations
echo "🗄️ Running database migrations..."
BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)
docker exec $BACKEND_CONTAINER npx prisma migrate deploy || echo "Migrations may have already run"

# Create test users
echo "👥 Creating test users..."
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
" || echo "Users may already exist"

# Check health
echo "🏥 Checking system health..."
curl -f https://api.kiandaedge.online/health || echo "API may still be starting..."

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Test users:"
echo "  admin@escola.com / admin123"
echo "  secretaria@escola.com / secretaria123"
echo "  professor@escola.com / professor123"
echo ""
echo "🌐 Access at:"
echo "  Frontend: https://escola.kiandaedge.online"
echo "  API: https://api.kiandaedge.online"
echo "  API Docs: https://api.kiandaedge.online/api"