// Enum para dias da semana (deve corresponder ao backend)
export enum Weekday {
  SEGUNDA = 'SEGUNDA',
  TERCA = 'TERCA',
  QUARTA = 'QUARTA',
  QUINTA = 'QUINTA',
  SEXTA = 'SEXTA',
  SABADO = 'SABADO',
}

// Labels em português para exibição
export const WeekdayLabels: Record<Weekday, string> = {
  [Weekday.SEGUNDA]: 'Segunda-feira',
  [Weekday.TERCA]: 'Terça-feira',
  [Weekday.QUARTA]: 'Quarta-feira',
  [Weekday.QUINTA]: 'Quinta-feira',
  [Weekday.SEXTA]: 'Sexta-feira',
  [Weekday.SABADO]: 'Sábado',
};

// Interface para User
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para Subject
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
  user: User;
  bio?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  createdAt: string;
  updatedAt: string;
}

// Interface para Schedule do backend
export interface Schedule {
  id: string;
  teacherId: string;
  weekday: Weekday;
  startTime: string; // formato "HH:mm"
  endTime: string;   // formato "HH:mm"
  subjectId: string;
  createdAt: string;
  updatedAt: string;
  teacher: Teacher;
  subject: Subject;
}

// DTO para criar horário (conforme backend atual)
export interface CreateScheduleDto {
  teacherId: string;
  subjectId: string;
  weekday: Weekday;
  startTime: string;  // formato "HH:mm"
  endTime: string;    // formato "HH:mm"
}

// DTO para atualizar horário
export interface UpdateScheduleDto extends Partial<CreateScheduleDto> {}

// Interface para exibição na tabela
export interface ScheduleDisplay {
  id: string;
  teacherName: string;
  subjectName: string;
  weekdayLabel: string;
  timeRange: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
}

// Interface para validação de conflitos
export interface ScheduleConflict {
  hasConflicts: boolean;
  conflicts: Schedule[];
}

// Interface para filtros
export interface ScheduleFilters {
  teacherId?: string;
  weekday?: Weekday;
  subjectId?: string;
}