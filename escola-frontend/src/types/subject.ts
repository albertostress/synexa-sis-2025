// Types para o módulo de Disciplinas (Subjects)

// Interface base para User (reutilizada)
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
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

// Interface básica para Subject (conforme backend)
export interface Subject {
  id: string;
  name: string;
  description?: string;
  code: string;
  year: string;
  category: "Obrigatória" | "Opcional";
  credits: number;
  workloadHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface extendida com professores
export interface SubjectWithTeachers extends Subject {
  teachers: Teacher[];
}

// DTO para criar disciplina
export interface CreateSubjectDto {
  name: string;
  description?: string;
  code: string;
  year: string;
  category: "Obrigatória" | "Opcional";
  credits: number;
  workloadHours: number;
  isActive?: boolean;
  teacherIds?: string[];
}

// DTO para atualizar disciplina
export interface UpdateSubjectDto extends Partial<CreateSubjectDto> {}

// Interface para filtros de busca
export interface SubjectFilters {
  name?: string;
  teacherId?: string;
}

// Interface para resposta da API de professores da disciplina
export interface SubjectTeachersResponse {
  subjectId: string;
  teachers: Teacher[];
}