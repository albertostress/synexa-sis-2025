import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student, Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Verificar se número de matrícula já existe
    const existingStudent = await this.prisma.student.findUnique({
      where: { studentNumber: createStudentDto.studentNumber },
    });

    if (existingStudent) {
      throw new ConflictException('Número de matrícula já existe');
    }

    // Verificar se a turma existe
    const classExists = await this.prisma.schoolClass.findUnique({
      where: { id: createStudentDto.classId },
    });

    if (!classExists) {
      throw new BadRequestException('Turma não encontrada');
    }
    
    try {
      return await this.prisma.student.create({
        data: {
          firstName: createStudentDto.firstName,
          lastName: createStudentDto.lastName,
          gender: createStudentDto.gender,
          birthDate: new Date(createStudentDto.birthDate),
          phone: createStudentDto.phone,
          bloodType: createStudentDto.bloodType,
          studentNumber: createStudentDto.studentNumber,
          academicYear: createStudentDto.academicYear,
          classId: createStudentDto.classId,
          profilePhotoUrl: createStudentDto.profilePhotoUrl,
          guardianName: createStudentDto.guardianName,
          guardianPhone: createStudentDto.guardianPhone,
          municipality: createStudentDto.municipality,
          province: createStudentDto.province,
          country: createStudentDto.country || 'Angola',
          parentEmail: createStudentDto.parentEmail,
          parentPhone: createStudentDto.parentPhone,
        },
        include: {
          schoolClass: {
            select: {
              id: true,
              name: true,
              year: true,
              shift: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Dados duplicados');
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<Student[]> {
    return await this.prisma.student.findMany({
      include: {
        schoolClass: {
          select: {
            id: true,
            name: true,
            year: true,
            shift: true,
          },
        },
      },
      orderBy: [
        { academicYear: 'desc' },
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        schoolClass: {
          select: {
            id: true,
            name: true,
            year: true,
            shift: true,
            capacity: true,
          },
        },
        enrollments: {
          orderBy: { year: 'desc' },
          take: 1,
        },
        invoices: {
          where: { status: 'PENDENTE' },
          select: {
            id: true,
            amount: true,
            dueDate: true,
            status: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${id} não encontrado`);
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    await this.findOne(id);

    // Verificar se número de matrícula já existe (se estiver sendo atualizado)
    if (updateStudentDto.studentNumber) {
      const existingStudent = await this.prisma.student.findUnique({
        where: { studentNumber: updateStudentDto.studentNumber },
      });

      if (existingStudent && existingStudent.id !== id) {
        throw new ConflictException('Número de matrícula já existe');
      }
    }

    // Verificar se a turma existe (se estiver sendo atualizada)
    if (updateStudentDto.classId) {
      const classExists = await this.prisma.schoolClass.findUnique({
        where: { id: updateStudentDto.classId },
      });

      if (!classExists) {
        throw new BadRequestException('Turma não encontrada');
      }
    }

    const updateData: Prisma.StudentUpdateInput = {};
    
    // Mapeamento automático dos campos do DTO
    Object.keys(updateStudentDto).forEach(key => {
      const value = updateStudentDto[key as keyof UpdateStudentDto];
      if (value !== undefined) {
        if (key === 'birthDate') {
          (updateData as any)[key] = new Date(value as any);
        } else {
          (updateData as any)[key] = value;
        }
      }
    });

    try {
      return await this.prisma.student.update({
        where: { id },
        data: updateData,
        include: {
          schoolClass: {
            select: {
              id: true,
              name: true,
              year: true,
              shift: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Dados duplicados');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Verificar se há dependências
    const [enrollments, grades, invoices, attendances] = await Promise.all([
      this.prisma.enrollment.count({ where: { studentId: id } }),
      this.prisma.grade.count({ where: { studentId: id } }),
      this.prisma.invoice.count({ where: { studentId: id } }),
      this.prisma.attendance.count({ where: { studentId: id } }),
    ]);

    if (enrollments > 0 || grades > 0 || invoices > 0 || attendances > 0) {
      throw new ConflictException(
        'Não é possível remover o aluno pois possui dependências (matrículas, notas, faturas ou presenças)'
      );
    }

    try {
      await this.prisma.student.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException('Aluno possui dependências e não pode ser removido');
        }
      }
      throw error;
    }
  }
}