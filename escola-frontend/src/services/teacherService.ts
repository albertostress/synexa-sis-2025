import { api } from '@/lib/api';

export interface Teacher {
  id: string;
  userId: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  // Campos calculados/simulados para a interface
  tipo?: string;
  disciplinas?: string[];
  turmas?: string[];
  experiencia?: number;
  active?: boolean;
}

// Função para processar dados da API e adicionar campos simulados
function processTeacherData(teacher: any): Teacher {
  // Simular dados baseados na biografia e informações disponíveis
  const disciplinasSimuladas = ['Matemática', 'Física', 'Química', 'História', 'Geografia', 'Português', 'Inglês', 'Biologia'];
  const turmasSimuladas = ['7º A', '7º B', '8º A', '8º B', '9º A', '9º B', '10º A', '10º B'];
  const tiposSimulados = ['Efetivo', 'Contratado', 'Substituto'];
  
  // Gerar dados consistentes baseados no ID
  const hashId = teacher.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    ...teacher,
    tipo: tiposSimulados[hashId % tiposSimulados.length],
    disciplinas: disciplinasSimuladas.slice(hashId % 3, (hashId % 3) + 2 + (hashId % 2)),
    turmas: turmasSimuladas.slice(hashId % 4, (hashId % 4) + 2 + (hashId % 2)),
    experiencia: 3 + (hashId % 15), // 3 a 18 anos de experiência
    active: teacher.user.role === 'PROFESSOR' // Ativo se role for PROFESSOR
  };
}

export async function getAllTeachers(): Promise<Teacher[]> {
  const response = await api.get('/teachers');
  return response.data.map(processTeacherData);
}

export async function getTeacherById(id: string): Promise<Teacher> {
  const response = await api.get(`/teachers/${id}`);
  return response.data;
}

export interface TeacherPayload {
  userId: string;
  biography?: string;
  specialization?: string;
  qualification?: string;
  phone?: string;
  experience?: number;
  email?: string;
  fullName?: string;
}

export async function createTeacher(teacherData: TeacherPayload): Promise<Teacher> {
  const response = await api.post('/teachers', teacherData);
  return response.data;
}

export async function updateTeacher(id: string, teacherData: Partial<TeacherPayload>): Promise<Teacher> {
  const response = await api.put(`/teachers/${id}`, teacherData);
  return response.data;
}

export async function deleteTeacher(id: string): Promise<void> {
  await api.delete(`/teachers/${id}`);
}