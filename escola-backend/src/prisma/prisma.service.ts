import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://escola_user:uma_senha_forte@postgres:5432/escola_db'
        }
      },
      log: ['error', 'warn'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      console.log('🗄️  Prisma conectado ao banco de dados');
      console.log('📊 Database URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@') || 'Using default');
    } catch (error) {
      console.error('❌ Erro ao conectar ao banco de dados:', error);
      console.error('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@'));
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    console.log('🗄️  Prisma desconectado do banco de dados');
  }
}