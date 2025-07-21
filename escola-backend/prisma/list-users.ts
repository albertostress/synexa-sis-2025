import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 USUÁRIOS NO SISTEMA:\n');
    console.log('Total:', users.length, 'usuários\n');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Sem nome'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
      console.log('   ---');
    });

    // Contar por role
    const roleCount = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 DISTRIBUIÇÃO POR ROLE:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} usuário(s)`);
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();