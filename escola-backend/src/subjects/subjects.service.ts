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
    const { 
      name, 
      description, 
      code, 
      year, 
      category, 
      credits, 
      workloadHours, 
      isActive = true, 
      teacherIds 
    } = createSubjectDto;

    // Verificar se já existe uma disciplina com esse nome ou código
    const existingSubject = await this.prisma.subject.findFirst({
      where: { 
        OR: [
          { name },
          { code }
        ]
      },
    });

    if (existingSubject) {
      if (existingSubject.name === name) {
        throw new ConflictException('Já existe uma disciplina com este nome');
      }
      if (existingSubject.code === code) {
        throw new ConflictException('Já existe uma disciplina com este código');
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

    // Converter categoria do enum
    const prismaCategory = category === 'Obrigatória' ? 'OBRIGATORIA' : 'OPCIONAL';

    const subject = await this.prisma.subject.create({
      data: {
        name,
        description: description || null,
        code,
        year,
        category: prismaCategory as any,
        credits,
        workloadHours,
        isActive,
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

    // Converter categoria do banco para o frontend
    const formattedSubject = {
      ...subject,
      category: subject.category === 'OBRIGATORIA' ? 'Obrigatória' : 'Opcional',
    };

    return formattedSubject as SubjectWithTeachers;
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
      orderBy: [
        { year: 'asc' },
        { name: 'asc' },
      ],
    });

    // Converter categorias do banco para o frontend
    const formattedSubjects = subjects.map(subject => ({
      ...subject,
      category: subject.category === 'OBRIGATORIA' ? 'Obrigatória' : 'Opcional',
    }));

    return formattedSubjects as SubjectWithTeachers[];
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

    // Converter categoria do banco para o frontend
    const formattedSubject = {
      ...subject,
      category: subject.category === 'OBRIGATORIA' ? 'Obrigatória' : 'Opcional',
    };

    return formattedSubject as SubjectWithTeachers;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<SubjectWithTeachers> {
    await this.findOne(id); // Verificar se existe

    const { 
      name, 
      description, 
      code, 
      year, 
      category, 
      credits, 
      workloadHours, 
      isActive, 
      teacherIds 
    } = updateSubjectDto;

    // Se name ou code foram fornecidos, verificar se já existe outra disciplina com esses valores
    if (name || code) {
      const whereConditions = [];
      if (name) whereConditions.push({ name });
      if (code) whereConditions.push({ code });

      const existingSubject = await this.prisma.subject.findFirst({
        where: { 
          OR: whereConditions,
          NOT: { id }, // Excluir a disciplina atual da verificação
        },
      });

      if (existingSubject) {
        if (existingSubject.name === name) {
          throw new ConflictException('Já existe uma disciplina com este nome');
        }
        if (existingSubject.code === code) {
          throw new ConflictException('Já existe uma disciplina com este código');
        }
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

    if (code !== undefined) {
      updateData.code = code;
    }

    if (year !== undefined) {
      updateData.year = year;
    }

    if (category !== undefined) {
      const prismaCategory = category === 'Obrigatória' ? 'OBRIGATORIA' : 'OPCIONAL';
      updateData.category = prismaCategory;
    }

    if (credits !== undefined) {
      updateData.credits = credits;
    }

    if (workloadHours !== undefined) {
      updateData.workloadHours = workloadHours;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
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

    // Converter categoria do banco para o frontend
    const formattedSubject = {
      ...subject,
      category: subject.category === 'OBRIGATORIA' ? 'Obrigatória' : 'Opcional',
    };

    return formattedSubject as SubjectWithTeachers;
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