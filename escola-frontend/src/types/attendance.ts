/**
 * Tipos para módulo de Presenças - Sistema Escolar Angolano
 * Adaptado para controle de frequência escolar angolana
 */

// Status de presença específicos para Angola
export type AttendanceStatus = 'PRESENTE' | 'AUSENTE' | 'ATRASADO' | 'JUSTIFICADO';

// Interface para registro individual de presença
export interface StudentAttendanceRecord {
  studentId: string;
  present: boolean;
  justified?: boolean;
  note?: string;
}

// Interface para marcar presença da turma
export interface MarkAttendanceDto {
  date: string; // YYYY-MM-DD
  classId: string;
  subjectId: string;
  attendances: StudentAttendanceRecord[];
}

// Interface para resposta de presença individual
export interface AttendanceEntity {
  id: string;
  date: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
    shift: string;
  };
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
  present: boolean;
  justified: boolean;
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para resumo de presença por aluno
export interface StudentAttendanceSummary {
  student: {
    id: string;
    name: string;
    email: string;
  };
  totalClasses: number;
  totalPresent: number;
  totalAbsent: number;
  totalJustified: number;
  attendancePercentage: number;
  bySubject: Array<{
    subjectId: string;
    subjectName: string;
    totalClasses: number;
    totalPresent: number;
    attendancePercentage: number;
  }>;
}

// Interface para relatório de presença da turma
export interface ClassAttendanceReport {
  class: {
    id: string;
    name: string;
    shift: string;
  };
  date: string;
  subject?: {
    id: string;
    name: string;
  };
  attendances: Array<{
    studentId: string;
    studentName: string;
    present: boolean;
    justified: boolean;
    note?: string;
  }>;
  summary: {
    totalStudents: number;
    totalPresent: number;
    totalAbsent: number;
    totalJustified: number;
  };
}

// Interface para lista paginada de presenças
export interface AttendanceListResponse {
  data: AttendanceEntity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface para filtros de busca
export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
  subjectId?: string;
  studentId?: string;
  classId?: string;
  page?: number;
  limit?: number;
}

// Interface para atualização de presença
export interface UpdateAttendanceDto {
  present?: boolean;
  justified?: boolean;
  note?: string;
}

// Interface para estudante na lista de chamada
export interface StudentForAttendance {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  currentStatus?: AttendanceStatus;
}

// Interface para turma com estudantes
export interface ClassWithStudents {
  id: string;
  name: string;
  shift: string;
  year: number;
  students: StudentForAttendance[];
}

// Interface para disciplina
export interface SubjectForAttendance {
  id: string;
  name: string;
  code?: string;
}

// Dados para dashboard de presenças
export interface AttendanceDashboard {
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalJustified: number;
  attendanceRate: number;
  classBreakdown: Array<{
    classId: string;
    className: string;
    totalStudents: number;
    totalPresent: number;
    attendanceRate: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    attendanceRate: number;
  }>;
}

// Labels traduzidos para português angolano
export const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente', 
  ATRASADO: 'Atrasado',
  JUSTIFICADO: 'Justificado',
};

// Cores para badges de status
export const AttendanceStatusColors: Record<AttendanceStatus, string> = {
  PRESENTE: 'bg-green-100 text-green-800 border-green-200',
  AUSENTE: 'bg-red-100 text-red-800 border-red-200',
  ATRASADO: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
  JUSTIFICADO: 'bg-blue-100 text-blue-800 border-blue-200',
};

// Ícones para cada status
export const AttendanceStatusIcons: Record<AttendanceStatus, string> = {
  PRESENTE: '✓',
  AUSENTE: '✗',
  ATRASADO: '⏰',
  JUSTIFICADO: '📋',
};

// Turnos escolares em Angola
export const SchoolShifts = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde', 
  EVENING: 'Noite',
} as const;

export type SchoolShift = keyof typeof SchoolShifts;

// Meses em português angolano
export const MonthsPortuguese = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

// Interface para relatório de frequência mensal
export interface MonthlyAttendanceReport {
  month: number;
  year: number;
  classId: string;
  className: string;
  students: Array<{
    studentId: string;
    studentName: string;
    totalClasses: number;
    totalPresent: number;
    totalAbsent: number;
    totalJustified: number;
    attendancePercentage: number;
    status: 'APROVADO' | 'REPROVADO' | 'EM_RISCO'; // Baseado na frequência mínima (75% em Angola)
  }>;
  summary: {
    totalStudents: number;
    averageAttendance: number;
    studentsAtRisk: number; // Abaixo de 75%
    studentsApproved: number; // Acima de 75%
  };
}