// Types para o módulo de Notas (Grades)
// Sistema Angolano de Avaliação

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
  email?: string;
  birthDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para Subject (simplificada)
export interface Subject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para Teacher (simplificada)
export interface Teacher {
  id: string;
  userId: string;
  bio?: string;
  user: Omit<User, 'password'>;
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

// Enum para tipos de avaliação (Sistema Angolano)
export enum GradeType {
  MAC = 'MAC',  // Média das Avaliações Contínuas
  NPP = 'NPP',  // Nota da Prova do Professor
  NPT = 'NPT',  // Nota da Prova Trimestral
  MT = 'MT',    // Média Trimestral
  FAL = 'FAL'   // Faltas
}

// Interface básica para Grade (conforme backend)
export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  type: GradeType;
  term: number;     // Trimestre: 1, 2, 3
  year: number;
  value: number;    // 0-20 (Sistema Angolano)
  createdAt: string;
  updatedAt: string;
}

// Interface estendida com relacionamentos
export interface GradeWithRelations extends Grade {
  student: Student;
  subject: Subject;
  teacher: Teacher;
  class: SchoolClass;
}

// DTO para criar nota
export interface CreateGradeDto {
  studentId: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  type: GradeType;
  term: number;
  year: number;
  value: number;
}

// DTO para atualizar nota
export interface UpdateGradeDto extends Partial<CreateGradeDto> {}

// Interface para filtros de busca
export interface GradeFilters {
  studentId?: string;
  subjectId?: string;
  teacherId?: string;
  classId?: string;
  type?: GradeType;
  term?: number;
  year?: number;
}

// Interface para estatísticas de notas
export interface GradeStats {
  totalGrades: number;
  averageGrade: number;
  passedStudents: number;
  failedStudents: number;
  excellentGrades: number;
  goodGrades: number;
  satisfactoryGrades: number;
  unsatisfactoryGrades: number;
}

// Helper function para calcular estatísticas
export const calculateGradeStats = (grades: GradeWithRelations[]): GradeStats => {
  const totalGrades = grades.length;
  const averageGrade = totalGrades > 0 ? grades.reduce((sum, grade) => sum + grade.value, 0) / totalGrades : 0;
  const passedStudents = grades.filter(g => g.value >= 10).length;
  const failedStudents = grades.filter(g => g.value < 10).length;
  const excellentGrades = grades.filter(g => g.value >= 17).length;
  const goodGrades = grades.filter(g => g.value >= 14 && g.value < 17).length;
  const satisfactoryGrades = grades.filter(g => g.value >= 10 && g.value < 14).length;
  const unsatisfactoryGrades = grades.filter(g => g.value < 10).length;

  return {
    totalGrades,
    averageGrade,
    passedStudents,
    failedStudents,
    excellentGrades,
    goodGrades,
    satisfactoryGrades,
    unsatisfactoryGrades
  };
};

// Helper function para formatar nome completo do aluno
export const formatStudentName = (student: Student): string => {
  return `${student.firstName} ${student.lastName}`;
};

// Helper function para formatar nome completo do professor
export const formatTeacherName = (teacher: Teacher): string => {
  return teacher.user.name;
};

// Helper function para obter classificação qualitativa da nota (Sistema Angolano 0-20)
export const getGradeClassification = (value: number): { label: string; color: string } => {
  if (value >= 17) return { label: 'Excelente', color: 'text-green-700' };
  if (value >= 14) return { label: 'Muito Bom', color: 'text-green-600' };
  if (value >= 12) return { label: 'Bom', color: 'text-blue-600' };
  if (value >= 10) return { label: 'Satisfatório', color: 'text-yellow-600' };
  return { label: 'Não Satisfatório', color: 'text-red-600' };
};

// Helper function para obter cor do badge de classificação
export const getGradeBadgeVariant = (value: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (value >= 17) return 'default';
  if (value >= 14) return 'secondary';
  if (value >= 10) return 'outline';
  return 'destructive';
};

// Helper function para formatar data
export const formatGradeDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// Helper function para formatar ano letivo
export const formatSchoolYear = (year: number): string => {
  return `${year}/${year + 1}`;
};

// Helper function para obter nome do tipo de avaliação
export const getGradeTypeName = (type: GradeType): string => {
  const names: Record<GradeType, string> = {
    [GradeType.MAC]: 'Média das Avaliações Contínuas',
    [GradeType.NPP]: 'Nota da Prova do Professor',
    [GradeType.NPT]: 'Nota da Prova Trimestral',
    [GradeType.MT]: 'Média Trimestral',
    [GradeType.FAL]: 'Faltas'
  };
  return names[type] || type;
};

// Helper function para formatar trimestre
export const formatTerm = (term: number): string => {
  return `${term}º Trimestre`;
};

// Helper function para validar nota (Sistema Angolano 0-20)
export const isValidGrade = (value: number): boolean => {
  return value >= 0 && value <= 20;
};

// Helper function para determinar se o aluno passou
export const isStudentPassed = (value: number): boolean => {
  return value >= 10;
};