import axios from 'axios';
import { CreateStudentDto, Student, StudentResponse, StudentsListResponse } from '../types/student';
import { Schedule, CreateScheduleDto, UpdateScheduleDto, ScheduleFilters, ScheduleConflict, Weekday } from '../types/schedule';
import { Subject, SubjectWithTeachers, CreateSubjectDto, UpdateSubjectDto, SubjectFilters } from '../types/subject';
import { SchoolClass, SchoolClassWithRelations, CreateClassDto, UpdateClassDto, ClassFilters } from '../types/class';
import { EnrollmentWithRelations, CreateEnrollmentDto, UpdateEnrollmentDto, EnrollmentFilters } from '../types/enrollment';
import { GradeWithRelations, CreateGradeDto, UpdateGradeDto, GradeFilters } from '../types/grade';
import { ReportCard, StudentInfo, GetReportCardDto, ReportFilters } from '../types/report';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Users API functions
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  create: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  update: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

// Students API functions
export const studentsAPI = {
  getAll: async (): Promise<Student[]> => {
    const response = await api.get('/students');
    return response.data;
  },
  
  getById: async (id: string): Promise<StudentResponse> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  
  create: async (studentData: CreateStudentDto): Promise<StudentResponse> => {
    const response = await api.post('/students', studentData);
    return response.data;
  },
  
  update: async (id: string, studentData: Partial<CreateStudentDto>): Promise<StudentResponse> => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
  
  getByClass: async (classId: string): Promise<StudentResponse[]> => {
    const response = await api.get(`/students/class/${classId}`);
    return response.data;
  }
};

