/**
 * Classes Service - Gerenciamento de turmas
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { 
  ConflictException, 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { SchoolClass, SchoolClassWithRelations } from './entities/class.entity';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto): Promise<SchoolClassWithRelations> {
    const { name, year, shift, capacity, studentIds, teacherIds } = createClassDto;

    // Verificar se já existe uma turma com esse nome no mesmo ano
    const existingClass = await this.prisma.schoolClass.findFirst({
      where: { 
        name,
        year,
      },
    });

    if (existingClass) {
      throw new ConflictException('Já existe uma turma com este nome no mesmo ano');
    }

    // Verificar se a capacidade é adequada para a quantidade de alunos
    if (studentIds && studentIds.length > capacity) {
      throw new BadRequestException('Número de alunos excede a capacidade da turma');
    }

    // Se studentIds foram fornecidos, verificar se todos os alunos existem e estão disponíveis
    if (studentIds && studentIds.length > 0) {
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds } },
      });

      if (students.length !== studentIds.length) {
        throw new BadRequestException('Um ou mais alunos não foram encontrados');
      }

      // Verificar se algum aluno já está em outra turma
      const studentsInOtherClasses = students.filter(student => student.classId !== null);
      if (studentsInOtherClasses.length > 0) {
        throw new BadRequestException('Um ou mais alunos já estão matriculados em outra turma');
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

    const schoolClass = await this.prisma.schoolClass.create({
      data: {
        name,
        year,
        shift,
        capacity,
        students: studentIds && studentIds.length > 0 
          ? { connect: studentIds.map(id => ({ id })) }
          : undefined,
        teachers: teacherIds && teacherIds.length > 0 
          ? { connect: teacherIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
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

    return schoolClass as SchoolClassWithRelations;
  }

  async findAll(): Promise<SchoolClassWithRelations[]> {
    const schoolClasses = await this.prisma.schoolClass.findMany({
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
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
        year: 'desc',
      },
    });

    return schoolClasses as SchoolClassWithRelations[];
  }

  async findOne(id: string): Promise<SchoolClassWithRelations> {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
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

    if (!schoolClass) {
      throw new NotFoundException(`Turma com ID ${id} não encontrada`);
    }

    return schoolClass as SchoolClassWithRelations;
  }

  async update(id: string, updateClassDto: UpdateClassDto): Promise<SchoolClassWithRelations> {
    await this.findOne(id); // Verificar se existe

    const { name, year, capacity, studentIds, teacherIds } = updateClassDto;

    // Se name e year foram fornecidos, verificar se já existe outra turma com esse nome no mesmo ano
    if (name && year) {
      const existingClass = await this.prisma.schoolClass.findFirst({
        where: { 
          name,
          year,
          NOT: { id }, // Excluir a turma atual da verificação
        },
      });

      if (existingClass) {
        throw new ConflictException('Já existe uma turma com este nome no mesmo ano');
      }
    }

    // Verificar capacidade se fornecida
    if (capacity && studentIds && studentIds.length > capacity) {
      throw new BadRequestException('Número de alunos excede a capacidade da turma');
    }

    // Se studentIds foram fornecidos, verificar se todos os alunos existem e estão disponíveis
    if (studentIds && studentIds.length > 0) {
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds } },
      });

      if (students.length !== studentIds.length) {
        throw new BadRequestException('Um ou mais alunos não foram encontrados');
      }

      // Verificar se algum aluno já está em outra turma (exceto a atual)
      const studentsInOtherClasses = students.filter(
        student => student.classId !== null && student.classId !== id
      );
      if (studentsInOtherClasses.length > 0) {
        throw new BadRequestException('Um ou mais alunos já estão matriculados em outra turma');
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
    
    if (name !== undefined) updateData.name = name;
    if (updateClassDto.year !== undefined) updateData.year = updateClassDto.year;
    if (updateClassDto.shift !== undefined) updateData.shift = updateClassDto.shift;
    if (capacity !== undefined) updateData.capacity = capacity;

    // Atualizar relacionamentos se fornecidos
    if (studentIds !== undefined) {
      // Primeiro desmatricular todos os alunos da turma
      await this.prisma.student.updateMany({
        where: { classId: id },
        data: { classId: '' },
      });

      // Depois matricular os novos alunos (se houver)
      if (studentIds.length > 0) {
        await this.prisma.student.updateMany({
          where: { id: { in: studentIds } },
          data: { classId: id },
        });
      }
    }

    if (teacherIds !== undefined) {
      // Primeiro desconectar todos os professores existentes
      await this.prisma.schoolClass.update({
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

    const schoolClass = await this.prisma.schoolClass.update({
      where: { id },
      data: updateData,
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
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

    return schoolClass as SchoolClassWithRelations;
  }

  async remove(id: string): Promise<SchoolClassWithRelations> {
    await this.findOne(id); // Verificar se existe

    // Primeiro desmatricular todos os alunos da turma
    await this.prisma.student.updateMany({
      where: { classId: id },
      data: { classId: '' },
    });

    const schoolClass = await this.prisma.schoolClass.delete({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
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

    return schoolClass as SchoolClassWithRelations;
  }

  async findClassesByYear(year: number): Promise<SchoolClass[]> {
    const schoolClasses = await this.prisma.schoolClass.findMany({
      where: { year },
      orderBy: {
        name: 'asc',
      },
    });

    return schoolClasses as SchoolClass[];
  }

  async checkAvailability(id: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
    });

    if (!schoolClass) {
      throw new NotFoundException(`Turma com ID ${id} não encontrada`);
    }

    // Contar matrículas ativas na turma
    const activeEnrollments = await this.prisma.enrollment.count({
      where: {
        classId: id,
        status: 'ACTIVE',
      },
    });

    const available = schoolClass.capacity - activeEnrollments;
    
    return {
      capacity: schoolClass.capacity,
      enrolled: activeEnrollments,
      available: available,
      isFull: available <= 0,
    };
  }
}