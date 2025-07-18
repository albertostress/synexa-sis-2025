// Types para o módulo de Relatórios (Reports)
// Sistema Angolano de Boletins Escolares

import { GradeType } from './grade';

// Interface para detalhes de nota angolana
export interface AngolanGradeDetail {
  type: GradeType;
  value: number;
  term: number;
}

// Interface para nota por disciplina
export interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  subjectDescription?: string;
  grades: AngolanGradeDetail[];
  averageGrade?: number;
  absences: number;
  teacherName: string;
  teacherEmail: string;
}

// Interface para informações do aluno
export interface StudentInfo {
  id: string;
  name: string;
  parentEmail: string;
  studentNumber: string;
  birthDate: string;
}

// Interface para informações da turma
export interface ClassInfo {
  id: string;
  name: string;
  shift: string;
  capacity: number;
}

// Interface para informações da escola
export interface SchoolInfo {
  name: string;
  province: string;
  municipality: string;
}

// Interface principal do boletim
export interface ReportCard {
  student: StudentInfo;
  class: ClassInfo;
  year: number;
  term?: number;
  subjects: SubjectGrade[];
  averageGrade: number;
  attendancePercentage: number;
  status: 'APROVADO' | 'REPROVADO' | 'EM_RECUPERACAO';
  school: SchoolInfo;
  generatedAt: string;
}

// DTO para buscar boletim
export interface GetReportCardDto {
  year: number;
  term?: number;
}

// Interface para filtros de busca
export interface ReportFilters {
  studentId?: string;
  classId?: string;
  year?: number;
  term?: number;
}

// Helper function para obter status badge
export const getStatusBadge = (status: string) => {
  const variants = {
    APROVADO: 'default',
    REPROVADO: 'destructive',
    EM_RECUPERACAO: 'outline',
  };

  return variants[status as keyof typeof variants] || 'outline';
};

// Helper function para obter classificação por nota
export const getGradeClassification = (grade: number) => {
  if (grade >= 17) return { label: 'Excelente', color: 'text-green-700' };
  if (grade >= 14) return { label: 'Muito Bom', color: 'text-green-600' };
  if (grade >= 12) return { label: 'Bom', color: 'text-blue-600' };
  if (grade >= 10) return { label: 'Satisfatório', color: 'text-yellow-600' };
  return { label: 'Não Satisfatório', color: 'text-red-600' };
};

// Helper function para formatar ano letivo
export const formatAcademicYear = (year: number): string => {
  return `${year}/${year + 1}`;
};

// Helper function para formatar trimestre
export const formatTerm = (term?: number): string => {
  if (!term) return 'Boletim Final';
  return `${term}º Trimestre`;
};

// Helper function para obter nome do tipo de avaliação
export const getGradeTypeName = (type: GradeType): string => {
  const names: Record<GradeType, string> = {
    [GradeType.MAC]: 'MAC',
    [GradeType.NPP]: 'NPP', 
    [GradeType.NPT]: 'NPT',
    [GradeType.MT]: 'MT',
    [GradeType.FAL]: 'FAL'
  };
  return names[type] || type;
};

// Helper function para obter descrição completa do tipo
export const getGradeTypeDescription = (type: GradeType): string => {
  const descriptions: Record<GradeType, string> = {
    [GradeType.MAC]: 'Média das Avaliações Contínuas',
    [GradeType.NPP]: 'Nota da Prova do Professor',
    [GradeType.NPT]: 'Nota da Prova Trimestral', 
    [GradeType.MT]: 'Média Trimestral',
    [GradeType.FAL]: 'Faltas'
  };
  return descriptions[type] || type;
};