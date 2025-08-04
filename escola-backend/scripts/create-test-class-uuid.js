const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestClass() {
  try {
    const testClass = await prisma.schoolClass.create({
      data: {
        id: '30c50d4a-50e1-4f0c-b101-b5dba8cc8c2e',
        name: 'Turma Test BI',
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