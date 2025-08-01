/**
 * Documents Service - Geração de documentos oficiais escolares
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// NOTA: Importação de ReportCardsService removida para quebrar dependência circular
import { PdfService } from './pdf/pdf.service';
import { CertificateData, CertificateSubject } from './templates/certificate.template';
import { DeclarationData } from './templates/declaration.template';
import { TranscriptData, TranscriptYear, TranscriptSubject } from './templates/transcript.template';
// NOTA: Importações de ReportCard removidas para quebrar dependência circular

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  async generateCertificate(studentId: string, year: number): Promise<CertificateData> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }

    // Verificar se o aluno tem matrícula no ano especificado
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        year,
      },
      include: {
        class: true,
      },
    });

    if (!enrollment) {
      throw new BadRequestException(`Aluno não possui matrícula no ano ${year}`);
    }

    // Buscar notas do aluno para verificar aprovação
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        year,
        type: 'MT', // Média trimestral
      },
      include: {
        subject: true,
      },
    });

    if (grades.length === 0) {
      throw new BadRequestException(`Aluno não possui notas registradas no ano ${year}`);
    }

    // Calcular média por disciplina
    const subjectGrades = new Map<string, { name: string; grades: number[] }>();
    
    for (const grade of grades) {
      const key = grade.subject.id;
      if (!subjectGrades.has(key)) {
        subjectGrades.set(key, { name: grade.subject.name, grades: [] });
      }
      subjectGrades.get(key)!.grades.push(grade.value);
    }

    // Montar dados das disciplinas com médias
    const subjects: CertificateSubject[] = [];
    let totalAverage = 0;
    let subjectCount = 0;

    for (const [, data] of subjectGrades) {
      const average = data.grades.reduce((sum, g) => sum + g, 0) / data.grades.length;
      const roundedAverage = Math.round(average * 100) / 100;
      
      subjects.push({
        subjectName: data.name,
        finalGrade: roundedAverage,
        status: roundedAverage >= 10 ? 'APROVADO' : 'REPROVADO', // Escala angolana: 10 ou mais é aprovado
      });

      totalAverage += roundedAverage;
      subjectCount++;
    }

    const overallAverage = Math.round((totalAverage / subjectCount) * 100) / 100;

    // Verificar se o aluno foi aprovado
    if (overallAverage < 10) {
      throw new ForbiddenException(`Não é possível gerar certificado para aluno com média ${overallAverage}. Média mínima: 10.0`);
    }

    // Traduzir turno
    const shiftTranslation = {
      MORNING: 'Matutino',
      AFTERNOON: 'Vespertino',
      EVENING: 'Noturno',
    };

    const certificateData: CertificateData = {
      documentType: 'CERTIFICADO_CONCLUSAO',
      studentName: `${student.firstName} ${student.lastName}`,
      birthDate: student.birthDate.toISOString().split('T')[0] || '',
      className: enrollment.class.name,
      shift: shiftTranslation[enrollment.class.shift] || enrollment.class.shift,
      year,
      subjects,
      overallAverage: overallAverage,
      finalStatus: 'APROVADO',
      institutionName: 'Escola Synexa',
      city: 'São Paulo',
      issueDate: new Date().toISOString().split('T')[0] || '',
      issuer: 'Sistema Synexa-SIS',
      issuerRole: 'Sistema de Gestão Escolar',
    };

    return certificateData;
  }

  async generateDeclaration(studentId: string, year: number, purpose: string): Promise<DeclarationData> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
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

    // Traduzir turno
    const shiftTranslation = {
      MORNING: 'Matutino',
      AFTERNOON: 'Vespertino',
      EVENING: 'Noturno',
    };

    const declarationData: DeclarationData = {
      documentType: 'DECLARACAO_MATRICULA',
      studentName: `${student.firstName} ${student.lastName}`,
      birthDate: student.birthDate.toISOString().split('T')[0] || '',
      className: enrollment.class.name,
      shift: shiftTranslation[enrollment.class.shift] || enrollment.class.shift,
      year,
      enrollmentStatus: enrollment.status,
      enrollmentDate: enrollment.createdAt.toISOString().split('T')[0] || '',
      institutionName: 'Escola Synexa',
      institutionAddress: 'Rua das Flores, 123 - Centro - São Paulo/SP',
      city: 'São Paulo',
      issueDate: new Date().toISOString().split('T')[0] || '',
      issuer: 'Sistema Synexa-SIS',
      issuerRole: 'Sistema de Gestão Escolar',
      purpose,
    };

    return declarationData;
  }

  async generateTranscript(studentId: string, startYear?: number, endYear?: number): Promise<TranscriptData> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }

    // Buscar todas as matrículas do aluno
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        ...(startYear && { year: { gte: startYear } }),
        ...(endYear && { year: { lte: endYear } }),
      },
      include: {
        class: true,
      },
      orderBy: {
        year: 'asc',
      },
    });

    if (enrollments.length === 0) {
      throw new BadRequestException('Nenhuma matrícula encontrada para o período especificado');
    }

    // Buscar todas as notas do aluno
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        ...(startYear && { year: { gte: startYear } }),
        ...(endYear && { year: { lte: endYear } }),
      },
      include: {
        subject: true,
        class: true,
      },
      orderBy: [
        { year: 'asc' },
        { subject: { name: 'asc' } },
      ],
    });

    // Agrupar por ano
    const yearGroups = enrollments.map(enrollment => {
      const yearGrades = grades.filter(grade => grade.year === enrollment.year);
      
      const subjects: TranscriptSubject[] = yearGrades.map(grade => ({
        subjectName: grade.subject.name,
        year: grade.year,
        finalGrade: grade.value,
        status: grade.value >= 7.0 ? 'APROVADO' : 'REPROVADO',
        workload: 80, // Padrão de 80 horas por disciplina
      }));

      const yearAverage = subjects.length > 0 
        ? Math.round((subjects.reduce((sum, s) => sum + s.finalGrade, 0) / subjects.length) * 100) / 100
        : 0;

      let yearStatus: 'APROVADO' | 'REPROVADO' | 'EM_RECUPERACAO';
      if (yearAverage >= 7.0) {
        yearStatus = 'APROVADO';
      } else if (yearAverage >= 5.0) {
        yearStatus = 'EM_RECUPERACAO';
      } else {
        yearStatus = 'REPROVADO';
      }

      const transcriptYear: TranscriptYear = {
        year: enrollment.year,
        className: enrollment.class.name,
        subjects,
        yearAverage,
        yearStatus,
      };

      return transcriptYear;
    });

    // Calcular média geral
    const allGrades = grades.map(g => g.value);
    const overallAverage = allGrades.length > 0 
      ? Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 100) / 100
      : 0;

    // Determinar status geral
    const lastEnrollment = enrollments[enrollments.length - 1];
    let overallStatus: 'APROVADO' | 'REPROVADO' | 'CURSANDO';
    
    if (lastEnrollment && lastEnrollment.status === 'ACTIVE') {
      overallStatus = 'CURSANDO';
    } else if (overallAverage >= 7.0) {
      overallStatus = 'APROVADO';
    } else {
      overallStatus = 'REPROVADO';
    }

    const transcriptData: TranscriptData = {
      documentType: 'HISTORICO_ESCOLAR',
      studentName: `${student.firstName} ${student.lastName}`,
      birthDate: student.birthDate.toISOString().split('T')[0] || '',
      rg: '12.345.678-9', // Placeholder - adicionar campo no modelo Student se necessário
      cpf: '123.456.789-00', // Placeholder - adicionar campo no modelo Student se necessário
      motherName: 'Informação não disponível', // Placeholder
      fatherName: 'Informação não disponível', // Placeholder
      years: yearGroups,
      overallAverage,
      overallStatus,
      startDate: enrollments[0]?.createdAt.toISOString().split('T')[0] || '',
      endDate: overallStatus === 'APROVADO' ? new Date().toISOString().split('T')[0] : undefined,
      institutionName: 'Escola Synexa',
      institutionAddress: 'Rua das Flores, 123 - Centro - São Paulo/SP',
      city: 'São Paulo',
      issueDate: new Date().toISOString().split('T')[0] || '',
      issuer: 'Sistema Synexa-SIS',
      issuerRole: 'Sistema de Gestão Escolar',
    };

    return transcriptData;
  }

  // ============= MÉTODOS PARA GERAÇÃO DE PDF =============

  async generateCertificatePdf(studentId: string, year: number): Promise<Buffer> {
    const certificateData = await this.generateCertificate(studentId, year);
    return this.pdfService.generateCertificatePdf(certificateData);
  }

  async generateDeclarationPdf(studentId: string, year: number, purpose: string): Promise<Buffer> {
    const declarationData = await this.generateDeclaration(studentId, year, purpose);
    return this.pdfService.generateDeclarationPdf(declarationData);
  }

  async generateTranscriptPdf(studentId: string, startYear?: number, endYear?: number): Promise<Buffer> {
    const transcriptData = await this.generateTranscript(studentId, startYear, endYear);
    return this.pdfService.generateTranscriptPdf(transcriptData);
  }

  // ============= MÉTODOS PARA GERAÇÃO COMBINADA (JSON + PDF) =============

  async generateCertificateWithPdf(studentId: string, year: number): Promise<{
    data: CertificateData;
    pdf: Buffer;
  }> {
    const data = await this.generateCertificate(studentId, year);
    const pdf = await this.pdfService.generateCertificatePdf(data);
    return { data, pdf };
  }

  async generateDeclarationWithPdf(studentId: string, year: number, purpose: string): Promise<{
    data: DeclarationData;
    pdf: Buffer;
  }> {
    const data = await this.generateDeclaration(studentId, year, purpose);
    const pdf = await this.pdfService.generateDeclarationPdf(data);
    return { data, pdf };
  }

  async generateTranscriptWithPdf(studentId: string, startYear?: number, endYear?: number): Promise<{
    data: TranscriptData;
    pdf: Buffer;
  }> {
    const data = await this.generateTranscript(studentId, startYear, endYear);
    const pdf = await this.pdfService.generateTranscriptPdf(data);
    return { data, pdf };
  }

  // ============= MÉTODOS PARA BOLETIM ESCOLAR ANGOLANO MOVIDOS =============
  // NOTA: Os métodos generateReportCardPdf e generateReportCardWithPdf foram movidos
  // para ReportCardsPdfService para quebrar a dependência circular entre DocumentsModule e ReportCardsModule
}