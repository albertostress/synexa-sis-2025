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
  // ============= REGISTRAR PRESENÇAS =============
  markAttendance: async (data: {
    date: string;
    classId: string;
    subjectId: string;
    attendances: Array<{
      studentId: string;
      present: boolean;
      justified?: boolean;
      note?: string;
    }>;
  }) => {
    const response = await api.post('/attendance/mark', data);
    return response.data;
  },

  // ============= CONSULTAR PRESENÇAS =============
  getClassAttendance: async (classId: string, date: string, subjectId?: string) => {
    const params = new URLSearchParams({ date });
    if (subjectId) params.append('subjectId', subjectId);
    
    const response = await api.get(`/attendance/class/${classId}?${params}`);
    return response.data;
  },

  getStudentAttendance: async (studentId: string, filters?: {
    startDate?: string;
    endDate?: string;
    subjectId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);

    const response = await api.get(`/attendance/student/${studentId}?${params}`);
    return response.data;
  },

  // ============= LISTAR PRESENÇAS =============
  listAttendances: async (filters?: {
    startDate?: string;
    endDate?: string;
    subjectId?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/attendance?${params}`);
    return response.data;
  },

  // ============= EDITAR PRESENÇAS =============
  updateAttendance: async (attendanceId: string, data: {
    present?: boolean;
    justified?: boolean;
    note?: string;
  }) => {
    const response = await api.patch(`/attendance/${attendanceId}`, data);
    return response.data;
  },

  // ============= DELETAR PRESENÇAS (ADMIN) =============
  deleteAttendance: async (attendanceId: string) => {
    const response = await api.delete(`/attendance/${attendanceId}`);
    return response.data;
  },

  // ============= FUNCÕES AUXILIARES =============
  
  // Calcular percentual de frequência
  calculateAttendancePercentage: (totalPresent: number, totalClasses: number): number => {
    if (totalClasses === 0) return 0;
    return Math.round((totalPresent / totalClasses) * 1000) / 10;
  },

  // Verificar se aluno está em risco (abaixo de 75% - padrão Angola)
  isStudentAtRisk: (attendancePercentage: number): boolean => {
    return attendancePercentage < 75;
  },

  // Determinar status baseado na frequência
  getAttendanceStatus: (attendancePercentage: number): 'APROVADO' | 'REPROVADO' | 'EM_RISCO' => {
    if (attendancePercentage >= 75) return 'APROVADO';
    if (attendancePercentage >= 50) return 'EM_RISCO';
    return 'REPROVADO';
  },

  // Formatar data para o backend (YYYY-MM-DD)
  formatDateForBackend: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  // Formatar data para exibição (DD/MM/YYYY)
  formatDateForDisplay: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-AO');
  },

  // ============= RELATÓRIOS ESPECÍFICOS =============
  
  // Gerar relatório mensal de frequência
  generateMonthlyReport: async (classId: string, month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const response = await api.get('/attendance', {
      params: {
        startDate,
        endDate,
        limit: 1000 // Para pegar todos os registros do mês
      }
    });
    
    return response.data;
  },

  // Obter estatísticas da turma para dashboard
  getClassDashboard: async (classId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/attendance/class/${classId}?${params}`);
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
  // ============= FATURAS =============
  getInvoices: async (filters?: {
    studentId?: string;
    status?: string;
    month?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/finance/invoices', { params: filters });
    return response.data;
  },
  
  getInvoiceById: async (id: string) => {
    const response = await api.get(`/finance/invoice/${id}`);
    return response.data;
  },
  
  createInvoice: async (invoiceData: {
    studentId: string;
    amount: number;
    dueDate: string;
    description: string;
    month: number;
    year: number;
  }) => {
    const response = await api.post('/finance/invoice', invoiceData);
    return response.data;
  },
  
  cancelInvoice: async (id: string) => {
    const response = await api.post(`/finance/invoice/${id}/cancel`);
    return response.data;
  },
  
  deleteInvoice: async (id: string) => {
    const response = await api.delete(`/finance/invoice/${id}`);
    return response.data;
  },
  
  // ============= PAGAMENTOS =============
  payInvoice: async (id: string, paymentData: {
    amount: number;
    method: string;
    reference?: string;
  }) => {
    const response = await api.post(`/finance/invoice/${id}/pay`, paymentData);
    return response.data;
  },
  
  // ============= HISTÓRICO FINANCEIRO =============
  getStudentHistory: async (studentId: string) => {
    const response = await api.get(`/finance/student/${studentId}/history`);
    return response.data;
  },
  
  // ============= PDF GENERATION =============
  generateInvoicePdf: async (invoiceId: string): Promise<Blob> => {
    const response = await api.get(`/finance/invoice/${invoiceId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  // ============= FUNÇÕES AUXILIARES =============
  
  // Formatar moeda angolana
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },
  
  // Calcular status da fatura
  calculateInvoiceStatus: (invoice: any): string => {
    if (invoice.status === 'CANCELADA') return 'CANCELADA';
    if (invoice.paidAmount >= invoice.amount) return 'PAGA';
    if (invoice.paidAmount > 0 && invoice.paidAmount < invoice.amount) return 'PARCIAL';
    if (new Date(invoice.dueDate) < new Date() && invoice.paidAmount === 0) return 'VENCIDA';
    return 'PENDENTE';
  },
  
  // Calcular idade da dívida em dias
  calculateDebtAge: (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - due.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  
  // Verificar se fatura está vencida
  isOverdue: (dueDate: string): boolean => {
    return new Date(dueDate) < new Date();
  },
  
  // Formatar número da fatura
  formatInvoiceNumber: (id: string, month: number, year: number): string => {
    const monthStr = month.toString().padStart(2, '0');
    const shortId = id.substring(0, 8).toUpperCase();
    return `FAT-${year}${monthStr}-${shortId}`;
  },
  
  // Gerar referência Multicaixa mock
  generateMulticaixaReference: (invoiceId: string, amount: number): string => {
    // Simular geração de referência Multicaixa
    const entity = '00324'; // Entidade bancária
    const reference = Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
    return `${entity} ${reference}`;
  },
  
  // Validar IBAN angolano
  validateAngolanIBAN: (iban: string): boolean => {
    // IBAN angolano: AO06 seguido de 21 dígitos
    const angolanIBANRegex = /^AO06\d{21}$/;
    return angolanIBANRegex.test(iban.replace(/\s/g, ''));
  },
  
  // Obter métodos de pagamento populares em Angola
  getPaymentMethods: () => [
    { value: 'DINHEIRO', label: 'Dinheiro', icon: '💵' },
    { value: 'TRANSFERENCIA', label: 'Transferência Bancária', icon: '🏦' },
    { value: 'MULTICAIXA', label: 'Multicaixa', icon: '💳' },
    { value: 'EXPRESS', label: 'Multicaixa Express', icon: '📱' },
    { value: 'PAYWAY', label: 'PayWay', icon: '💰' },
    { value: 'CARTAO', label: 'Cartão', icon: '💳' },
    { value: 'CHEQUE', label: 'Cheque', icon: '📝' },
  ],
  
  // Helper para fazer download de PDF
  downloadInvoicePdf: async (invoiceId: string, filename: string) => {
    try {
      const blob = await financialAPI.generateInvoicePdf(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `fatura_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      throw error;
    }
  },
  
  // Verificar permissões
  canManageFinance: (userRole: string): boolean => {
    return ['ADMIN', 'SECRETARIA'].includes(userRole);
  },
  
  canViewFinance: (userRole: string): boolean => {
    return ['ADMIN', 'SECRETARIA', 'DIRETOR'].includes(userRole);
  },
  
  // Constantes para Angola
  constants: {
    currency: {
      code: 'AOA',
      symbol: 'Kz',
      locale: 'pt-AO',
    },
    academicPeriod: {
      startMonth: 2,  // Fevereiro
      endMonth: 11,   // Novembro
    },
    gracePeriodDays: 5,
    latePaymentFee: 0.02, // 2% ao mês
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

// Communication API functions
export const communicationAPI = {
  // ============= INBOX - MENSAGENS RECEBIDAS =============
  getInboxMessages: async (filters?: {
    priority?: string;
    audience?: string;
    startDate?: string;
    endDate?: string;
    isRead?: boolean;
    searchTerm?: string;
    includeExpired?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.audience) params.append('audience', filters.audience);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters?.includeExpired !== undefined) params.append('includeExpired', filters.includeExpired.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/communication/inbox?${params}`);
    return response.data;
  },

  // ============= MENSAGENS ENVIADAS =============
  getSentMessages: async (page = 1, limit = 20) => {
    const response = await api.get('/communication/sent', {
      params: { page, limit }
    });
    return response.data;
  },

  // ============= CRIAR MENSAGEM =============
  createMessage: async (messageData: {
    title: string;
    content: string;
    priority: string;
    audience: string[];
    targetUsers?: string[];
    targetClassId?: string;
    expiresAt?: string;
  }) => {
    const response = await api.post('/communication/messages', messageData);
    return response.data;
  },

  // ============= BUSCAR MENSAGEM ESPECÍFICA =============
  getMessageById: async (messageId: string) => {
    const response = await api.get(`/communication/messages/${messageId}`);
    return response.data;
  },

  // ============= MARCAR COMO LIDA =============
  markAsRead: async (messageId: string) => {
    const response = await api.post(`/communication/messages/${messageId}/read`);
    return response.data;
  },

  // ============= ATUALIZAR MENSAGEM =============
  updateMessage: async (messageId: string, updateData: {
    title?: string;
    content?: string;
    priority?: string;
    audience?: string[];
    targetUsers?: string[];
    targetClassId?: string;
    expiresAt?: string;
  }) => {
    const response = await api.put(`/communication/messages/${messageId}`, updateData);
    return response.data;
  },

  // ============= DELETAR MENSAGEM (SOFT DELETE) =============
  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/communication/messages/${messageId}`);
    return response.data;
  },

  // ============= ESTATÍSTICAS (ADMIN/DIRETOR) =============
  getStats: async () => {
    const response = await api.get('/communication/stats');
    return response.data;
  },

  // ============= FUNÇÕES AUXILIARES =============
  
  // Calcular taxa de leitura
  calculateReadRate: (readCount: number, totalRecipients: number): number => {
    if (totalRecipients === 0) return 0;
    return Math.round((readCount / totalRecipients) * 100);
  },

  // Verificar se mensagem é urgente
  isUrgentMessage: (priority: string, isExpired: boolean): boolean => {
    return priority === 'URGENT' && !isExpired;
  },

  // Determinar status visual da mensagem
  getMessageStatus: (isRead: boolean, readCount: number): 'SENT' | 'DELIVERED' | 'READ' => {
    if (isRead) return 'read';
    if (readCount > 0) return 'DELIVERED';
    return 'SENT';
  },

  // Formatear data para exibição
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Formatar audiência para exibição
  formatAudience: (audience: string[], targetClassId?: string): string => {
    const audienceLabels: Record<string, string> = {
      'PARENTS': 'Todos os Pais',
      'TEACHERS': 'Todos os Professores',
      'ALL_STAFF': 'Todo o Pessoal',
      'SPECIFIC_CLASS': 'Turma Específica',
      'INDIVIDUAL': 'Usuários Específicos',
      'GROUP': 'Grupo Personalizado',
    };

    if (audience.length === 1) {
      const aud = audience[0];
      if (aud === 'SPECIFIC_CLASS') {
        return `Turma: ${targetClassId || 'Não especificada'}`;
      }
      return audienceLabels[aud] || aud;
    }
    
    if (audience.length <= 2) {
      return audience.map(a => audienceLabels[a] || a).join(', ');
    }
    
    return `${audience.length} grupos selecionados`;
  },

  // Verificar permissões de edição
  canEditMessage: (messageCreatedBy: string, currentUserId: string, userRole: string): boolean => {
    // Admin e Diretor podem editar qualquer mensagem
    if (['ADMIN', 'DIRETOR'].includes(userRole)) {
      return true;
    }
    
    // Secretaria pode editar próprias mensagens
    if (userRole === 'SECRETARIA' && messageCreatedBy === currentUserId) {
      return true;
    }
    
    return false;
  },

  // Verificar se pode criar mensagens
  canCreateMessage: (userRole: string): boolean => {
    return ['ADMIN', 'DIRETOR', 'SECRETARIA'].includes(userRole);
  },

  // Verificar se pode ver estatísticas
  canViewStats: (userRole: string): boolean => {
    return ['ADMIN', 'DIRETOR'].includes(userRole);
  },

  // ============= BUSCA E FILTROS AVANÇADOS =============
  
  // Buscar mensagens com filtros combinados
  searchMessages: async (searchParams: {
    searchTerm?: string;
    priority?: string;
    audience?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    onlyUnread?: boolean;
    includeExpired?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    
    if (searchParams.searchTerm) {
      params.append('searchTerm', searchParams.searchTerm);
    }
    if (searchParams.priority) {
      params.append('priority', searchParams.priority);
    }
    if (searchParams.audience) {
      params.append('audience', searchParams.audience);
    }
    if (searchParams.dateRange) {
      params.append('startDate', searchParams.dateRange.start);
      params.append('endDate', searchParams.dateRange.end);
    }
    if (searchParams.onlyUnread) {
      params.append('isRead', 'false');
    }
    if (searchParams.includeExpired !== undefined) {
      params.append('includeExpired', searchParams.includeExpired.toString());
    }
    if (searchParams.page) {
      params.append('page', searchParams.page.toString());
    }
    if (searchParams.limit) {
      params.append('limit', searchParams.limit.toString());
    }

    const response = await api.get(`/communication/inbox?${params}`);
    return response.data;
  },

  // ============= NOTIFICAÇÕES E ATUALIZAÇÕES =============
  
  // Buscar mensagens não lidas (para notificações)
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/communication/inbox', {
      params: { 
        isRead: false, 
        includeExpired: false,
        limit: 1 // Só precisamos do count
      }
    });
    return response.data.pagination?.total || 0;
  },

  // Buscar mensagens urgentes não lidas
  getUrgentUnreadMessages: async () => {
    const response = await api.get('/communication/inbox', {
      params: {
        priority: 'URGENT',
        isRead: false,
        includeExpired: false,
        limit: 50
      }
    });
    return response.data.data || [];
  },

  // ============= VALIDAÇÕES =============
  
  // Validar dados de criação de mensagem
  validateMessageData: (data: {
    title: string;
    content: string;
    audience: string[];
    targetUsers?: string[];
    targetClassId?: string;
  }): string[] => {
    const errors: string[] = [];
    
    if (!data.title || data.title.length < 5) {
      errors.push('Título deve ter pelo menos 5 caracteres');
    }
    if (data.title && data.title.length > 200) {
      errors.push('Título deve ter no máximo 200 caracteres');
    }
    
    if (!data.content || data.content.length < 10) {
      errors.push('Conteúdo deve ter pelo menos 10 caracteres');
    }
    if (data.content && data.content.length > 2000) {
      errors.push('Conteúdo deve ter no máximo 2000 caracteres');
    }
    
    if (!data.audience || data.audience.length === 0) {
      errors.push('Selecione pelo menos um público-alvo');
    }
    
    if (data.audience?.includes('SPECIFIC_CLASS') && !data.targetClassId) {
      errors.push('Selecione uma turma para envio específico');
    }
    
    if (data.audience?.includes('INDIVIDUAL') && (!data.targetUsers || data.targetUsers.length === 0)) {
      errors.push('Selecione usuários específicos');
    }
    
    return errors;
  }
};
