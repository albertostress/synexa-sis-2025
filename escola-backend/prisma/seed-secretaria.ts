import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedSecretaria() {
  try {
    // Verificar se já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'secretaria@escola.com' }
    });

    if (existingUser) {
      console.log('✅ Usuário SECRETARIA já existe:', {
        email: existingUser.email,
        role: existingUser.role
      });
      return;
    }

    // Criar novo usuário SECRETARIA
    const hashedPassword = await bcrypt.hash('secretaria123', 10);
    
    const secretariaUser = await prisma.user.create({
      data: {
        email: 'secretaria@escola.com',
        password: hashedPassword,
        name: 'Secretaria Teste',
        role: 'SECRETARIA'
      }
    });

    console.log('✅ Usuário SECRETARIA criado com sucesso:', {
      id: secretariaUser.id,
      email: secretariaUser.email,
      name: secretariaUser.name,
      role: secretariaUser.role
    });

    console.log('\n📝 Credenciais para login:');
    console.log('Email: secretaria@escola.com');
    console.log('Senha: secretaria123');
    console.log('Role: SECRETARIA');

  } catch (error) {
    console.error('❌ Erro ao criar usuário SECRETARIA:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSecretaria();