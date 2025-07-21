import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsQueryDto, PaginatedStudentsResponseDto } from './dto/students-query.dto';
import { CreateStudentNoteDto } from './dto/create-student-note.dto';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { StudentStatisticsDto } from './dto/student-statistics.dto';
import { Student, Prisma, StudentNote, StudentTimeline, TimelineEventType } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateStudentNumber(academicYear: string): Promise<string> {
    // Buscar o último número de aluno criado para o ano acadêmico
    const lastStudent = await this.prisma.student.findFirst({
      where: {
        academicYear,
        studentNumber: {
          startsWith: academicYear + '-',
        },
      },
      orderBy: {
        studentNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastStudent && lastStudent.studentNumber) {
      const parts = lastStudent.studentNumber.split('-');
      if (parts.length === 2 && parts[1]) {
        const lastNumber = parseInt(parts[1], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    // Formatar o número com zeros à esquerda (AAAA-XXXX)
    return `${academicYear}-${nextNumber.toString().padStart(4, '0')}`;
  }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Gerar número de aluno automaticamente
    const studentNumber = await this.generateStudentNumber(createStudentDto.academicYear);

    // Verificar se número de matrícula já existe (caso seja fornecido manualmente)
    if (createStudentDto.studentNumber) {
      const existingStudent = await this.prisma.student.findUnique({
        where: { studentNumber: createStudentDto.studentNumber },
      });

      if (existingStudent) {
        throw new ConflictException('Número de matrícula já existe');
      }
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
          biNumber: createStudentDto.biNumber,
          studentNumber: createStudentDto.studentNumber || studentNumber,
          status: createStudentDto.status,
          tags: createStudentDto.tags || [],
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

  async findAllPaginated(query: StudentsQueryDto): Promise<PaginatedStudentsResponseDto> {
    const { page = 1, limit = 20, search, academicYear, classId, province } = query;

    const where: Prisma.StudentWhereInput = {
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { studentNumber: { contains: search } },
        ],
      }),
      ...(academicYear && { academicYear }),
      ...(classId && { classId }),
      ...(province && { province }),
    };

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
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
      }),
      this.prisma.student.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      students,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
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

  /**
   * Verificar se estudante existe por número de BI
   * Retorna dados básicos se encontrado, ou 404 se não encontrado
   */
  async findByBI(biNumber: string) {
    // Limpar e normalizar o BI (remover espaços, converter para maiúsculas)
    const cleanBI = biNumber.trim().toUpperCase().replace(/\s+/g, '');

    // Validar formato do BI angolano (9 dígitos + 2 letras + 3 dígitos)
    const biRegex = /^[0-9]{9}[A-Z]{2}[0-9]{3}$/;
    if (!biRegex.test(cleanBI)) {
      throw new BadRequestException(`Formato de BI inválido: ${biNumber}. Formato esperado: 123456789LA034`);
    }

    const student = await this.prisma.student.findUnique({
      where: { biNumber: cleanBI },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        biNumber: true,
        studentNumber: true,
        academicYear: true,
        classId: true,
        status: true,
        createdAt: true,
      },
    });

    if (!student) {
      // Retornar 404 com estrutura consistente
      throw new NotFoundException({
        exists: false,
        message: `Nenhum estudante encontrado com o BI ${cleanBI}`
      });
    }

    // Retornar 200 com dados do estudante
    return {
      exists: true,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        biNumber: student.biNumber,
        studentNumber: student.studentNumber,
        academicYear: student.academicYear,
        classId: student.classId,
        status: student.status,
        createdAt: student.createdAt,
      }
    };
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

  // Student Notes Management
  async createNote(studentId: string, createNoteDto: CreateStudentNoteDto, userId: string): Promise<StudentNote> {
    await this.findOne(studentId);

    const note = await this.prisma.studentNote.create({
      data: {
        studentId,
        content: createNoteDto.content,
        type: createNoteDto.type,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Add timeline event
    await this.addTimelineEvent(studentId, {
      eventType: TimelineEventType.NOTA_PEDAGOGICA,
      title: `Nova ${createNoteDto.type.toLowerCase()} adicionada`,
      description: `${createNoteDto.type}: ${createNoteDto.content.substring(0, 100)}${createNoteDto.content.length > 100 ? '...' : ''}`,
      metadata: { noteId: note.id, noteType: createNoteDto.type },
    }, userId);

    return note;
  }

  async getNotes(studentId: string): Promise<StudentNote[]> {
    await this.findOne(studentId);

    return await this.prisma.studentNote.findMany({
      where: { studentId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Student Timeline Management
  async addTimelineEvent(
    studentId: string, 
    createEventDto: CreateTimelineEventDto, 
    userId?: string
  ): Promise<StudentTimeline> {
    await this.findOne(studentId);

    return await this.prisma.studentTimeline.create({
      data: {
        studentId,
        eventType: createEventDto.eventType,
        title: createEventDto.title,
        description: createEventDto.description,
        metadata: createEventDto.metadata,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getTimeline(studentId: string): Promise<StudentTimeline[]> {
    await this.findOne(studentId);

    return await this.prisma.studentTimeline.findMany({
      where: { studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Statistics
  async getStatistics(): Promise<StudentStatisticsDto> {
    const [
      total,
      byStatus,
      byGender,
      byProvince,
      byAcademicYear,
      students,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.student.groupBy({
        by: ['gender'],
        _count: true,
      }),
      this.prisma.student.groupBy({
        by: ['province'],
        _count: true,
      }),
      this.prisma.student.groupBy({
        by: ['academicYear'],
        _count: true,
      }),
      this.prisma.student.findMany({
        select: {
          birthDate: true,
          tags: true,
          schoolClass: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Calculate average age
    const ages = students.map(s => {
      const today = new Date();
      const birth = new Date(s.birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    });
    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;

    // Count tags
    const tagCounts: Record<string, number> = {};
    students.forEach(s => {
      s.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Count by class
    const classCounts: Record<string, number> = {};
    students.forEach(s => {
      if (s.schoolClass) {
        classCounts[s.schoolClass.name] = (classCounts[s.schoolClass.name] || 0) + 1;
      }
    });

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byGender: byGender.reduce((acc, item) => {
        acc[item.gender] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byProvince: byProvince.reduce((acc, item) => {
        acc[item.province] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byAcademicYear: byAcademicYear.reduce((acc, item) => {
        acc[item.academicYear] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byClass: classCounts,
      averageAge: Math.round(averageAge * 10) / 10,
      byTags: tagCounts,
    };
  }

  // Get student invoices
  async getStudentInvoices(studentId: string) {
    await this.findOne(studentId);

    return await this.prisma.invoice.findMany({
      where: { studentId },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Export functions (basic implementation - can be enhanced)
  async exportToCsv(): Promise<string> {
    const students = await this.prisma.student.findMany({
      include: {
        schoolClass: true,
      },
      orderBy: [
        { academicYear: 'desc' },
        { firstName: 'asc' },
      ],
    });

    const headers = [
      'Número',
      'Nome',
      'Género',
      'Data Nascimento',
      'BI Número',
      'Turma',
      'Ano Letivo',
      'Status',
      'Província',
      'Município',
      'Encarregado',
      'Telefone Encarregado',
      'Email Pais',
    ];

    const rows = students.map(s => [
      s.studentNumber,
      `${s.firstName} ${s.lastName}`,
      s.gender,
      new Date(s.birthDate).toLocaleDateString('pt-AO'),
      s.biNumber,
      s.schoolClass?.name || '',
      s.academicYear,
      s.status,
      s.province,
      s.municipality,
      s.guardianName,
      s.guardianPhone,
      s.parentEmail,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

}