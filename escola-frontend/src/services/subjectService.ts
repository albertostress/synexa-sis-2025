import { api } from '@/lib/api';

export interface Subject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  teachers: Teacher[];
}

export interface Teacher {
  id: string;
  userId: string;
  bio?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface SubjectPayload {
  name: string;
  description?: string;
  teacherIds?: string[];
}

export async function getAllSubjects(): Promise<Subject[]> {
  const response = await api.get('/subjects');
  return response.data;
}

export async function getMySubjects(): Promise<Subject[]> {
  const response = await api.get('/subjects/my-subjects');
  return response.data;
}

export async function getSubjectById(id: string): Promise<Subject> {
  const response = await api.get(`/subjects/${id}`);
  return response.data;
}

export async function createSubject(subjectData: SubjectPayload): Promise<Subject> {
  const response = await api.post('/subjects', subjectData);
  return response.data;
}

export async function updateSubject(id: string, subjectData: Partial<SubjectPayload>): Promise<Subject> {
  const response = await api.patch(`/subjects/${id}`, subjectData);
  return response.data;
}

export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/subjects/${id}`);
}

export async function getAllTeachers(): Promise<Teacher[]> {
  const response = await api.get('/teachers');
  return response.data;
}