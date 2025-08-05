/**
 * Users Service - Gerenciamento de usuários
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { name, email, password, role } = createUserDto;

    // Verificar se email já existe
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    // 🎯 MELHORIA 1: Criar Professor automaticamente se role === PROFESSOR
    if (role === Role.PROFESSOR) {
      // Verificar se já existe um professor para este usuário (prevenção de duplicação)
      const existingTeacher = await this.prisma.teacher.findUnique({
        where: { userId: user.id }
      });

      if (!existingTeacher) {
        await this.prisma.teacher.create({
          data: {
            userId: user.id,
            // Usar dados do User para preencher campos correspondentes
            bio: `Professor(a) ${name}`,
            qualification: 'A definir',
            specialization: 'A definir',
            experience: 0
          }
        });
      }
    }

    // Retornar sem a senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remover senhas antes de retornar
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateData: Partial<CreateUserDto>): Promise<Omit<User, 'password'>> {
    await this.findOne(id);

    const dataToUpdate: Record<string, unknown> = {};

    if (updateData.name !== undefined) {
      dataToUpdate.name = updateData.name;
    }

    if (updateData.email !== undefined) {
      // Verificar se novo email já existe
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email já cadastrado');
      }
      dataToUpdate.email = updateData.email;
    }

    if (updateData.password !== undefined) {
      dataToUpdate.password = await bcrypt.hash(updateData.password, 10);
    }

    if (updateData.role !== undefined) {
      dataToUpdate.role = updateData.role;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    // 🎯 MELHORIA 1: Criar Professor automaticamente se role mudou para PROFESSOR
    if (updateData.role === Role.PROFESSOR) {
      const existingTeacher = await this.prisma.teacher.findUnique({
        where: { userId: id }
      });

      if (!existingTeacher) {
        await this.prisma.teacher.create({
          data: {
            userId: id,
            bio: `Professor(a) ${user.name}`,
            qualification: 'A definir',
            specialization: 'A definir',
            experience: 0
          }
        });
      }
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async remove(id: string): Promise<Omit<User, 'password'>> {
    await this.findOne(id);

    const user = await this.prisma.user.delete({
      where: { id },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}