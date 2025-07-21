import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetSecretariaPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'secretaria@escola.com' }
    });

    if (!user) {
      console.log('❌ Usuário SECRETARIA não encontrado!');
      return;
    }

    // Resetar senha
    const hashedPassword = await bcrypt.hash('secretaria123', 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log('✅ Senha do usuário SECRETARIA resetada com sucesso!');
    console.log('\n📝 Credenciais para login:');
    console.log('Email: secretaria@escola.com');
    console.log('Senha: secretaria123');
    console.log('Role:', user.role);

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSecretariaPassword();