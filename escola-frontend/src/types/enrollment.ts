// Types para o módulo de Matrículas (Enrollments)

// Enum para status de matrícula (conforme backend)
export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING'
}

// Labels para os status em português
export const EnrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.ACTIVE]: 'Ativa',
  [EnrollmentStatus.TRANSFERRED]: 'Transferida',
  [EnrollmentStatus.CANCELLED]: 'Cancelada',
  [EnrollmentStatus.PENDING]: 'Pendente'
};

// Interface para User (simplificada)
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para Student (simplificada)
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber?: string;
  email?: string;
  birthDate?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

// Interface para SchoolClass (simplificada)
export interface SchoolClass {
  id: string;
  name: string;
  year: number;
  shift: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

// Interface básica para Enrollment (conforme backend)
export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  year: number;
  status: EnrollmentStatus;
  createdAt: string;
}

// Interface extendida com relacionamentos
export interface EnrollmentWithRelations extends Enrollment {
  student: Student;
  class: SchoolClass;
}

// DTO para criar matrícula
export interface CreateEnrollmentDto {
  studentId: string;
  classId: string;
  year: number;
  status: EnrollmentStatus;
}

// DTO para atualizar matrícula
export interface UpdateEnrollmentDto extends Partial<CreateEnrollmentDto> {}

// Interface para filtros de busca
export interface EnrollmentFilters {
  year?: number;
  status?: EnrollmentStatus;
  studentId?: string;
  classId?: string;
}

// Interface para estatísticas de matrícula
export interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  cancelledEnrollments: number;
  transferredEnrollments: number;
}

// Helper function para calcular estatísticas
export const calculateEnrollmentStats = (enrollments: EnrollmentWithRelations[]): EnrollmentStats => {
  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.ACTIVE).length;
  const pendingEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.PENDING).length;
  const cancelledEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.CANCELLED).length;
  const transferredEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.TRANSFERRED).length;

  return {
    totalEnrollments,
    activeEnrollments,
    pendingEnrollments,
    cancelledEnrollments,
    transferredEnrollments
  };
};

// Helper function para formatar nome completo do aluno
export const formatStudentName = (student: Student): string => {
  return `${student.firstName} ${student.lastName}`;
};

// Helper function para obter cor do badge de status
export const getStatusBadgeVariant = (status: EnrollmentStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case EnrollmentStatus.ACTIVE:
      return 'default';
    case EnrollmentStatus.PENDING:
      return 'secondary';
    case EnrollmentStatus.CANCELLED:
      return 'destructive';
    case EnrollmentStatus.TRANSFERRED:
      return 'outline';
    default:
      return 'secondary';
  }
};

// Helper function para formatar data de criação
export const formatEnrollmentDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// Helper function para formatar ano letivo
export const formatSchoolYear = (year: number): string => {
  return `${year}/${year + 1}`;
};