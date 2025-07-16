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
}

export async function getAllTeachers(): Promise<Teacher[]> {
  const response = await api.get('/teachers');
  return response.data;
}

export async function getTeacherById(id: string): Promise<Teacher> {
  const response = await api.get(`/teachers/${id}`);
  return response.data;
}

export async function createTeacher(teacherData: { userId: string; bio?: string }): Promise<Teacher> {
  const response = await api.post('/teachers', teacherData);
  return response.data;
}

export async function updateTeacher(id: string, teacherData: Partial<Teacher>): Promise<Teacher> {
  const response = await api.put(`/teachers/${id}`, teacherData);
  return response.data;
}

export async function deleteTeacher(id: string): Promise<void> {
  await api.delete(`/teachers/${id}`);
}