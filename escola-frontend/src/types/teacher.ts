export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
  bio?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface CreateTeacherDto {
  userId: string;
  bio?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
}