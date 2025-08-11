// Script to create test users for Dokploy deployment
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔐 Creating test users for Dokploy deployment...');
  
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
      
      console.log(`✅ User ${userData.email} created/updated successfully`);
      console.log(`   Password: ${userData.password}`);
      
      // If it's a professor, create the teacher record
      if (userData.role === 'PROFESSOR') {
        const existingTeacher = await prisma.teacher.findUnique({
          where: { userId: user.id }
        });
        
        if (!existingTeacher) {
          await prisma.teacher.create({
            data: {
              userId: user.id,
              bio: `Professor(a) ${userData.name}`,
              qualification: 'Licenciatura',
              specialization: 'Educação',
              experience: 5
            }
          });
          console.log('   ↳ Teacher record created');
        }
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }
  
  console.log('\n📋 Test accounts ready:');
  console.log('   admin@escola.com / admin123');
  console.log('   secretaria@escola.com / secretaria123');
  console.log('   professor@escola.com / professor123');
  
  await prisma.$disconnect();
}

// Run the function
createTestUsers().catch(console.error);