// Classes API functions
export const classesAPI = {
  getAll: async (filters?: ClassFilters): Promise<SchoolClassWithRelations[]> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.shift) params.append('shift', filters.shift);
    if (filters?.name) params.append('name', filters.name);
    
    const response = await api.get('/classes', { 
      params: Object.fromEntries(params) 
    });
    return response.data;
  },
  
  getById: async (id: string): Promise<SchoolClassWithRelations> => {
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },
  
  getByYear: async (year: number): Promise<SchoolClassWithRelations[]> => {
    const response = await api.get(`/classes/by-year?year=${year}`);
    return response.data;
  },
  
  create: async (classData: CreateClassDto): Promise<SchoolClassWithRelations> => {
    const response = await api.post('/classes', classData);
    return response.data;
  },
  
  update: async (id: string, classData: UpdateClassDto): Promise<SchoolClassWithRelations> => {
    const response = await api.patch(`/classes/${id}`, classData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/classes/${id}`);
  },
  
  // Legacy function for backwards compatibility
  getByProfessor: async (professorId: string) => {
    const response = await api.get(`/classes/professor/${professorId}`);
    return response.data;
  }
};


// Attendance API functions
export const attendanceAPI = {
  getByClass: async (classId: string, date?: string) => {
    const params = date ? { date } : {};
    const response = await api.get(`/attendance/class/${classId}`, { params });
    return response.data;
  },
  
  record: async (attendanceData: any) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  }
};

// Documents API functions
export const documentsAPI = {
  // ============= CERTIFICADOS =============
  generateCertificate: async (studentId: string, year: number) => {
    const response = await api.post('/documents/certificate', {
      studentId,
      year
    });
    return response.data;
  },

  generateCertificatePdf: async (studentId: string, year: number): Promise<Blob> => {
    const response = await api.post('/documents/certificate/pdf', {
      studentId,
      year
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  generateCertificateWithPdf: async (studentId: string, year: number) => {
    const response = await api.post('/documents/certificate/with-pdf', {
      studentId,
      year
    });
    return response.data;
  },

  // ============= DECLARAÇÕES =============
  generateDeclaration: async (studentId: string, year: number, purpose: string) => {
    const response = await api.post('/documents/declaration', {
      studentId,
      year,
      purpose
    });
    return response.data;
  },

  generateDeclarationPdf: async (studentId: string, year: number, purpose: string): Promise<Blob> => {
    const response = await api.post('/documents/declaration/pdf', {
      studentId,
      year,
      purpose
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  generateDeclarationWithPdf: async (studentId: string, year: number, purpose: string) => {
    const response = await api.post('/documents/declaration/with-pdf', {
      studentId,
      year,
      purpose
    });
    return response.data;
  },

  // ============= HISTÓRICOS ESCOLARES =============
  generateTranscript: async (studentId: string, startYear?: number, endYear?: number) => {
    const response = await api.post('/documents/transcript', {
      studentId,
      startYear,
      endYear
    });
    return response.data;
  },

  generateTranscriptPdf: async (studentId: string, startYear?: number, endYear?: number): Promise<Blob> => {
    const response = await api.post('/documents/transcript/pdf', {
      studentId,
      startYear,
      endYear
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  generateTranscriptWithPdf: async (studentId: string, startYear?: number, endYear?: number) => {
    const response = await api.post('/documents/transcript/with-pdf', {
      studentId,
      startYear,
      endYear
    });
    return response.data;
  },

  // ============= SERVIÇOS DE SISTEMA =============
  getPdfHealth: async () => {
    const response = await api.get('/documents/pdf/health');
    return response.data;
  },

  clearPdfCache: async () => {
    const response = await api.post('/documents/pdf/clear-cache');
    return response.data;
  },

  // ============= HELPER FUNCTIONS =============
  downloadFile: (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Função para gerar boletim PDF (reutiliza do reportsAPI)
  generateReportCardPdf: async (studentId: string, year: number, term?: number): Promise<Blob> => {
    const params = { year, ...(term && { term }) };
    const response = await api.post(`/report-cards/${studentId}/pdf`, params, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Financial API functions
export const financialAPI = {
  getInvoices: async (filters?: any) => {
    const response = await api.get('/financial/invoices', { params: filters });
    return response.data;
  },
  
  createInvoice: async (invoiceData: any) => {
    const response = await api.post('/financial/invoices', invoiceData);
    return response.data;
  },
  
  updateInvoice: async (id: string, invoiceData: any) => {
    const response = await api.put(`/financial/invoices/${id}`, invoiceData);
    return response.data;
  },
  
  cancelInvoice: async (id: string, reason: string) => {
    const response = await api.put(`/financial/invoices/${id}/cancel`, { reason });
    return response.data;
  },
  
  getPaymentPlans: async () => {
    const response = await api.get('/financial/payment-plans');
    return response.data;
  },
  
  createPaymentPlan: async (planData: any) => {
    const response = await api.post('/financial/payment-plans', planData);
    return response.data;
  },
  
  generateBatchInvoices: async (planId: string, targetDate: string) => {
    const response = await api.post('/financial/batch-invoices', { planId, targetDate });
    return response.data;
  },
  
  recordPayment: async (paymentData: any) => {
    const response = await api.post('/financial/payments', paymentData);
    return response.data;
  },
  
  cancelPayment: async (id: string, reason: string) => {
    const response = await api.put(`/financial/payments/${id}/cancel`, { reason });
    return response.data;
  },
  
  getPayments: async (filters?: any) => {
    const response = await api.get('/financial/payments', { params: filters });
    return response.data;
  },
  
  applyExemption: async (invoiceId: string, exemptionData: any) => {
    const response = await api.post(`/financial/invoices/${invoiceId}/exemption`, exemptionData);
    return response.data;
  },
  
  applyDiscount: async (invoiceId: string, discountData: any) => {
    const response = await api.post(`/financial/invoices/${invoiceId}/discount`, discountData);
    return response.data;
  },
  
  getFinancialReports: async (reportType: string, filters?: any) => {
    const response = await api.get(`/financial/reports/${reportType}`, { params: filters });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/financial/stats');
    return response.data;
  },
  
  generateReceipt: async (paymentId: string) => {
    const response = await api.get(`/financial/payments/${paymentId}/receipt`);
    return response.data;
  },
  
  getDefaulters: async () => {
    const response = await api.get('/financial/defaulters');
    return response.data;
  }
};

// Teachers API functions
export const teachersAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/teachers');
    return response.data;
  },
  
  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },
  
  create: async (teacherData: any): Promise<any> => {
    const response = await api.post('/teachers', teacherData);
    return response.data;
  },
  
  update: async (id: string, teacherData: any): Promise<any> => {
    const response = await api.put(`/teachers/${id}`, teacherData);
    return response.data;
  },
  
  delete: async (id: string): Promise<any> => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  }
};

// Subjects API functions
export const subjectsAPI = {
  getAll: async (filters?: SubjectFilters): Promise<SubjectWithTeachers[]> => {
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.teacherId) params.append('teacherId', filters.teacherId);
    
    const response = await api.get('/subjects', { 
      params: Object.fromEntries(params) 
    });
    return response.data;
  },
  
  getById: async (id: string): Promise<SubjectWithTeachers> => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },
  
  getMySubjects: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects/my-subjects');
    return response.data;
  },
  
  create: async (subjectData: CreateSubjectDto): Promise<SubjectWithTeachers> => {
    const response = await api.post('/subjects', subjectData);
    return response.data;
  },
  
  update: async (id: string, subjectData: UpdateSubjectDto): Promise<SubjectWithTeachers> => {
    const response = await api.patch(`/subjects/${id}`, subjectData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  }
};

// Schedules API functions
export const schedulesAPI = {
  getAll: async (filters?: ScheduleFilters): Promise<Schedule[]> => {
    const params = new URLSearchParams();
    if (filters?.teacherId) params.append('teacherId', filters.teacherId);
    if (filters?.weekday) params.append('weekday', filters.weekday);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    
    const response = await api.get('/schedules', { 
      params: Object.fromEntries(params) 
    });
    return response.data;
  },
  
  getById: async (id: string): Promise<Schedule> => {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },
  
  create: async (scheduleData: CreateScheduleDto): Promise<Schedule> => {
    const response = await api.post('/schedules', scheduleData);
    return response.data;
  },
  
  update: async (id: string, scheduleData: UpdateScheduleDto): Promise<Schedule> => {
    const response = await api.patch(`/schedules/${id}`, scheduleData);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/schedules/${id}`);
  },
  
  getByTeacher: async (teacherId: string): Promise<Schedule[]> => {
    const response = await api.get(`/schedules/teacher/${teacherId}`);
    return response.data;
  },
  
  checkConflicts: async (
    teacherId: string, 
    weekday: Weekday, 
    startTime: string, 
    endTime: string
  ): Promise<ScheduleConflict> => {
    const params = new URLSearchParams({
      weekday,
      startTime,
      endTime
    });
    
    const response = await api.get(`/schedules/conflicts/${teacherId}?${params}`);
    return response.data;
  }
};

