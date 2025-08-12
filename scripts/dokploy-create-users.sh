#!/bin/bash

# Script to create test users in Dokploy deployment
# Run this after the backend container is running

echo "🚀 Creating test users for Dokploy deployment..."

# Find the backend container
BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "escola-backend|backend" | head -n1)

if [ -z "$BACKEND_CONTAINER" ]; then
  echo "❌ Backend container not found!"
  echo "Make sure the application is deployed and running."
  exit 1
fi

echo "📦 Using container: $BACKEND_CONTAINER"

# Create users using Node.js script inline
docker exec $BACKEND_CONTAINER node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://escola_user:uma_senha_forte@postgres:5432/escola_db'
    }
  }
});

async function createUsers() {
  console.log('Creating test users...');
  
  const users = [
    {
      email: 'admin@escola.com',
      password: 'admin123',
      name: 'Administrador',
      role: 'ADMIN'
    },
    {
      email: 'secretaria@escola.com',
      password: 'secretaria123',
      name: 'Secretária',
      role: 'SECRETARIA'
    },
    {
      email: 'professor@escola.com',
      password: 'professor123',
      name: 'Professor',
      role: 'PROFESSOR'
    }
  ];

  for (const userData of users) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          password: hashedPassword,
          name: userData.name,
          role: userData.role
        },
        create: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role
        }
      });
      
      console.log('✅ User created/updated:', userData.email);
      
      // Create teacher record if needed
      if (userData.role === 'PROFESSOR') {
        const existingTeacher = await prisma.teacher.findUnique({
          where: { userId: user.id }
        });
        
        if (!existingTeacher) {
          await prisma.teacher.create({
            data: {
              userId: user.id,
              bio: 'Professor do Sistema',
              qualification: 'Licenciatura',
              specialization: 'Educação',
              experience: 5
            }
          });
          console.log('   ↳ Teacher record created');
        }
      }
    } catch (error) {
      console.error('Error creating user', userData.email, ':', error.message);
    }
  }
  
  await prisma.\$disconnect();
  console.log('\\n✅ All users created!');
}

createUsers().catch(console.error);
"

echo ""
echo "✅ User creation complete!"
echo ""
echo "📋 Test accounts:"
echo "   Email: admin@escola.com"
echo "   Password: admin123"
echo ""
echo "   Email: secretaria@escola.com"
echo "   Password: secretaria123"
echo ""
echo "   Email: professor@escola.com"
echo "   Password: professor123"
echo ""
echo "🌐 Access the application at:"
echo "   https://escola.kiandaedge.online"