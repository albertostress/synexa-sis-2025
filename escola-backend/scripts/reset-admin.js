const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const result = await prisma.user.update({
      where: { email: 'admin@escola.com' },
      data: { password: hashedPassword }
    });
    
    console.log('Admin password reset successfully to: admin123');
    console.log('User:', result.email, 'Role:', result.role);
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();