// Enrollment API functions
export const enrollmentAPI = {
  getAll: async (filters?: EnrollmentFilters): Promise<EnrollmentWithRelations[]> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.classId) params.append('classId', filters.classId);
    
    const response = await api.get('/enrollment', { 
      params: Object.fromEntries(params) 
    });
    return response.data;
  },
  
  getById: async (id: string): Promise<EnrollmentWithRelations> => {
    const response = await api.get(`/enrollment/${id}`);
    return response.data;
  },
  
  getByYear: async (year: number): Promise<EnrollmentWithRelations[]> => {
    const response = await api.get(`/enrollment/by-year?year=${year}`);
    return response.data;
  },
  
  getByClass: async (classId: string): Promise<EnrollmentWithRelations[]> => {
    const response = await api.get(`/enrollment/by-class/${classId}`);
    return response.data;
  },
  
  getByStudent: async (studentId: string): Promise<EnrollmentWithRelations[]> => {
    const response = await api.get(`/enrollment/by-student/${studentId}`);
    return response.data;
  },
  
  create: async (enrollmentData: CreateEnrollmentDto): Promise<EnrollmentWithRelations> => {
    const response = await api.post('/enrollment', enrollmentData);
    return response.data;
  },
  
  update: async (id: string, enrollmentData: UpdateEnrollmentDto): Promise<EnrollmentWithRelations> => {
    const response = await api.patch(`/enrollment/${id}`, enrollmentData);
    return response.data;
  },
  
  delete: async (id: string): Promise<EnrollmentWithRelations> => {
    const response = await api.delete(`/enrollment/${id}`);
    return response.data;
  }
};

