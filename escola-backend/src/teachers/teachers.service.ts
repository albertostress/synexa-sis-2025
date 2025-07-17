import { 
  BadRequestException,
  ConflictException, 
  Injectable, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherWithUser } from './entities/teacher.entity';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<TeacherWithUser> {
    const { userId, bio, qualification, specialization, experience } = createTeacherDto;

    // 1. Verificar se o usuário existe
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    // 2. Verificar se o usuário tem role PROFESSOR
    if (user.role !== 'PROFESSOR') {
      throw new BadRequestException('Apenas usuários com role PROFESSOR podem ser vinculados.');
    }

    // 3. Verificar se já existe um professor vinculado a este usuário
    const existing = await this.prisma.teacher.findUnique({ 
      where: { userId } 
    });

    if (existing) {
      throw new BadRequestException('Este usuário já está vinculado a um professor.');
    }

    // 4. Criar o professor
    const teacher = await this.prisma.teacher.create({
      data: {
        userId,
        bio: bio || null,
        qualification: qualification || null,
        specialization: specialization || null,
        experience: experience || null,
      },
      include: {
        user: true,
      },
    });

    return teacher as TeacherWithUser;
  }

  async findAll(): Promise<TeacherWithUser[]> {
    const teachers = await this.prisma.teacher.findMany({
      include: {
        user: true,
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
        user: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Professor não encontrado');
    }

    return teacher as TeacherWithUser;
  }

  async findByUserId(userId: string): Promise<TeacherWithUser | null> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    return teacher as TeacherWithUser | null;
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<TeacherWithUser> {
    const teacher = await this.findOne(id);
    
    const updateData: any = {};
    if (updateTeacherDto.bio !== undefined) {
      updateData.bio = updateTeacherDto.bio;
    }
    if (updateTeacherDto.qualification !== undefined) {
      updateData.qualification = updateTeacherDto.qualification;
    }
    if (updateTeacherDto.specialization !== undefined) {
      updateData.specialization = updateTeacherDto.specialization;
    }
    if (updateTeacherDto.experience !== undefined) {
      updateData.experience = updateTeacherDto.experience;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.teacher.update({
        where: { id },
        data: updateData,
      });
    }

    return await this.findOne(id);
  }

  async remove(id: string): Promise<TeacherWithUser> {
    await this.findOne(id);

    const teacher = await this.prisma.teacher.delete({
      where: { id },
      include: {
        user: true,
      },
    });

    return teacher as TeacherWithUser;
  }
}