/**
 * Report Cards Service - Geração de boletins escolares (Sistema Angolano)
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { GradeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportCard, SubjectGrade, StudentInfo, ClassInfo, AngolanGradeDetail } from './entities/report-card.entity';
import { AngolaReportCard, AngolaSubjectGrades } from './entities/angola-report-card.entity';
import { 
  calculateMT, 
  getAngolaClassification, 
  getFinalStatus, 
  calculateGeneralAverage,
  formatShift,
  formatDateForAngola 
} from './utils/angola-classification.util';

@Injectable()
export class ReportCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReportCard(studentId: string, year: number, term?: number): Promise<ReportCard> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        parentEmail: true, 
        studentNumber: true, 
        birthDate: true,
        guardianName: true,
        profilePhotoUrl: true
      },
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

    // Definir filtro de notas baseado no trimestre
    const gradeFilter: any = {
      studentId,
      year,
    };

    if (term) {
      gradeFilter.term = term;
    }

    // Buscar todas as notas do aluno no ano/trimestre especificado
    const grades = await this.prisma.grade.findMany({
      where: gradeFilter,
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
      orderBy: [
        { subject: { name: 'asc' } },
        { term: 'asc' },
        { type: 'asc' },
      ],
    });

    if (grades.length === 0) {
      const periodText = term ? `no ${term}º trimestre do ano ${year}` : `no ano ${year}`;
      throw new BadRequestException(`Nenhuma nota encontrada para o aluno ${periodText}`);
    }

    // Buscar presenças para calcular frequência
    const attendanceFilter: any = {
      studentId,
      date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    };

    const attendances = await this.prisma.attendance.findMany({
      where: attendanceFilter,
    });

    const totalClasses = attendances.length;
    const presentClasses = attendances.filter(a => a.present).length;
    const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 100;

    // Montar informações do aluno
    const studentInfo: StudentInfo = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      fatherName: student.guardianName || undefined,
      parentEmail: student.parentEmail,
      studentNumber: student.studentNumber,
      birthDate: student.birthDate,
      photoUrl: student.profilePhotoUrl || undefined,
    };

    // Montar informações da turma
    const classInfo: ClassInfo = {
      id: enrollment.class.id,
      name: enrollment.class.name,
      shift: enrollment.class.shift,
      capacity: enrollment.class.capacity,
    };

    // Agrupar notas por disciplina
    const subjectMap = new Map<string, {
      subject: any;
      teacher: any;
      grades: AngolanGradeDetail[];
      absences: number;
    }>();

    for (const grade of grades) {
      const key = grade.subject.id;
      
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subject: grade.subject,
          teacher: grade.teacher,
          grades: [],
          absences: 0,
        });
      }

      const subjectData = subjectMap.get(key)!;
      
      if (grade.type === GradeType.FAL) {
        subjectData.absences = grade.value;
      } else {
        subjectData.grades.push({
          type: grade.type,
          value: grade.value,
          term: grade.term,
        });
      }
    }

    // Montar notas por disciplina no formato angolano
    const subjects: SubjectGrade[] = Array.from(subjectMap.values()).map(data => {
      // Calcular média da disciplina (apenas notas MT)
      const mtGrades = data.grades.filter(g => g.type === GradeType.MT);
      const averageGrade = mtGrades.length > 0 
        ? mtGrades.reduce((sum, g) => sum + g.value, 0) / mtGrades.length
        : undefined;

      return {
        subjectId: data.subject.id,
        subjectName: data.subject.name,
        subjectDescription: data.subject.description || undefined,
        grades: data.grades,
        averageGrade: averageGrade ? Math.round(averageGrade * 100) / 100 : undefined,
        absences: data.absences,
        teacherName: data.teacher.user.name,
        teacherEmail: data.teacher.user.email,
      };
    });

    // Calcular média geral (baseada nas médias trimestrais)
    const subjectAverages = subjects
      .map(s => s.averageGrade)
      .filter((avg): avg is number => avg !== undefined);
    
    const averageGrade = subjectAverages.length > 0
      ? Math.round((subjectAverages.reduce((sum, avg) => sum + avg, 0) / subjectAverages.length) * 100) / 100
      : 0;

    // Determinar status de aprovação (Sistema Angolano 0-20)
    let status: 'APROVADO' | 'REPROVADO' | 'EM_RECUPERACAO';
    
    if (averageGrade >= 10.0) {
      status = 'APROVADO';
    } else if (averageGrade >= 8.0) {
      status = 'EM_RECUPERACAO';
    } else {
      status = 'REPROVADO';
    }

    // Montar o boletim final
    const reportCard: ReportCard = {
      student: studentInfo,
      class: classInfo,
      year,
      term,
      subjects,
      averageGrade,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      status,
      school: {
        name: 'Complexo Escolar Privado Casa Inglesa',
        province: 'Luanda',
        municipality: 'Belas',
      },
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
          select: { id: true, firstName: true, lastName: true, parentEmail: true, studentNumber: true, birthDate: true },
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
      parentEmail: enrollment.student.parentEmail,
      studentNumber: enrollment.student.studentNumber,
      birthDate: enrollment.student.birthDate,
    }));
  }

  async generateClassReportCards(classId: string, year: number, term?: number): Promise<ReportCard[]> {
    const students = await this.getStudentsByClass(classId, year);
    
    const reportCards: ReportCard[] = [];
    
    for (const student of students) {
      try {
        const reportCard = await this.generateReportCard(student.id, year, term);
        reportCards.push(reportCard);
      } catch (error) {
        // Se um aluno não tem notas, pular e continuar com os outros
        console.warn(`Erro ao gerar boletim para aluno ${student.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return reportCards;
  }

  // ==================== NOVO MÉTODO MELHORADO PARA SISTEMA ANGOLANO ====================

  async generateAngolaReportCard(studentId: string, year: number, term?: number): Promise<AngolaReportCard> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        guardianName: true,
        birthDate: true,
      },
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

    // Definir filtro de notas baseado no trimestre
    const gradeFilter: any = {
      studentId,
      year,
    };

    if (term) {
      gradeFilter.term = term;
    }

    // Buscar todas as notas do aluno no ano/trimestre especificado
    const grades = await this.prisma.grade.findMany({
      where: gradeFilter,
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { subject: { name: 'asc' } },
        { term: 'asc' },
        { type: 'asc' },
      ],
    });

    if (grades.length === 0) {
      const periodText = term ? `no ${term}º trimestre do ano ${year}` : `no ano ${year}`;
      throw new BadRequestException(`Nenhuma nota encontrada para o aluno ${periodText}`);
    }

    // Buscar presenças para calcular frequência
    const attendanceFilter: any = {
      studentId,
      date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    };

    if (term) {
      // Filtrar por trimestre (aproximação por meses)
      const termMonths = {
        1: { start: 1, end: 4 },   // Jan-Abr
        2: { start: 5, end: 8 },   // Mai-Ago
        3: { start: 9, end: 12 },  // Set-Dez
      };
      
      const months = termMonths[term as keyof typeof termMonths];
      attendanceFilter.date = {
        gte: new Date(`${year}-${months.start.toString().padStart(2, '0')}-01`),
        lte: new Date(`${year}-${months.end.toString().padStart(2, '0')}-31`),
      };
    }

    const attendances = await this.prisma.attendance.findMany({
      where: attendanceFilter,
    });

    const totalClasses = attendances.length;
    const presentClasses = attendances.filter(a => a.present).length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 10000) / 100 : 100;

    // Agrupar notas por disciplina
    const subjectMap = new Map<string, {
      subject: any;
      teacher: any;
      mac: number | null;
      npp: number | null;
      npt: number | null;
      absences: number;
    }>();

    for (const grade of grades) {
      const key = grade.subject.id;
      
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subject: grade.subject,
          teacher: grade.teacher,
          mac: null,
          npp: null,
          npt: null,
          absences: 0,
        });
      }

      const subjectData = subjectMap.get(key)!;
      
      // Mapear tipos de nota para o sistema angolano
      switch (grade.type) {
        case GradeType.MAC:
          subjectData.mac = grade.value;
          break;
        case GradeType.NPP:
          subjectData.npp = grade.value;
          break;
        case GradeType.NPT:
          subjectData.npt = grade.value;
          break;
        case GradeType.FAL:
          subjectData.absences = grade.value;
          break;
      }
    }

    // Processar disciplinas no formato angolano
    const angolaSubjects: AngolaSubjectGrades[] = Array.from(subjectMap.values()).map(data => {
      const mt = calculateMT(data.mac, data.npp, data.npt);
      const classification = getAngolaClassification(mt);

      return {
        subjectName: data.subject.name,
        teacherName: data.teacher.user.name,
        mac: data.mac,
        npp: data.npp,
        npt: data.npt,
        mt: mt,
        fal: data.absences,
        classification: classification,
      };
    });

    // Calcular média geral e situação final
    const allMTs = angolaSubjects.map(s => s.mt);
    const averageGrade = calculateGeneralAverage(allMTs);
    const finalStatus = getFinalStatus(allMTs);

    // Montar resposta no formato angolano
    const angolaReportCard: AngolaReportCard = {
      student: {
        name: `${student.firstName} ${student.lastName}`,
        fatherName: student.guardianName,
        className: enrollment.class.name,
        shift: formatShift(enrollment.class.shift),
        birthDate: formatDateForAngola(student.birthDate),
        academicYear: year,
      },
      subjects: angolaSubjects,
      averageGrade: averageGrade,
      finalStatus: finalStatus,
      attendancePercentage: attendancePercentage,
      term: term || null,
      year: year,
      generatedAt: new Date(),
    };

    return angolaReportCard;
  }
}