// Grades API functions
export const gradesAPI = {
  getAll: async (filters?: GradeFilters): Promise<GradeWithRelations[]> => {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.teacherId) params.append('teacherId', filters.teacherId);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.year) params.append('year', filters.year.toString());
    
    const response = await api.get('/grades', { 
      params: Object.fromEntries(params) 
    });
    return response.data;
  },
  
  getById: async (id: string): Promise<GradeWithRelations> => {
    const response = await api.get(`/grades/${id}`);
    return response.data;
  },
  
  getByStudent: async (studentId: string): Promise<GradeWithRelations[]> => {
    const response = await api.get(`/grades/by-student/${studentId}`);
    return response.data;
  },
  
  getByClass: async (classId: string): Promise<GradeWithRelations[]> => {
    const response = await api.get(`/grades/by-class/${classId}`);
    return response.data;
  },
  
  getBySubject: async (subjectId: string): Promise<GradeWithRelations[]> => {
    const response = await api.get(`/grades/by-subject/${subjectId}`);
    return response.data;
  },
  
  create: async (gradeData: CreateGradeDto): Promise<GradeWithRelations> => {
    const response = await api.post('/grades', gradeData);
    return response.data;
  },
  
  update: async (id: string, gradeData: UpdateGradeDto): Promise<GradeWithRelations> => {
    const response = await api.patch(`/grades/${id}`, gradeData);
    return response.data;
  },
  
  delete: async (id: string): Promise<GradeWithRelations> => {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  }
};

// ==================== REPORTS API ====================

export const reportsAPI = {
  // Gerar boletim de um aluno
  getReportCard: async (studentId: string, params: GetReportCardDto): Promise<ReportCard> => {
    const queryParams = new URLSearchParams({
      year: params.year.toString(),
      ...(params.term && { term: params.term.toString() })
    });
    
    const response = await api.get(`/report-cards/${studentId}?${queryParams}`);
    return response.data;
  },

  // Listar alunos de uma turma para seleção
  getStudentsByClass: async (classId: string, year: number): Promise<StudentInfo[]> => {
    const response = await api.get(`/report-cards/class/${classId}/students?year=${year}`);
    return response.data;
  },

  // Gerar boletins de toda uma turma
  getClassReportCards: async (classId: string, params: GetReportCardDto): Promise<ReportCard[]> => {
    const queryParams = new URLSearchParams({
      year: params.year.toString(),
      ...(params.term && { term: params.term.toString() })
    });
    
    const response = await api.get(`/report-cards/class/${classId}?${queryParams}`);
    return response.data;
  },

  // Baixar PDF do boletim
  downloadReportCardPdf: async (studentId: string, params: GetReportCardDto): Promise<Blob> => {
    const response = await api.post(`/report-cards/${studentId}/pdf`, params, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Baixar PDF com nome personalizado
  downloadReportCardPdfWithFilename: async (
    studentId: string, 
    params: GetReportCardDto
  ): Promise<{ blob: Blob; filename: string }> => {
    const response = await api.post(`/report-cards/${studentId}/pdf`, params, {
      responseType: 'blob',
    });
    
    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers['content-disposition'];
    let filename = `boletim_${studentId}_${params.year}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    return {
      blob: response.data,
      filename,
    };
  },

  // Helper para fazer download direto
  triggerDownload: (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
