export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  gender: 'MASCULINO' | 'FEMININO';
  birthDate: string;
  phone: string;
  bloodType?: string;
  studentNumber: string;
  academicYear: string;
  classId: string;
  profilePhotoUrl?: string;
  guardianName: string;
  guardianPhone: string;
  municipality: string;
  province: string;
  country: string;
  parentEmail: string;
  parentPhone: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'MASCULINO' | 'FEMININO';
  birthDate: string;
  phone: string;
  bloodType?: string;
  studentNumber: string;
  academicYear: string;
  classId: string;
  profilePhotoUrl?: string;
  guardianName: string;
  guardianPhone: string;
  municipality: string;
  province: string;
  country: string;
  parentEmail: string;
  parentPhone: string;
  createdAt: string;
  updatedAt: string;
  schoolClass?: {
    id: string;
    name: string;
    year: number;
    shift: string;
  };
}

export interface StudentResponse {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'MASCULINO' | 'FEMININO';
  birthDate: string;
  phone: string;
  bloodType?: string;
  studentNumber: string;
  academicYear: string;
  classId: string;
  profilePhotoUrl?: string;
  guardianName: string;
  guardianPhone: string;
  municipality: string;
  province: string;
  country: string;
  parentEmail: string;
  parentPhone: string;
  createdAt: string;
  updatedAt: string;
  schoolClass?: {
    id: string;
    name: string;
    year: number;
    shift: string;
  };
}

export interface StudentsListResponse {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}