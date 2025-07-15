/**
 * Subjects Service - Gerenciamento de disciplinas
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { 
  ConflictException, 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Subject, SubjectWithTeachers } from './entities/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<SubjectWithTeachers> {
    const { name, description, teacherIds } = createSubjectDto;

    // Verificar se já existe uma disciplina com esse nome
    const existingSubject = await this.prisma.subject.findFirst({
      where: { name },
    });

    if (existingSubject) {
      throw new ConflictException('Já existe uma disciplina com este nome');
    }

    // Se teacherIds foram fornecidos, verificar se todos os professores existem
    if (teacherIds && teacherIds.length > 0) {
      const teachers = await this.prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
      });

      if (teachers.length !== teacherIds.length) {
        throw new BadRequestException('Um ou mais professores não foram encontrados');
      }
    }

    const subject = await this.prisma.subject.create({
      data: {
        name,
        description: description || null,
        teachers: teacherIds && teacherIds.length > 0 
          ? { connect: teacherIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        teachers: {
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
        },
      },
    });

    return subject as SubjectWithTeachers;
  }

  async findAll(): Promise<SubjectWithTeachers[]> {
    const subjects = await this.prisma.subject.findMany({
      include: {
        teachers: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subjects as SubjectWithTeachers[];
  }

  async findOne(id: string): Promise<SubjectWithTeachers> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teachers: {
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
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Disciplina com ID ${id} não encontrada`);
    }

    return subject as SubjectWithTeachers;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<SubjectWithTeachers> {
    await this.findOne(id); // Verificar se existe

    const { name, description, teacherIds } = updateSubjectDto;

    // Se name foi fornecido, verificar se já existe outra disciplina com esse nome
    if (name) {
      const existingSubject = await this.prisma.subject.findFirst({
        where: { 
          name,
          NOT: { id }, // Excluir a disciplina atual da verificação
        },
      });

      if (existingSubject) {
        throw new ConflictException('Já existe uma disciplina com este nome');
      }
    }

    // Se teacherIds foram fornecidos, verificar se todos os professores existem
    if (teacherIds && teacherIds.length > 0) {
      const teachers = await this.prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
      });

      if (teachers.length !== teacherIds.length) {
        throw new BadRequestException('Um ou mais professores não foram encontrados');
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }

    // Atualizar relacionamentos com professores se fornecidos
    if (teacherIds !== undefined) {
      // Primeiro desconectar todos os professores existentes
      await this.prisma.subject.update({
        where: { id },
        data: {
          teachers: {
            set: [], // Remove todas as conexões existentes
          },
        },
      });

      // Depois conectar os novos professores (se houver)
      if (teacherIds.length > 0) {
        updateData.teachers = {
          connect: teacherIds.map(teacherId => ({ id: teacherId })),
        };
      }
    }

    const subject = await this.prisma.subject.update({
      where: { id },
      data: updateData,
      include: {
        teachers: {
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
        },
      },
    });

    return subject as SubjectWithTeachers;
  }

  async remove(id: string): Promise<SubjectWithTeachers> {
    await this.findOne(id); // Verificar se existe

    const subject = await this.prisma.subject.delete({
      where: { id },
      include: {
        teachers: {
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
        },
      },
    });

    return subject as SubjectWithTeachers;
  }

  async findSubjectsByTeacher(teacherId: string): Promise<Subject[]> {
    const subjects = await this.prisma.subject.findMany({
      where: {
        teachers: {
          some: {
            id: teacherId,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return subjects as Subject[];
  }
}