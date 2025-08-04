const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const result = await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@escola.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('Admin user created successfully:');
    console.log('Email:', result.email);
    console.log('Password: admin123');
    console.log('Role:', result.role);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();