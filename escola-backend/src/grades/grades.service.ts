/**
 * Grades Service - Gerenciamento de notas
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { 
  ConflictException, 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { Grade, GradeWithRelations } from './entities/grade.entity';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGradeDto: CreateGradeDto, currentUserId: string): Promise<GradeWithRelations> {
    const { studentId, subjectId, teacherId, classId, year, value } = createGradeDto;

    // Verificar se o professor existe e pertence ao usuário logado
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Professor com ID ${teacherId} não encontrado`);
    }

    if (teacher.userId !== currentUserId) {
      throw new ForbiddenException('Você só pode lançar notas como o professor associado ao seu usuário');
    }

    // Verificar se o professor ministra a disciplina
    const teacherSubject = await this.prisma.teacher.findFirst({
      where: {
        id: teacherId,
        subjects: {
          some: { id: subjectId },
        },
      },
    });

    if (!teacherSubject) {
      throw new ForbiddenException('Professor não ministra esta disciplina');
    }

    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }

    // Verificar se a disciplina existe
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Disciplina com ID ${subjectId} não encontrada`);
    }

    // Verificar se a turma existe
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      throw new NotFoundException(`Turma com ID ${classId} não encontrada`);
    }

    // Verificar se o aluno está matriculado na turma no ano especificado
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        classId,
        year,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new BadRequestException('Aluno não está matriculado nesta turma no ano especificado');
    }

    // Verificar se já existe uma nota para este aluno/disciplina/professor/turma/ano
    const existingGrade = await this.prisma.grade.findFirst({
      where: {
        studentId,
        subjectId,
        teacherId,
        classId,
        year,
      },
    });

    if (existingGrade) {
      throw new ConflictException('Já existe uma nota lançada para este aluno nesta disciplina');
    }

    const grade = await this.prisma.grade.create({
      data: {
        studentId,
        subjectId,
        teacherId,
        classId,
        year,
        value,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
        subject: true,
        teacher: {
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
        class: true,
      },
    });

    return grade as GradeWithRelations;
  }

  async findAll(): Promise<GradeWithRelations[]> {
    const grades = await this.prisma.grade.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
        subject: true,
        teacher: {
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
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return grades as GradeWithRelations[];
  }

  async findOne(id: string): Promise<GradeWithRelations> {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
        subject: true,
        teacher: {
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
        class: true,
      },
    });

    if (!grade) {
      throw new NotFoundException(`Nota com ID ${id} não encontrada`);
    }

    return grade as GradeWithRelations;
  }

  async findByStudent(studentId: string): Promise<GradeWithRelations[]> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }

    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
        subject: true,
        teacher: {
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
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return grades as GradeWithRelations[];
  }

  async findByClass(classId: string): Promise<GradeWithRelations[]> {
    // Verificar se a turma existe
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      throw new NotFoundException(`Turma com ID ${classId} não encontrada`);
    }

    const grades = await this.prisma.grade.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
        subject: true,
        teacher: {
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
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return grades as GradeWithRelations[];
  }

  async findBySubject(subjectId: string): Promise<GradeWithRelations[]> {
    // Verificar se a disciplina existe
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Disciplina com ID ${subjectId} não encontrada`);
    }

    const grades = await this.prisma.grade.findMany({
      where: { subjectId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
        subject: true,
        teacher: {
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
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return grades as GradeWithRelations[];
  }

  async update(id: string, updateGradeDto: UpdateGradeDto, currentUserId: string): Promise<GradeWithRelations> {
    const grade = await this.findOne(id);

    // Verificar se o professor que está atualizando é o mesmo que lançou a nota
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: grade.teacherId },
    });

    if (!teacher || teacher.userId !== currentUserId) {
      throw new ForbiddenException('Você só pode atualizar notas que você mesmo lançou');
    }

    const updatedGrade = await this.prisma.grade.update({
      where: { id },
      data: { value: updateGradeDto.value },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
        subject: true,
        teacher: {
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
        class: true,
      },
    });

    return updatedGrade as GradeWithRelations;
  }

  async remove(id: string, currentUserId: string): Promise<GradeWithRelations> {
    const grade = await this.findOne(id);

    // Verificar se o professor que está removendo é o mesmo que lançou a nota
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: grade.teacherId },
    });

    if (!teacher || teacher.userId !== currentUserId) {
      throw new ForbiddenException('Você só pode remover notas que você mesmo lançou');
    }

    const deletedGrade = await this.prisma.grade.delete({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            createdAt: true,
          },
        },
        subject: true,
        teacher: {
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
        class: true,
      },
    });

    return deletedGrade as GradeWithRelations;
  }
}