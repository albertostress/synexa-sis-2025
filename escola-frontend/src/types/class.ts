// Types para o módulo de Turmas (Classes)

// Interface base para User (reutilizada)
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
  studentNumber: string;
  classId?: string;
  user?: User;
}

// Interface para Teacher (simplificada)
export interface Teacher {
  id: string;
  userId: string;
  bio?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  user: User;
}

// Enum para turnos (conforme backend)
export enum Shift {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING'
}

// Labels para os turnos em português
export const ShiftLabels: Record<Shift, string> = {
  [Shift.MORNING]: 'Manhã',
  [Shift.AFTERNOON]: 'Tarde',
  [Shift.EVENING]: 'Noite'
};

// Interface básica para SchoolClass (conforme backend)
export interface SchoolClass {
  id: string;
  name: string;
  year: number;
  shift: Shift;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

// Interface extendida com relacionamentos
export interface SchoolClassWithRelations extends SchoolClass {
  students: Student[];
  teachers: Teacher[];
}

// DTO para criar turma
export interface CreateClassDto {
  name: string;
  year: number;
  shift: Shift;
  capacity: number;
  studentIds?: string[];
  teacherIds?: string[];
}

// DTO para atualizar turma
export interface UpdateClassDto extends Partial<CreateClassDto> {}

// Interface para filtros de busca
export interface ClassFilters {
  year?: number;
  shift?: Shift;
  name?: string;
}

// Interface para estatísticas da turma
export interface ClassStats {
  totalStudents: number;
  capacity: number;
  availableSpots: number;
  occupancyPercentage: number;
}

// Helper function para calcular estatísticas
export const calculateClassStats = (schoolClass: SchoolClassWithRelations): ClassStats => {
  const totalStudents = schoolClass.students?.length || 0;
  const capacity = schoolClass.capacity;
  const availableSpots = Math.max(0, capacity - totalStudents);
  const occupancyPercentage = capacity > 0 ? Math.round((totalStudents / capacity) * 100) : 0;

  return {
    totalStudents,
    capacity,
    availableSpots,
    occupancyPercentage
  };
};

// Helper function para formatar ano letivo
export const formatSchoolYear = (year: number): string => {
  return `${year}/${year + 1}`;
};

// Helper function para obter cor do badge de lotação
export const getOccupancyBadgeVariant = (percentage: number): 'default' | 'secondary' | 'destructive' => {
  if (percentage >= 100) return 'destructive';
  if (percentage >= 80) return 'default';
  return 'secondary';
};