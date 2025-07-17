const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@escola.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@escola.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Criar uma turma de exemplo
  const existingClass = await prisma.schoolClass.findFirst({
    where: { name: '10º A' }
  });

  let schoolClass;
  if (!existingClass) {
    schoolClass = await prisma.schoolClass.create({
      data: {
        name: '10º A',
        year: 10,
        shift: 'MORNING',
        capacity: 30,
      },
    });
  } else {
    schoolClass = existingClass;
  }

  console.log('✅ School class created:', schoolClass.name);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });