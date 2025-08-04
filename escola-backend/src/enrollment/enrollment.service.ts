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
import { CreateEnrollmentWithStudentDto } from './dto/create-enrollment-with-student.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Enrollment, EnrollmentWithRelations } from './entities/enrollment.entity';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Função utilitária: Buscar estudante existente ou criar novo
   * 🔍 Verifica duplicação por BI ou nome + data de nascimento
   * ✨ Fluxo realista de secretaria escolar angolana
   */
  private async findOrCreateStudent(studentData: any, classId: string): Promise<{ studentId: string; wasCreated: boolean; message?: string }> {
    const { firstName, lastName, gender, birthDate, biNumber, province, municipality, observacao, guardian } = studentData;

    // 1. Verificar se existe estudante com mesmo BI (se fornecido)
    let existingStudentByBI = null;
    let cleanBI = null;
    
    if (biNumber && biNumber.trim()) {
      // Limpar e normalizar o BI (remover espaços, converter para maiúsculas)
      cleanBI = biNumber.trim().toUpperCase().replace(/\s+/g, '');
      
      existingStudentByBI = await this.prisma.student.findUnique({
        where: { biNumber: cleanBI }
      });

      if (existingStudentByBI) {
        return { 
          studentId: existingStudentByBI.id, 
          wasCreated: false,
          message: `Estudante encontrado pelo BI ${cleanBI}. Usando registro existente.`
        };
      }
    }

    // 2. Verificar duplicação por nome + data de nascimento
    const existingStudentByNameAndBirth = await this.prisma.student.findFirst({
      where: {
        firstName: { equals: firstName, mode: 'insensitive' },
        lastName: { equals: lastName, mode: 'insensitive' },
        birthDate: new Date(birthDate)
      }
    });

    if (existingStudentByNameAndBirth) {
      throw new ConflictException(
        `Já existe um estudante com nome "${firstName} ${lastName}" e data de nascimento ${birthDate}. ` +
        `Verifique se não é duplicação ou use o BI ${existingStudentByNameAndBirth.biNumber} para matricular.`
      );
    }

    // 3. Gerar studentNumber automático
    const currentYear = new Date().getFullYear();
    const studentCount = await this.prisma.student.count();
    const studentNumber = `${currentYear}${String(studentCount + 1).padStart(4, '0')}`;

    // 4. Criar novo estudante com classId temporário (será atualizado depois)
    const newStudent = await this.prisma.student.create({
      data: {
        firstName,
        lastName,
        gender,
        birthDate: new Date(birthDate),
        biNumber: cleanBI || null,
        studentNumber,
        province,
        municipality,
        tags: observacao ? [observacao] : [],
        // Campos obrigatórios com valores padrão
        parentEmail: guardian?.email || 'nao.informado@email.com',
        parentPhone: guardian?.phone || '000000000',
        guardianName: guardian?.name || '',
        guardianPhone: guardian?.phone || '',
        country: 'Angola', // Padrão para Angola
        academicYear: currentYear.toString(),
        profilePhotoUrl: null,
        classId
      }
    });

    return { 
      studentId: newStudent.id, 
      wasCreated: true,
      message: `Novo estudante criado: ${firstName} ${lastName} (Nº ${studentNumber})`
    };
  }

  /**
   * Novo método: Criar matrícula com estudante (inline ou existente)
   * Fluxo realista de secretaria escolar
   */
  async createWithStudent(createEnrollmentDto: CreateEnrollmentWithStudentDto) {
    const { student, academicYear, classId, status = 'ACTIVE' } = createEnrollmentDto;

    // 1. Buscar ou criar estudante
    const { studentId, wasCreated, message } = await this.findOrCreateStudent(student, classId);

    // 2. Verificar se a turma existe
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      throw new NotFoundException(`Turma com ID ${classId} não encontrada`);
    }

    // 3. Verificar se o estudante já tem matrícula para o mesmo ano
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        year: academicYear,
        status: 'ACTIVE', // Usar apenas enum oficial
      },
    });

    if (existingEnrollment) {
      throw new ConflictException(
        `Estudante já está matriculado para o ano letivo ${academicYear}`
      );
    }

    // 4. Verificar capacidade da turma se status for ATIVA
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

    // 5. Atualizar classId do estudante
    await this.prisma.student.update({
      where: { id: studentId },
      data: { 
        classId,
        academicYear: academicYear.toString() 
      }
    });

    // 6. Criar a matrícula
    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId,
        classId,
        year: academicYear,
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            biNumber: true,
            studentNumber: true,
            academicYear: true,
            profilePhotoUrl: true,
            guardianName: true,
            guardianPhone: true,
            municipality: true,
            province: true,
            country: true,
            parentEmail: true,
            parentPhone: true,
            status: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        class: {
          include: {
            teachers: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
      },
    });

    return enrollment;
  }

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { studentId, classId, academicYear, status = 'ACTIVE' } = createEnrollmentDto;

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
        year: academicYear,
        status: 'ACTIVE',
      },
    });

    if (existingEnrollment) {
      throw new ConflictException(`Estudante já possui matrícula ativa para o ano letivo ${academicYear}`);
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
        year: academicYear,
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            biNumber: true,
            studentNumber: true,
            academicYear: true,
            profilePhotoUrl: true,
            guardianName: true,
            guardianPhone: true,
            municipality: true,
            province: true,
            country: true,
            parentEmail: true,
            parentPhone: true,
            status: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        class: true,
      },
    });

    return enrollment;
  }

  async findAll() {
    const enrollments = await this.prisma.enrollment.findMany({
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            biNumber: true,
            studentNumber: true,
            academicYear: true,
            profilePhotoUrl: true,
            guardianName: true,
            guardianPhone: true,
            municipality: true,
            province: true,
            country: true,
            parentEmail: true,
            parentPhone: true,
            status: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        class: {
          include: {
            teachers: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments;
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            biNumber: true,
            studentNumber: true,
            academicYear: true,
            profilePhotoUrl: true,
            guardianName: true,
            guardianPhone: true,
            municipality: true,
            province: true,
            country: true,
            parentEmail: true,
            parentPhone: true,
            status: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        class: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Matrícula com ID ${id} não encontrada`);
    }

    return enrollment;
  }

  async findByStudent(studentId: string) {
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
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            biNumber: true,
            studentNumber: true,
            academicYear: true,
            profilePhotoUrl: true,
            guardianName: true,
            guardianPhone: true,
            municipality: true,
            province: true,
            country: true,
            parentEmail: true,
            parentPhone: true,
            status: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        class: true,
      },
      orderBy: {
        year: 'desc',
      },
    });

    return enrollments;
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto) {
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
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            biNumber: true,
            studentNumber: true,
            academicYear: true,
            profilePhotoUrl: true,
            guardianName: true,
            guardianPhone: true,
            municipality: true,
            province: true,
            country: true,
            parentEmail: true,
            parentPhone: true,
            status: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        class: true,
      },
    });

    return updatedEnrollment;
  }

  async remove(id: string) {
    const enrollment = await this.findOne(id);

    // Em vez de deletar, cancelar a matrícula
    const cancelledEnrollment = await this.prisma.enrollment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            biNumber: true,
            studentNumber: true,
            academicYear: true,
            profilePhotoUrl: true,
            guardianName: true,
            guardianPhone: true,
            municipality: true,
            province: true,
            country: true,
            parentEmail: true,
            parentPhone: true,
            status: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        class: true,
      },
    });

    return cancelledEnrollment;
  }

  async findByYear(year: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { year },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            biNumber: true,
            studentNumber: true,
            academicYear: true,
            profilePhotoUrl: true,
            guardianName: true,
            guardianPhone: true,
            municipality: true,
            province: true,
            country: true,
            parentEmail: true,
            parentPhone: true,
            status: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments;
  }

  async findByClass(classId: string) {
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
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            biNumber: true,
            studentNumber: true,
            academicYear: true,
            profilePhotoUrl: true,
            guardianName: true,
            guardianPhone: true,
            municipality: true,
            province: true,
            country: true,
            parentEmail: true,
            parentPhone: true,
            status: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments;
  }

  /**
   * Buscar todos os anos letivos distintos existentes no sistema
   * Usado para preencher dropdown de anos nos boletins
   */
  async getAllYears(): Promise<string[]> {
    const years = await this.prisma.enrollment.findMany({
      select: { 
        year: true 
      },
      distinct: ['year'],
      orderBy: { 
        year: 'desc' 
      }
    });

    // Converter anos para formato de ano letivo (ex: 2025 -> "2025/2026")
    return years.map(y => `${y.year}/${y.year + 1}`);
  }
}