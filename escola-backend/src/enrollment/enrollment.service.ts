/**
 * Enrollment Service - Gerenciamento de matrículas
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { 
  ConflictException, 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Enrollment, EnrollmentWithRelations } from './entities/enrollment.entity';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<EnrollmentWithRelations> {
    const { studentId, classId, year, status } = createEnrollmentDto;

    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }

    // Verificar se a turma existe
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      throw new NotFoundException(`Turma com ID ${classId} não encontrada`);
    }

    // Verificar se o aluno já possui matrícula ativa no mesmo ano
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        year,
        status: 'ACTIVE',
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Aluno já possui matrícula ativa neste ano letivo');
    }

    // Verificar capacidade da turma se status for ACTIVE
    if (status === 'ACTIVE') {
      const activeEnrollments = await this.prisma.enrollment.count({
        where: {
          classId,
          status: 'ACTIVE',
        },
      });

      if (activeEnrollments >= schoolClass.capacity) {
        throw new BadRequestException('Turma já atingiu a capacidade máxima');
      }
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId,
        classId,
        year,
        status,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            birthDate: true,
            createdAt: true,
          },
        },
        class: true,
      },
    });

    return enrollment as EnrollmentWithRelations;
  }

  async findAll(): Promise<EnrollmentWithRelations[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            birthDate: true,
            createdAt: true,
          },
        },
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments as EnrollmentWithRelations[];
  }

  async findOne(id: string): Promise<EnrollmentWithRelations> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            birthDate: true,
            createdAt: true,
          },
        },
        class: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Matrícula com ID ${id} não encontrada`);
    }

    return enrollment as EnrollmentWithRelations;
  }

  async findByStudent(studentId: string): Promise<EnrollmentWithRelations[]> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            birthDate: true,
            createdAt: true,
          },
        },
        class: true,
      },
      orderBy: {
        year: 'desc',
      },
    });

    return enrollments as EnrollmentWithRelations[];
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto): Promise<EnrollmentWithRelations> {
    const enrollment = await this.findOne(id);
    const { status, classId } = updateEnrollmentDto;

    // Preparar dados para atualização
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (classId !== undefined) {
      // Verificar se a nova turma existe
      const newClass = await this.prisma.schoolClass.findUnique({
        where: { id: classId },
      });

      if (!newClass) {
        throw new NotFoundException(`Turma com ID ${classId} não encontrada`);
      }

      // Se mudando para status ACTIVE, verificar capacidade da nova turma
      const targetStatus = status || enrollment.status;
      if (targetStatus === 'ACTIVE') {
        const activeEnrollments = await this.prisma.enrollment.count({
          where: {
            classId,
            status: 'ACTIVE',
            NOT: { id }, // Excluir a matrícula atual
          },
        });

        if (activeEnrollments >= newClass.capacity) {
          throw new BadRequestException('Turma já atingiu a capacidade máxima');
        }
      }

      updateData.classId = classId;
    }

    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            birthDate: true,
            createdAt: true,
          },
        },
        class: true,
      },
    });

    return updatedEnrollment as EnrollmentWithRelations;
  }

  async remove(id: string): Promise<EnrollmentWithRelations> {
    const enrollment = await this.findOne(id);

    // Em vez de deletar, cancelar a matrícula
    const cancelledEnrollment = await this.prisma.enrollment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            birthDate: true,
            createdAt: true,
          },
        },
        class: true,
      },
    });

    return cancelledEnrollment as EnrollmentWithRelations;
  }

  async findByYear(year: number): Promise<EnrollmentWithRelations[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { year },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            birthDate: true,
            createdAt: true,
          },
        },
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments as EnrollmentWithRelations[];
  }

  async findByClass(classId: string): Promise<EnrollmentWithRelations[]> {
    // Verificar se a turma existe
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      throw new NotFoundException(`Turma com ID ${classId} não encontrada`);
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            birthDate: true,
            createdAt: true,
          },
        },
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments as EnrollmentWithRelations[];
  }
}