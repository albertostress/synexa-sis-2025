/**
 * GradesAngolaService - Serviço especializado para o sistema de notas de Angola
 * 
 * Implementa as regras específicas do sistema educacional angolano:
 * - MAC (Média das Aulas Contínuas)
 * - NPP (Nota da Prova do Professor)  
 * - NPT (Nota da Prova Trimestral)
 * - MT (Média Trimestral) = (MAC + NPP + NPT) / 3
 * - Aprovação: MT >= 10
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  AngolaStudentTermGradesDto, 
  AngolaClassStudentSummaryDto, 
  AngolaCalculateMtDto,
  AngolaSubjectGradeDto,
  GradeStatus 
} from './dto/angola-grades.dto';

@Injectable()
export class GradesAngolaService {
  private readonly logger = new Logger(GradesAngolaService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calcula a Média Trimestral (MT) e o status de aprovação
   * Regras Angola: MT = (MAC + NPP + NPT) / 3, MT >= 10 = APROVADO
   */
  private calculateMT(mac: number | null, npp: number | null, npt: number | null): {
    mt: number;
    status: GradeStatus;
  } {
    // Verificar se todas as notas estão presentes
    if (mac === null || npp === null || npt === null) {
      return {
        mt: 0,
        status: GradeStatus.INCOMPLETO
      };
    }

    // Calcular média trimestral
    const mt = Math.round(((mac + npp + npt) / 3) * 10) / 10; // Arredondar para 1 casa decimal
    
    // Determinar status
    const status = mt >= 10 ? GradeStatus.APROVADO : GradeStatus.REPROVADO;

    return { mt, status };
  }

  /**
   * Converte número do trimestre para texto em português
   */
  private getTermText(term: number): string {
    const termMap = {
      1: '1º Trimestre',
      2: '2º Trimestre', 
      3: '3º Trimestre'
    };
    return termMap[term] || `${term}º Trimestre`;
  }

  /**
   * Endpoint 1: GET /grades/angola/student/:studentId/term/:term
   * Retorna as notas completas do aluno com MT calculada
   */
  async getStudentTermGrades(studentId: string, term: number): Promise<AngolaStudentTermGradesDto> {
    this.logger.debug(`Buscando notas do aluno ${studentId} no trimestre ${term}`);

    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true }
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }

    // Buscar todas as notas do aluno no trimestre
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        term
      },
      include: {
        subject: {
          select: { name: true }
        }
      }
    });

    // Agrupar notas por disciplina
    const subjectGrades = new Map<string, {
      subjectName: string;
      mac: number | null;
      npp: number | null;
      npt: number | null;
    }>();

    grades.forEach(grade => {
      const subjectName = grade.subject.name;
      
      if (!subjectGrades.has(subjectName)) {
        subjectGrades.set(subjectName, {
          subjectName,
          mac: null,
          npp: null,
          npt: null
        });
      }

      const subjectData = subjectGrades.get(subjectName);
      
      // Mapear tipos de nota para o padrão Angola
      switch (grade.type) {
        case 'MAC':
          subjectData.mac = grade.value;
          break;
        case 'NPP':
          subjectData.npp = grade.value;
          break;
        case 'NPT':
          subjectData.npt = grade.value;
          break;
      }
    });

    // Calcular MT para cada disciplina
    const subjects: AngolaSubjectGradeDto[] = [];
    let totalMT = 0;
    let validSubjects = 0;

    subjectGrades.forEach(({ subjectName, mac, npp, npt }) => {
      const { mt, status } = this.calculateMT(mac, npp, npt);
      
      subjects.push({
        subject: subjectName,
        mac,
        npp,
        npt,
        mt,
        status
      });

      if (status !== GradeStatus.INCOMPLETO) {
        totalMT += mt;
        validSubjects++;
      }
    });

    // Calcular média geral do aluno
    const average = validSubjects > 0 ? Math.round((totalMT / validSubjects) * 10) / 10 : 0;
    const statusGeral = validSubjects === 0 ? GradeStatus.INCOMPLETO : 
                       (average >= 10 ? GradeStatus.APROVADO : GradeStatus.REPROVADO);

    return {
      student: `${student.firstName} ${student.lastName}`,
      term: this.getTermText(term),
      subjects,
      average,
      statusGeral
    };
  }

  /**
   * Endpoint 2: GET /grades/angola/class/:classId/term/:term
   * Retorna resumo de todos os alunos da turma no trimestre
   */
  async getClassTermSummary(classId: string, term: number): Promise<AngolaClassStudentSummaryDto[]> {
    this.logger.debug(`Buscando resumo da turma ${classId} no trimestre ${term}`);

    // Verificar se a turma existe
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      select: { name: true }
    });

    if (!schoolClass) {
      throw new NotFoundException(`Turma com ID ${classId} não encontrada`);
    }

    // Buscar todos os alunos da turma
    const enrollments = await this.prisma.enrollment.findMany({
      where: { 
        classId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    const results: AngolaClassStudentSummaryDto[] = [];

    // Para cada aluno, calcular sua média no trimestre
    for (const enrollment of enrollments) {
      const student = enrollment.student;
      
      // Buscar notas do aluno no trimestre
      const grades = await this.prisma.grade.findMany({
        where: {
          studentId: student.id,
          term
        },
        include: {
          subject: { select: { name: true } }
        }
      });

      // Agrupar por disciplina e calcular MT
      const subjectMTs = new Map<string, number>();
      const subjectGrades = new Map<string, { mac: number | null; npp: number | null; npt: number | null }>();

      grades.forEach(grade => {
        const subjectName = grade.subject.name;
        
        if (!subjectGrades.has(subjectName)) {
          subjectGrades.set(subjectName, { mac: null, npp: null, npt: null });
        }
        
        const data = subjectGrades.get(subjectName);
        
        switch (grade.type) {
          case 'MAC': data.mac = grade.value; break;
          case 'NPP': data.npp = grade.value; break;
          case 'NPT': data.npt = grade.value; break;
        }
      });

      // Calcular MT por disciplina
      let totalMT = 0;
      let validSubjects = 0;

      subjectGrades.forEach(({ mac, npp, npt }, subjectName) => {
        const { mt, status } = this.calculateMT(mac, npp, npt);
        
        if (status !== GradeStatus.INCOMPLETO) {
          totalMT += mt;
          validSubjects++;
        }
      });

      // Média geral do aluno
      const studentAverage = validSubjects > 0 ? Math.round((totalMT / validSubjects) * 10) / 10 : 0;
      const studentStatus = validSubjects === 0 ? GradeStatus.INCOMPLETO :
                           (studentAverage >= 10 ? GradeStatus.APROVADO : GradeStatus.REPROVADO);

      results.push({
        student: `${student.firstName} ${student.lastName}`,
        mt: studentAverage,
        status: studentStatus
      });
    }

    return results.sort((a, b) => a.student.localeCompare(b.student));
  }

  /**
   * Endpoint 3: GET /grades/angola/calculate-mt/:studentId/:subjectId/:term
   * Retorna cálculo isolado de MT para um aluno em uma disciplina
   */
  async calculateSubjectMT(studentId: string, subjectId: string, term: number): Promise<AngolaCalculateMtDto> {
    this.logger.debug(`Calculando MT para aluno ${studentId}, disciplina ${subjectId}, trimestre ${term}`);

    // Verificar se aluno e disciplina existem
    const [student, subject] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: studentId } }),
      this.prisma.subject.findUnique({ where: { id: subjectId } })
    ]);

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }
    
    if (!subject) {
      throw new NotFoundException(`Disciplina com ID ${subjectId} não encontrada`);
    }

    // Buscar notas específicas
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        subjectId,
        term
      }
    });

    // Extrair MAC, NPP, NPT
    let mac: number | null = null;
    let npp: number | null = null;
    let npt: number | null = null;

    grades.forEach(grade => {
      switch (grade.type) {
        case 'MAC': mac = grade.value; break;
        case 'NPP': npp = grade.value; break;
        case 'NPT': npt = grade.value; break;
      }
    });

    // Calcular MT
    const { mt, status } = this.calculateMT(mac, npp, npt);

    return {
      mac,
      npp,
      npt,
      mt,
      status
    };
  }
}