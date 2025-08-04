const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestClass() {
  try {
    const testClass = await prisma.schoolClass.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Turma 1A',
        year: 1,
        shift: 'MORNING',
        capacity: 30
      }
    });
    
    console.log('Test class created:', testClass);
  } catch (error) {
    console.error('Error creating test class:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClass();