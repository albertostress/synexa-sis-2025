// Script para criar usuário admin
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@escola.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  
  console.log('🔑 Criando usuário administrador...');
  
  try {
    // Verificar se já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  Usuário já existe. Atualizando senha...');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });
      
      console.log('✅ Senha atualizada para:', updatedUser.email);
    } else {
      // Criar novo usuário
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const admin = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN',
          isActive: true
        }
      });
      
      console.log('✅ Admin criado com sucesso:', admin.email);
    }
    
    console.log('\n📝 Credenciais:');
    console.log('Email:', email);
    console.log('Senha:', password);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();