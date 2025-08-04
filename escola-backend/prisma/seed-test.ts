import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Criar usuário de teste
  const testPassword = await bcrypt.hash('teste123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'teste@escola.com' },
    update: {
      password: testPassword,
    },
    create: {
      email: 'teste@escola.com',
      name: 'Usuário Teste',
      role: 'ADMIN',
      password: testPassword,
    },
  });

  console.log('Usuário teste criado:', testUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });