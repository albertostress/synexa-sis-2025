/**
 * Report Cards Service - Geração de boletins escolares
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportCard, SubjectGrade, StudentInfo, ClassInfo } from './entities/report-card.entity';

@Injectable()
export class ReportCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReportCard(studentId: string, year: number): Promise<ReportCard> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true, parentEmail: true, birthDate: true },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }

    // Verificar se o aluno tem matrícula ativa no ano especificado
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        year,
        status: 'ACTIVE',
      },
      include: {
        class: true,
      },
    });

    if (!enrollment) {
      throw new BadRequestException(`Aluno não possui matrícula ativa no ano ${year}`);
    }

    // Buscar todas as notas do aluno no ano especificado
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        year,
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        subject: {
          name: 'asc',
        },
      },
    });

    if (grades.length === 0) {
      throw new BadRequestException(`Nenhuma nota encontrada para o aluno no ano ${year}`);
    }

    // Montar informações do aluno
    const studentInfo: StudentInfo = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      email: student.parentEmail,
      birthDate: student.birthDate,
    };

    // Montar informações da turma
    const classInfo: ClassInfo = {
      id: enrollment.class.id,
      name: enrollment.class.name,
      shift: enrollment.class.shift,
      capacity: enrollment.class.capacity,
    };

    // Montar notas por disciplina
    const subjects: SubjectGrade[] = grades.map(grade => ({
      subjectId: grade.subject.id,
      subjectName: grade.subject.name,
      subjectDescription: grade.subject.description || undefined,
      grade: grade.value,
      teacherName: grade.teacher.user.name,
      teacherEmail: grade.teacher.user.email,
    }));

    // Calcular média geral
    const totalGrades = grades.reduce((sum, grade) => sum + grade.value, 0);
    const averageGrade = Math.round((totalGrades / grades.length) * 100) / 100; // Arredondar para 2 casas decimais

    // Determinar status de aprovação
    let status: 'APROVADO' | 'REPROVADO' | 'EM_RECUPERACAO';
    
    if (averageGrade >= 7.0) {
      status = 'APROVADO';
    } else if (averageGrade >= 5.0) {
      status = 'EM_RECUPERACAO';
    } else {
      status = 'REPROVADO';
    }

    // Montar o boletim final
    const reportCard: ReportCard = {
      student: studentInfo,
      class: classInfo,
      year,
      subjects,
      averageGrade,
      status,
      generatedAt: new Date(),
    };

    return reportCard;
  }

  async getStudentsByClass(classId: string, year: number): Promise<StudentInfo[]> {
    // Verificar se a turma existe
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      throw new NotFoundException(`Turma com ID ${classId} não encontrada`);
    }

    // Buscar alunos matriculados na turma no ano especificado
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        classId,
        year,
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, parentEmail: true, birthDate: true },
        },
      },
      orderBy: {
        student: {
          firstName: 'asc',
        },
      },
    });

    return enrollments.map(enrollment => ({
      id: enrollment.student.id,
      name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      email: enrollment.student.parentEmail,
      birthDate: enrollment.student.birthDate,
    }));
  }

  async generateClassReportCards(classId: string, year: number): Promise<ReportCard[]> {
    const students = await this.getStudentsByClass(classId, year);
    
    const reportCards: ReportCard[] = [];
    
    for (const student of students) {
      try {
        const reportCard = await this.generateReportCard(student.id, year);
        reportCards.push(reportCard);
      } catch (error) {
        // Se um aluno não tem notas, pular e continuar com os outros
        console.warn(`Erro ao gerar boletim para aluno ${student.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return reportCards;
  }
}