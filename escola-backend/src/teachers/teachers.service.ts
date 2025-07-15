/**
 * Teachers Service - Gerenciamento de professores
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { 
  ConflictException, 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Teacher } from '@prisma/client';
import { TeacherWithUser } from './entities/teacher.entity';

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<TeacherWithUser> {
    const { userId, bio } = createTeacherDto;

    // Verificar se usuário existe
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verificar se usuário tem role PROFESSOR
    const userWithPassword = await this.usersService.findByEmail(user.email);
    if (userWithPassword?.role !== 'PROFESSOR') {
      throw new BadRequestException('Usuário deve ter role PROFESSOR para ser cadastrado como professor');
    }

    // Verificar se já existe um professor para este usuário
    const existingTeacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (existingTeacher) {
      throw new ConflictException('Já existe um professor cadastrado para este usuário');
    }

    const teacher = await this.prisma.teacher.create({
      data: {
        userId,
        bio: bio || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return teacher as TeacherWithUser;
  }

  async findAll(): Promise<TeacherWithUser[]> {
    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return teachers as TeacherWithUser[];
  }

  async findOne(id: string): Promise<TeacherWithUser> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Professor com ID ${id} não encontrado`);
    }

    return teacher as TeacherWithUser;
  }

  async findByUserId(userId: string): Promise<TeacherWithUser | null> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return teacher as TeacherWithUser | null;
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<TeacherWithUser> {
    const teacher = await this.findOne(id);
    
    // Simple update without strict optional typing
    if (updateTeacherDto.bio !== undefined) {
      await this.prisma.teacher.update({
        where: { id },
        data: { bio: updateTeacherDto.bio },
      });
    }

    // Return updated teacher
    return await this.findOne(id);
  }

  async remove(id: string): Promise<TeacherWithUser> {
    await this.findOne(id);

    const teacher = await this.prisma.teacher.delete({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return teacher as TeacherWithUser;
  }
}