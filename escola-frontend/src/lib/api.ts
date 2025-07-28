import axios from 'axios';
import { CreateStudentDto, Student, StudentResponse, StudentsListResponse } from '../types/student';
import { Schedule, CreateScheduleDto, UpdateScheduleDto, ScheduleFilters, ScheduleConflict, Weekday } from '../types/schedule';
import { Subject, SubjectWithTeachers, CreateSubjectDto, UpdateSubjectDto, SubjectFilters } from '../types/subject';
import { SchoolClass, SchoolClassWithRelations, CreateClassDto, UpdateClassDto, ClassFilters } from '../types/class';
import { EnrollmentWithRelations, CreateEnrollmentDto, UpdateEnrollmentDto, EnrollmentFilters, CreateEnrollmentWithStudentDto } from '../types/enrollment';
import { GradeWithRelations, CreateGradeDto, UpdateGradeDto, GradeFilters } from '../types/grade';
import { ReportCard, StudentInfo, GetReportCardDto, ReportFilters } from '../types/report';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    
    // Log errors for debugging
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    } else if (error.request) {
      console.error('Network Error - No response from server');
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
    // Backend retorna objeto paginado: {students: [...], total: X, ...}
    return response.data.students || [];
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
  },

  /**
   * Verifica se já existe um estudante com o BI informado
   * Retorna { exists: true, student: {...} } se encontrado
   * Retorna erro 404 se não encontrado
   */
  checkByBI: async (biNumber: string): Promise<{ exists: boolean; student?: any }> => {
    try {
      const response = await api.get(`/students/by-bi/${biNumber}`);
      return response.data; // { exists: true, student: {...} }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Estudante não encontrado - retornar estrutura consistente
        return { 
          exists: false,
          message: error.response?.data?.message || `Nenhum estudante encontrado com o BI ${biNumber}`
        };
      }
      // Re-throw outros erros (500, 400, etc)
      throw error;
    }
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
  
  // ============= RELATÓRIOS E ESTATÍSTICAS =============
  getFinancialSummary: async (year?: number, month?: number) => {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const response = await api.get('/finance/reports/summary', { params });
    return response.data;
  },
  
  // ============= AUTOMAÇÃO DE COBRANÇAS =============
  sendOverdueReminders: async () => {
    const response = await api.post('/finance/automation/send-overdue-reminders');
    return response.data;
  },
  
  markOverduePayments: async () => {
    const response = await api.post('/finance/automation/mark-overdue-payments');
    return response.data;
  },
  
  getOverdueInvoices: async () => {
    const response = await api.get('/finance/invoices', { 
      params: { status: 'VENCIDA' } 
    });
    return response.data;
  },
  
  // ============= CATEGORIAS DE FATURAS =============
  getInvoiceCategories: () => [
    { value: 'PROPINA', label: 'Propina/Mensalidade', defaultAmount: 25000 },
    { value: 'MATRICULA', label: 'Taxa de Matrícula', defaultAmount: 15000 },
    { value: 'UNIFORME', label: 'Uniforme Escolar', defaultAmount: 8000 },
    { value: 'MATERIAL', label: 'Material Didático', defaultAmount: 12000 },
    { value: 'TRANSPORTE', label: 'Transporte Escolar', defaultAmount: 18000 },
    { value: 'ALIMENTACAO', label: 'Alimentação', defaultAmount: 20000 },
    { value: 'ATIVIDADES', label: 'Atividades Extracurriculares', defaultAmount: 5000 },
    { value: 'EXAMES', label: 'Taxas de Exame', defaultAmount: 3000 },
    { value: 'CERTIFICADO', label: 'Certificados/Diplomas', defaultAmount: 2500 },
    { value: 'OUTROS', label: 'Outros', defaultAmount: 0 },
  ],
  
  // ============= VALIDAÇÕES ESPECÍFICAS ANGOLA =============
  validateAngolanPhoneNumber: (phone: string): boolean => {
    // Angola: +244 9XX XXX XXX
    const angolanPhoneRegex = /^(\+244|244)?[9][0-9]{8}$/;
    return angolanPhoneRegex.test(phone.replace(/\s/g, ''));
  },
  
  // ============= CONFORMIDADE AGT ANGOLA =============
  generateSequentialInvoiceNumber: (sequence: number, year: number): string => {
    // Formato AGT: AAAA/NNNNNN (Ano/Sequencial)
    return `${year}/${sequence.toString().padStart(6, '0')}`;
  },
  
  prepareEInvoiceData: (invoice: any) => {
    // Preparar dados para e-invoicing conforme AGT
    return {
      invoiceNumber: financialAPI.generateSequentialInvoiceNumber(invoice.sequence, invoice.year),
      issueDate: new Date().toISOString(),
      dueDate: invoice.dueDate,
      customerNIF: invoice.student.nif || '',
      customerName: invoice.student.name,
      items: [{
        description: invoice.description,
        quantity: 1,
        unitPrice: invoice.amount,
        totalPrice: invoice.amount,
        taxRate: 0, // IVA isento para educação
      }],
      totalAmount: invoice.amount,
      taxAmount: 0,
      currency: 'AOA',
      paymentTerms: 'À vista ou até data de vencimento',
    };
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
    const response = await api.post('/enrollment/existing-student', enrollmentData);
    return response.data;
  },

  createWithStudent: async (enrollmentData: CreateEnrollmentWithStudentDto): Promise<EnrollmentWithRelations> => {
    console.log('🔗 API.createWithStudent chamado');
    console.log('📊 Payload para POST /enrollment:', JSON.stringify(enrollmentData, null, 2));
    
    const response = await api.post('/enrollment', enrollmentData);
    
    console.log('📥 Response da API:', response);
    console.log('📄 Response data:', response.data);
    
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
    if (filters?.type) params.append('type', filters.type);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.studentName) params.append('studentName', filters.studentName);
    
    const response = await api.get('/grades', { 
      params: Object.fromEntries(params) 
    });
    return response.data;
  },
  
  // =========== ANGOLA OPTIMIZED ENDPOINTS ===========
  getStudentTermGrades: async (studentId: string, term: number): Promise<any> => {
    const response = await api.get(`/grades/angola/student/${studentId}/term/${term}`);
    return response.data;
  },
  
  getClassTermSummary: async (classId: string, term: number): Promise<any[]> => {
    const response = await api.get(`/grades/angola/class/${classId}/term/${term}`);
    return response.data;
  },
  
  calculateSubjectMT: async (studentId: string, subjectId: string, term: number): Promise<any> => {
    const response = await api.get(`/grades/angola/calculate-mt/${studentId}/${subjectId}/${term}`);
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


// ==================== LIBRARY API ====================
export const libraryAPI = {
  // ==================== BOOKS ====================
  
  // Listar livros com filtros e paginação
  getBooks: async (filters: import('@/types/library').BookFilters): Promise<import('@/types/library').BookListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.title) params.append('title', filters.title);
    if (filters.author) params.append('author', filters.author);
    if (filters.isbn) params.append('isbn', filters.isbn);
    if (filters.category) params.append('category', filters.category);
    if (filters.availableOnly) params.append('availableOnly', 'true');
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/library/books?${params.toString()}`);
    return response.data;
  },

  // Obter detalhes de um livro específico
  getBookById: async (bookId: string): Promise<import('@/types/library').Book> => {
    const response = await api.get(`/library/books/${bookId}`);
    return response.data;
  },

  // Criar novo livro (ADMIN apenas)
  createBook: async (bookData: import('@/types/library').CreateBookDto): Promise<import('@/types/library').Book> => {
    const response = await api.post('/library/books', bookData);
    return response.data;
  },

  // Atualizar livro existente (ADMIN apenas)
  updateBook: async (bookId: string, bookData: Partial<import('@/types/library').CreateBookDto>): Promise<import('@/types/library').Book> => {
    const response = await api.patch(`/library/books/${bookId}`, bookData);
    return response.data;
  },

  // Excluir livro (ADMIN apenas)
  deleteBook: async (bookId: string): Promise<void> => {
    await api.delete(`/library/books/${bookId}`);
  },

  // ==================== LOANS ====================

  // Fazer empréstimo de livro
  loanBook: async (loanData: import('@/types/library').LoanBookDto): Promise<import('@/types/library').Loan> => {
    const response = await api.post('/library/loan', loanData);
    return response.data;
  },

  // Devolver livro emprestado
  returnBook: async (loanId: string, returnData?: import('@/types/library').ReturnBookDto): Promise<import('@/types/library').Loan> => {
    const response = await api.post(`/library/return/${loanId}`, returnData || {});
    return response.data;
  },

  // Listar todos os empréstimos (ADMIN, DIRETOR)
  getAllLoans: async (filters: import('@/types/library').LoanFilters): Promise<import('@/types/library').LoanListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.teacherId) params.append('teacherId', filters.teacherId);
    if (filters.bookId) params.append('bookId', filters.bookId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/library/loans?${params.toString()}`);
    return response.data;
  },

  // Listar empréstimos do professor logado (PROFESSOR)
  getMyLoans: async (filters?: Omit<import('@/types/library').LoanFilters, 'teacherId' | 'studentId'>): Promise<import('@/types/library').LoanListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.bookId) params.append('bookId', filters.bookId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/library/my-loans?${params.toString()}`);
    return response.data;
  },

  // ==================== STATISTICS ====================

  // Obter estatísticas da biblioteca
  getLibraryStats: async (): Promise<import('@/types/library').LibraryStats> => {
    const response = await api.get('/library/stats');
    return response.data;
  },

  // Obter histórico de empréstimos de um usuário específico
  getUserLoanHistory: async (userId: string, userType: 'student' | 'teacher'): Promise<import('@/types/library').UserLoanHistory> => {
    const response = await api.get(`/library/user-history/${userType}/${userId}`);
    return response.data;
  },

  // ==================== HELPERS ====================

  // Verificar permissões para gestão de livros
  canManageBooks: (userRole: string): boolean => {
    return ['ADMIN'].includes(userRole);
  },

  // Verificar permissões para gestão de empréstimos
  canManageLoans: (userRole: string): boolean => {
    return ['ADMIN', 'SECRETARIA'].includes(userRole);
  },

  // Verificar permissões para visualizar todos os empréstimos
  canViewAllLoans: (userRole: string): boolean => {
    return ['ADMIN', 'DIRETOR', 'SECRETARIA'].includes(userRole);
  },

  // Verificar permissões para visualizar biblioteca
  canViewLibrary: (userRole: string): boolean => {
    return ['ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR'].includes(userRole);
  },

  // Validar se usuário pode fazer empréstimo
  validateLoanRequest: (loanData: import('@/types/library').LoanBookDto): string[] => {
    const errors: string[] = [];
    
    if (!loanData.bookId) {
      errors.push('Selecione um livro');
    }
    
    if (!loanData.studentId && !loanData.teacherId) {
      errors.push('Selecione um aluno ou professor');
    }
    
    if (loanData.studentId && loanData.teacherId) {
      errors.push('Selecione apenas um usuário (aluno OU professor)');
    }
    
    if (loanData.dueDate) {
      const dueDate = new Date(loanData.dueDate);
      const today = new Date();
      
      if (dueDate <= today) {
        errors.push('Data de vencimento deve ser futura');
      }
      
      // Máximo 30 dias de empréstimo
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      
      if (dueDate > maxDate) {
        errors.push('Empréstimo não pode exceder 30 dias');
      }
    }
    
    return errors;
  },

  // Calcular data de vencimento padrão
  calculateDefaultDueDate: (loanPeriodDays: number = 15): string => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanPeriodDays);
    return dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
  },

  // Obter status do livro baseado em disponibilidade
  getBookStatus: (book: import('@/types/library').Book): string => {
    const available = book.availableCopies ?? (book.copies - (book.activeLoans?.length ?? 0));
    
    if (available === 0) return 'Indisponível';
    if (available < book.copies) return `${available} de ${book.copies} disponível`;
    return 'Disponível';
  },

  // Obter cor do badge baseado na disponibilidade
  getBookStatusColor: (book: import('@/types/library').Book): string => {
    const available = book.availableCopies ?? (book.copies - (book.activeLoans?.length ?? 0));
    
    if (available === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (available < book.copies) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  },

  // Formatar período de empréstimo
  formatLoanPeriod: (loanDate: string, dueDate: string): string => {
    const loan = new Date(loanDate);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - loan.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} dias`;
  },

  // Verificar se empréstimo está próximo do vencimento
  isLoanNearDue: (dueDate: string, warningDays: number = 3): boolean => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= warningDays && diffDays > 0;
  },

  // Exportar dados para relatório
  exportLoansReport: async (filters: import('@/types/library').LoanFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/library/loans/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  },

  // Download do relatório
  downloadLoansReport: async (filters: import('@/types/library').LoanFilters, filename: string = 'relatorio_emprestimos.xlsx'): Promise<void> => {
    try {
      const blob = await libraryAPI.exportLoansReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      throw error;
    }
  }
};

// ============================================================================
// TRANSPORT API - Sistema de Transporte Escolar
// ============================================================================

export const transportAPI = {
  // ============= GESTÃO DE ROTAS =============
  
  getRoutes: async (filters: import('@/types/transport').RouteFilters): Promise<import('@/types/transport').RouteListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.routeName) params.append('routeName', filters.routeName);
    if (filters.driverName) params.append('driverName', filters.driverName);
    if (filters.vehicle) params.append('vehicle', filters.vehicle);
    if (filters.departure) params.append('departure', filters.departure);
    if (filters.returnTime) params.append('returnTime', filters.returnTime);
    if (filters.stopName) params.append('stopName', filters.stopName);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/transport/routes?${params.toString()}`);
    return response.data;
  },
  
  getRouteById: async (id: string): Promise<import('@/types/transport').TransportRoute> => {
    const response = await api.get(`/transport/routes/${id}`);
    return response.data;
  },
  
  createRoute: async (routeData: import('@/types/transport').CreateRouteDto): Promise<import('@/types/transport').TransportRoute> => {
    const response = await api.post('/transport/routes', routeData);
    return response.data;
  },
  
  updateRoute: async (id: string, routeData: import('@/types/transport').UpdateRouteDto): Promise<import('@/types/transport').TransportRoute> => {
    const response = await api.patch(`/transport/routes/${id}`, routeData);
    return response.data;
  },
  
  deleteRoute: async (id: string): Promise<void> => {
    const response = await api.delete(`/transport/routes/${id}`);
    return response.data;
  },
  
  // ============= GESTÃO DE ALUNOS NO TRANSPORTE =============
  
  assignStudentsToRoute: async (
    routeId: string, 
    studentsData: import('@/types/transport').AssignMultipleStudentsDto
  ): Promise<import('@/types/transport').StudentTransport[]> => {
    const response = await api.post(`/transport/routes/${routeId}/students`, studentsData);
    return response.data;
  },
  
  getStudentTransport: async (studentId: string): Promise<import('@/types/transport').StudentTransport | null> => {
    try {
      const response = await api.get(`/transport/students/${studentId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },
  
  updateStudentTransport: async (
    studentId: string, 
    transportData: import('@/types/transport').UpdateStudentTransportDto
  ): Promise<import('@/types/transport').StudentTransport> => {
    const response = await api.put(`/transport/students/${studentId}`, transportData);
    return response.data;
  },
  
  removeStudentFromTransport: async (studentId: string): Promise<void> => {
    const response = await api.delete(`/transport/students/${studentId}`);
    return response.data;
  },
  
  getStudentsWithTransport: async (filters: import('@/types/transport').StudentTransportFilters): Promise<import('@/types/transport').StudentTransportListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.studentName) params.append('studentName', filters.studentName);
    if (filters.className) params.append('className', filters.className);
    if (filters.routeName) params.append('routeName', filters.routeName);
    if (filters.stopName) params.append('stopName', filters.stopName);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/transport/students?${params.toString()}`);
    return response.data;
  },
  
  // ============= ESTATÍSTICAS E RELATÓRIOS =============
  
  getTransportStats: async (): Promise<import('@/types/transport').TransportStats> => {
    const response = await api.get('/transport/stats');
    return response.data;
  },
  
  generateRouteReport: async (routeId: string): Promise<Blob> => {
    const response = await api.get(`/transport/routes/${routeId}/report`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  exportRoutesReport: async (filters: import('@/types/transport').RouteFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters.routeName) params.append('routeName', filters.routeName);
    if (filters.driverName) params.append('driverName', filters.driverName);
    if (filters.vehicle) params.append('vehicle', filters.vehicle);
    
    const response = await api.get(`/transport/routes/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  exportStudentsReport: async (filters: import('@/types/transport').StudentTransportFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters.studentName) params.append('studentName', filters.studentName);
    if (filters.className) params.append('className', filters.className);
    if (filters.routeName) params.append('routeName', filters.routeName);
    
    const response = await api.get(`/transport/students/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  // ============= FUNÇÕES AUXILIARES =============
  
  // Verificar se rota está cheia (baseado na capacidade padrão)
  isRouteAtCapacity: (route: import('@/types/transport').TransportRoute, maxCapacity: number = 50): boolean => {
    const studentCount = route.students?.length || 0;
    return studentCount >= maxCapacity;
  },
  
  // Calcular utilização da rota
  getRouteUtilization: (route: import('@/types/transport').TransportRoute, maxCapacity: number = 50): {
    percentage: number;
    status: 'low' | 'medium' | 'high' | 'full';
    color: string;
  } => {
    const studentCount = route.students?.length || 0;
    const percentage = Math.round((studentCount / maxCapacity) * 100);
    
    let status: 'low' | 'medium' | 'high' | 'full';
    let color: string;
    
    if (percentage >= 100) {
      status = 'full';
      color = 'bg-red-100 text-red-800 border-red-200';
    } else if (percentage >= 80) {
      status = 'high';
      color = 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (percentage >= 50) {
      status = 'medium';
      color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      status = 'low';
      color = 'bg-green-100 text-green-800 border-green-200';
    }
    
    return { percentage, status, color };
  },
  
  // Formatar horário de viagem
  formatTripTime: (departure: string, returnTime: string): string => {
    if (!departure || !returnTime) return 'N/A';
    return `${departure} - ${returnTime}`;
  },
  
  // Validar dados da rota
  validateRouteData: (routeData: import('@/types/transport').CreateRouteDto): string[] => {
    const errors: string[] = [];
    
    if (!routeData.name?.trim()) {
      errors.push('Nome da rota é obrigatório');
    }
    
    if (!routeData.driverName?.trim()) {
      errors.push('Nome do motorista é obrigatório');
    }
    
    if (!routeData.vehicle?.trim()) {
      errors.push('Identificação do veículo é obrigatória');
    }
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(routeData.departure)) {
      errors.push('Horário de saída deve estar no formato HH:mm');
    }
    
    if (!timeRegex.test(routeData.returnTime)) {
      errors.push('Horário de retorno deve estar no formato HH:mm');
    }
    
    if (routeData.departure >= routeData.returnTime) {
      errors.push('Horário de retorno deve ser posterior ao horário de saída');
    }
    
    if (!routeData.stops || routeData.stops.length === 0) {
      errors.push('Pelo menos uma paragem é obrigatória');
    }
    
    // Validar ordem das paragens
    if (routeData.stops) {
      const orders = routeData.stops.map(stop => stop.order).sort((a, b) => a - b);
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          errors.push('Ordem das paragens deve ser sequencial (1, 2, 3, ...)');
          break;
        }
      }
      
      // Verificar nomes duplicados
      const stopNames = routeData.stops.map(stop => stop.name.toLowerCase());
      const uniqueNames = new Set(stopNames);
      if (stopNames.length !== uniqueNames.size) {
        errors.push('Não pode haver paragens com nomes duplicados');
      }
    }
    
    return errors;
  },
  
  // Helper para download de relatórios
  downloadRouteReport: async (routeId: string, filename: string = 'relatorio_rota.pdf'): Promise<void> => {
    try {
      const blob = await transportAPI.generateRouteReport(routeId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório da rota:', error);
      throw error;
    }
  },
  
  downloadRoutesReport: async (filters: import('@/types/transport').RouteFilters, filename: string = 'relatorio_rotas.xlsx'): Promise<void> => {
    try {
      const blob = await transportAPI.exportRoutesReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório de rotas:', error);
      throw error;
    }
  },
  
  downloadStudentsReport: async (filters: import('@/types/transport').StudentTransportFilters, filename: string = 'relatorio_alunos_transporte.xlsx'): Promise<void> => {
    try {
      const blob = await transportAPI.exportStudentsReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório de alunos:', error);
      throw error;
    }
  },
  
  // Verificar permissões
  canManageTransport: (userRole: string): boolean => {
    return ['ADMIN'].includes(userRole);
  },
  
  canViewTransport: (userRole: string): boolean => {
    return ['ADMIN', 'SECRETARIA', 'DIRETOR'].includes(userRole);
  },
  
  canAssignStudents: (userRole: string): boolean => {
    return ['ADMIN', 'SECRETARIA'].includes(userRole);
  },
};

// ============================================================================
// EVENTS API - Sistema de Eventos Escolares
// ============================================================================

export const eventsAPI = {
  // ============= GESTÃO DE EVENTOS =============
  
  getEvents: async (filters: import('@/types/events').EventFilters): Promise<import('@/types/events').EventListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.title) params.append('title', filters.title);
    if (filters.type) params.append('type', filters.type);
    if (filters.location) params.append('location', filters.location);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.futureOnly) params.append('futureOnly', filters.futureOnly.toString());
    if (filters.pastOnly) params.append('pastOnly', filters.pastOnly.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    const response = await api.get(`/events?${params.toString()}`);
    return response.data;
  },
  
  getEventById: async (id: string): Promise<import('@/types/events').EventDetails> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  
  createEvent: async (eventData: import('@/types/events').CreateEventDto): Promise<import('@/types/events').Event> => {
    const response = await api.post('/events', eventData);
    return response.data;
  },
  
  updateEvent: async (id: string, eventData: import('@/types/events').UpdateEventDto): Promise<import('@/types/events').Event> => {
    const response = await api.patch(`/events/${id}`, eventData);
    return response.data;
  },
  
  deleteEvent: async (id: string): Promise<void> => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
  
  // ============= GESTÃO DE PARTICIPAÇÕES =============
  
  registerParticipation: async (
    eventId: string, 
    participationData: import('@/types/events').RegisterParticipationDto
  ): Promise<import('@/types/events').EventParticipation> => {
    const response = await api.post(`/events/${eventId}/participate`, participationData);
    return response.data;
  },
  
  registerMultipleParticipations: async (
    eventId: string, 
    participationsData: import('@/types/events').RegisterMultipleParticipationsDto
  ): Promise<import('@/types/events').EventParticipation[]> => {
    const students = participationsData.studentIds.map(studentId => ({
      studentId,
      note: participationsData.note
    }));
    
    // Registra um por um (o backend não tem endpoint para múltiplos ainda)
    const results = await Promise.all(
      students.map(student => 
        api.post(`/events/${eventId}/participate`, student)
      )
    );
    
    return results.map(r => r.data);
  },
  
  registerClassParticipation: async (
    eventId: string, 
    classData: import('@/types/events').RegisterClassDto
  ): Promise<import('@/types/events').EventParticipation[]> => {
    const response = await api.post(`/events/${eventId}/participate/class`, classData);
    return response.data;
  },
  
  getEventParticipants: async (
    eventId: string, 
    filters?: import('@/types/events').ParticipationFilters
  ): Promise<import('@/types/events').ParticipationListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.presence !== undefined) params.append('presence', filters.presence.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/events/${eventId}/participants?${params.toString()}`);
    return response.data;
  },
  
  updateParticipation: async (
    participationId: string, 
    updateData: import('@/types/events').UpdateParticipationDto
  ): Promise<import('@/types/events').EventParticipation> => {
    const response = await api.put(`/events/participation/${participationId}`, updateData);
    return response.data;
  },
  
  batchUpdatePresence: async (
    eventId: string, 
    batchData: import('@/types/events').BatchUpdatePresenceDto
  ): Promise<import('@/types/events').EventParticipation[]> => {
    const response = await api.put(`/events/${eventId}/presence/batch`, batchData);
    return response.data;
  },
  
  removeParticipation: async (participationId: string): Promise<void> => {
    const response = await api.delete(`/events/participation/${participationId}`);
    return response.data;
  },
  
  // ============= CONSULTAS ESPECÍFICAS =============
  
  getStudentEvents: async (
    studentId: string, 
    filters?: import('@/types/events').EventFilters
  ): Promise<import('@/types/events').StudentEventHistory> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/events/student/${studentId}/events?${params.toString()}`);
    return response.data;
  },
  
  // ============= ESTATÍSTICAS E RELATÓRIOS =============
  
  getEventStats: async (): Promise<import('@/types/events').EventStats> => {
    const response = await api.get('/events/stats');
    return response.data;
  },
  
  generateEventReport: async (eventId: string): Promise<Blob> => {
    const response = await api.get(`/events/${eventId}/report`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  exportEventsReport: async (filters: import('@/types/events').EventFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/events/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  exportParticipantsReport: async (eventId: string): Promise<Blob> => {
    const response = await api.get(`/events/${eventId}/participants/export`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  // ============= FUNÇÕES AUXILIARES =============
  
  // Validar dados do evento
  validateEventData: (eventData: import('@/types/events').CreateEventDto): string[] => {
    const errors: string[] = [];
    
    if (!eventData.title?.trim()) {
      errors.push('Título é obrigatório');
    } else if (eventData.title.length < 3 || eventData.title.length > 100) {
      errors.push('Título deve ter entre 3 e 100 caracteres');
    }
    
    if (!eventData.description?.trim()) {
      errors.push('Descrição é obrigatória');
    } else if (eventData.description.length < 10 || eventData.description.length > 1000) {
      errors.push('Descrição deve ter entre 10 e 1000 caracteres');
    }
    
    if (!eventData.location?.trim()) {
      errors.push('Local é obrigatório');
    } else if (eventData.location.length < 3 || eventData.location.length > 200) {
      errors.push('Local deve ter entre 3 e 200 caracteres');
    }
    
    if (!eventData.type) {
      errors.push('Tipo do evento é obrigatório');
    }
    
    if (!eventData.date) {
      errors.push('Data é obrigatória');
    } else {
      const eventDate = new Date(eventData.date);
      const now = new Date();
      
      if (isNaN(eventDate.getTime())) {
        errors.push('Data deve ser uma data válida');
      } else if (eventDate <= now) {
        errors.push('Data deve ser no futuro');
      }
    }
    
    return errors;
  },
  
  // Formatar data do evento
  formatEventDate: (date: string): string => {
    const eventDate = new Date(date);
    return eventDate.toLocaleDateString('pt-AO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },
  
  // Formatar hora do evento
  formatEventTime: (date: string): string => {
    const eventDate = new Date(date);
    return eventDate.toLocaleTimeString('pt-AO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },
  
  // Calcular taxa de presença
  calculateAttendanceRate: (participants: import('@/types/events').EventParticipation[]): number => {
    if (participants.length === 0) return 0;
    const present = participants.filter(p => p.presence).length;
    return Math.round((present / participants.length) * 100);
  },
  
  // Verificar se evento pode ser editado
  canEditEvent: (eventDate: string): boolean => {
    const event = new Date(eventDate);
    const now = new Date();
    return event > now;
  },
  
  // Verificar se evento pode ser deletado
  canDeleteEvent: (event: import('@/types/events').Event): boolean => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const hasParticipants = (event.totalParticipants || 0) > 0;
    
    return eventDate > now && !hasParticipants;
  },
  
  // Helper para download de relatórios
  downloadEventReport: async (eventId: string, filename: string = 'relatorio_evento.pdf'): Promise<void> => {
    try {
      const blob = await eventsAPI.generateEventReport(eventId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório do evento:', error);
      throw error;
    }
  },
  
  downloadEventsReport: async (filters: import('@/types/events').EventFilters, filename: string = 'relatorio_eventos.xlsx'): Promise<void> => {
    try {
      const blob = await eventsAPI.exportEventsReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório de eventos:', error);
      throw error;
    }
  },
  
  downloadParticipantsReport: async (eventId: string, filename: string = 'participantes_evento.xlsx'): Promise<void> => {
    try {
      const blob = await eventsAPI.exportParticipantsReport(eventId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório de participantes:', error);
      throw error;
    }
  },
  
  // Verificar permissões
  canManageEvents: (userRole: string): boolean => {
    return ['ADMIN'].includes(userRole);
  },
  
  canViewEvents: (userRole: string): boolean => {
    return ['ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR'].includes(userRole);
  },
  
  canManageParticipations: (userRole: string): boolean => {
    return ['ADMIN', 'SECRETARIA'].includes(userRole);
  },
  
  canMarkPresence: (userRole: string): boolean => {
    return ['ADMIN', 'SECRETARIA'].includes(userRole);
  },
};

// ================================================================
// ANALYTICS API - Sistema de Análise e Dashboards
// ================================================================

import { 
  FilterAnalyticsDto, 
  OverviewResponse, 
  AttendanceAnalyticsResponse,
  GradesAnalyticsResponse,
  FinanceAnalyticsResponse,
  MatriculationAnalyticsResponse,
  ReportExportRequest,
  AnalyticsCache,
  DashboardConfig,
  AnalyticsAlert,
  PerformanceMetrics 
} from '../types/analytics';

export const analyticsAPI = {
  // ============= OVERVIEW ANALYTICS =============
  getOverview: async (filters?: FilterAnalyticsDto): Promise<OverviewResponse> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.shift) params.append('shift', filters.shift);

    const response = await api.get(`/analytics/overview?${params}`);
    return response.data;
  },

  // ============= ATTENDANCE ANALYTICS =============
  getAttendanceAnalytics: async (filters?: FilterAnalyticsDto): Promise<AttendanceAnalyticsResponse> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.month) params.append('month', filters.month.toString());

    const response = await api.get(`/analytics/attendance?${params}`);
    return response.data;
  },

  // ============= GRADES ANALYTICS =============
  getGradesAnalytics: async (filters?: FilterAnalyticsDto): Promise<GradesAnalyticsResponse> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.disciplineId) params.append('disciplineId', filters.disciplineId);

    const response = await api.get(`/analytics/grades?${params}`);
    return response.data;
  },

  // ============= FINANCE ANALYTICS =============
  getFinanceAnalytics: async (filters?: FilterAnalyticsDto): Promise<FinanceAnalyticsResponse> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month.toString());

    const response = await api.get(`/analytics/finance?${params}`);
    return response.data;
  },

  // ============= MATRICULATION ANALYTICS =============
  getMatriculationAnalytics: async (filters?: FilterAnalyticsDto): Promise<MatriculationAnalyticsResponse> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.shift) params.append('shift', filters.shift);

    const response = await api.get(`/analytics/matriculation?${params}`);
    return response.data;
  },

  // ============= DADOS COMBINADOS =============
  getAllAnalytics: async (filters?: FilterAnalyticsDto): Promise<{
    overview: OverviewResponse;
    attendance: AttendanceAnalyticsResponse;
    grades: GradesAnalyticsResponse;
    finance: FinanceAnalyticsResponse;
    matriculation: MatriculationAnalyticsResponse;
  }> => {
    try {
      const [overview, attendance, grades, finance, matriculation] = await Promise.all([
        analyticsAPI.getOverview(filters),
        analyticsAPI.getAttendanceAnalytics(filters),
        analyticsAPI.getGradesAnalytics(filters),
        analyticsAPI.getFinanceAnalytics(filters),
        analyticsAPI.getMatriculationAnalytics(filters),
      ]);

      return {
        overview,
        attendance,
        grades,
        finance,
        matriculation,
      };
    } catch (error) {
      console.error('Erro ao carregar analytics completos:', error);
      throw error;
    }
  },

  // ============= EXPORT FUNCTIONS =============
  exportOverviewReport: async (filters?: FilterAnalyticsDto): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.shift) params.append('shift', filters.shift);

    const response = await api.get(`/analytics/overview/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportAttendanceReport: async (filters?: FilterAnalyticsDto): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.month) params.append('month', filters.month.toString());

    const response = await api.get(`/analytics/attendance/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportGradesReport: async (filters?: FilterAnalyticsDto): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.disciplineId) params.append('disciplineId', filters.disciplineId);

    const response = await api.get(`/analytics/grades/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportFinanceReport: async (filters?: FilterAnalyticsDto): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month.toString());

    const response = await api.get(`/analytics/finance/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportMatriculationReport: async (filters?: FilterAnalyticsDto): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.shift) params.append('shift', filters.shift);

    const response = await api.get(`/analytics/matriculation/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ============= DOWNLOAD HELPERS =============
  downloadOverviewReport: async (filters?: FilterAnalyticsDto, filename: string = 'relatorio_visao_geral.pdf'): Promise<void> => {
    try {
      const blob = await analyticsAPI.exportOverviewReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório de visão geral:', error);
      throw error;
    }
  },

  downloadAttendanceReport: async (filters?: FilterAnalyticsDto, filename: string = 'relatorio_frequencia.pdf'): Promise<void> => {
    try {
      const blob = await analyticsAPI.exportAttendanceReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório de frequência:', error);
      throw error;
    }
  },

  downloadGradesReport: async (filters?: FilterAnalyticsDto, filename: string = 'relatorio_notas.pdf'): Promise<void> => {
    try {
      const blob = await analyticsAPI.exportGradesReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório de notas:', error);
      throw error;
    }
  },

  downloadFinanceReport: async (filters?: FilterAnalyticsDto, filename: string = 'relatorio_financeiro.pdf'): Promise<void> => {
    try {
      const blob = await analyticsAPI.exportFinanceReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório financeiro:', error);
      throw error;
    }
  },

  downloadMatriculationReport: async (filters?: FilterAnalyticsDto, filename: string = 'relatorio_matriculas.pdf'): Promise<void> => {
    try {
      const blob = await analyticsAPI.exportMatriculationReport(filters);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar relatório de matrículas:', error);
      throw error;
    }
  },

  // ============= CACHE MANAGEMENT =============
  clearCache: async (): Promise<boolean> => {
    try {
      const response = await api.delete('/analytics/cache');
      return response.data.success;
    } catch (error) {
      console.error('Erro ao limpar cache de analytics:', error);
      return false;
    }
  },

  getCacheStatus: async (): Promise<AnalyticsCache[]> => {
    try {
      const response = await api.get('/analytics/cache/status');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter status do cache:', error);
      return [];
    }
  },

  // ============= PERMISSION CHECKS =============
  canAccessOverview: (userRole: string): boolean => {
    return ['ADMIN', 'DIRETOR'].includes(userRole);
  },

  canAccessAttendance: (userRole: string): boolean => {
    return ['ADMIN', 'DIRETOR', 'SECRETARIA'].includes(userRole);
  },

  canAccessGrades: (userRole: string): boolean => {
    return ['ADMIN', 'DIRETOR'].includes(userRole);
  },

  canAccessFinance: (userRole: string): boolean => {
    return ['ADMIN', 'DIRETOR'].includes(userRole);
  },

  canAccessMatriculation: (userRole: string): boolean => {
    return ['ADMIN', 'DIRETOR', 'SECRETARIA'].includes(userRole);
  },

  canExportReports: (userRole: string): boolean => {
    return ['ADMIN', 'DIRETOR'].includes(userRole);
  },

  // ============= UTILITY FUNCTIONS =============
  validateFilters: (filters: FilterAnalyticsDto): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (filters.year && (filters.year < 2020 || filters.year > 2030)) {
      errors.push('Ano deve estar entre 2020 e 2030');
    }

    if (filters.month && (filters.month < 1 || filters.month > 12)) {
      errors.push('Mês deve estar entre 1 e 12');
    }

    if (filters.classId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.classId)) {
      errors.push('ID da turma deve ser um UUID válido');
    }

    if (filters.disciplineId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.disciplineId)) {
      errors.push('ID da disciplina deve ser um UUID válido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  formatApiError: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.status === 403) {
      return 'Sem permissão para acessar estes dados';
    }
    if (error.response?.status === 401) {
      return 'Sessão expirada, faça login novamente';
    }
    return 'Erro ao carregar dados de analytics';
  },

  // ============= DASHBOARD UTILITIES =============
  getDefaultFilters: (): FilterAnalyticsDto => {
    return {
      year: new Date().getFullYear(),
    };
  },

  buildDashboardConfig: (userRole: string): DashboardConfig => {
    const widgets: string[] = [];
    
    if (analyticsAPI.canAccessOverview(userRole)) {
      widgets.push('overview', 'enrollment-distribution');
    }
    
    if (analyticsAPI.canAccessAttendance(userRole)) {
      widgets.push('attendance-overview', 'attendance-trends');
    }
    
    if (analyticsAPI.canAccessGrades(userRole)) {
      widgets.push('grades-overview', 'performance-ranking');
    }
    
    if (analyticsAPI.canAccessFinance(userRole)) {
      widgets.push('finance-overview', 'revenue-trends');
    }
    
    if (analyticsAPI.canAccessMatriculation(userRole)) {
      widgets.push('matriculation-overview', 'growth-metrics');
    }

    return {
      refreshInterval: 5, // 5 minutos
      autoRefresh: true,
      defaultPeriod: 'current-year',
      visibleWidgets: widgets,
      userRole,
    };
  },

  // ============= REAL-TIME UPDATES =============
  subscribeToUpdates: (callback: (data: any) => void): (() => void) => {
    // Implementação de WebSocket ou polling para updates em tempo real
    const interval = setInterval(async () => {
      try {
        const overview = await analyticsAPI.getOverview();
        callback({ type: 'overview', data: overview });
      } catch (error) {
        console.error('Erro ao obter updates de analytics:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    // Retorna função para cancelar subscription
    return () => clearInterval(interval);
  },
};

// ================================================================
// SETTINGS API - Sistema de Configurações
// ================================================================

export const settingsAPI = {
  // ============= CONFIGURAÇÕES GERAIS =============
  getAllSettings: async (filters?: { category?: string; active?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());

    const response = await api.get(`/settings?${params}`);
    return response.data;
  },

  getSettingByKey: async (key: string) => {
    const response = await api.get(`/settings/key/${key}`);
    return response.data;
  },

  getSettingById: async (id: string) => {
    const response = await api.get(`/settings/${id}`);
    return response.data;
  },

  createSetting: async (settingData: {
    key: string;
    value: string;
    type?: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    const response = await api.post('/settings', settingData);
    return response.data;
  },

  updateSetting: async (id: string, settingData: {
    value?: string;
    category?: string;
    description?: string;
    isPublic?: boolean;
    isActive?: boolean;
  }) => {
    const response = await api.patch(`/settings/${id}`, settingData);
    return response.data;
  },

  deleteSetting: async (id: string) => {
    const response = await api.delete(`/settings/${id}`);
    return response.data;
  },

  // ============= CONFIGURAÇÕES SMTP =============
  createSmtpConfig: async (smtpData: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
  }) => {
    const response = await api.post('/settings/smtp', smtpData);
    return response.data;
  },

  getSmtpConfig: async () => {
    const response = await api.get('/settings/smtp/config');
    return response.data;
  },

  updateSmtpConfig: async (id: string, smtpData: {
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    fromEmail?: string;
    fromName?: string;
    isActive?: boolean;
  }) => {
    const response = await api.patch(`/settings/smtp/${id}`, smtpData);
    return response.data;
  },

  testSmtpConfig: async (testData: {
    testEmail: string;
    subject?: string;
    message?: string;
  }) => {
    const response = await api.post('/settings/smtp/test', testData);
    return response.data;
  },

  // ============= WEBHOOKS =============
  getAllWebhooks: async (filters?: { event?: string; active?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.event) params.append('event', filters.event);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());

    const response = await api.get(`/settings/webhooks?${params}`);
    return response.data;
  },

  getWebhookById: async (id: string) => {
    const response = await api.get(`/settings/webhooks/${id}`);
    return response.data;
  },

  createWebhook: async (webhookData: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
    headers?: Record<string, string>;
  }) => {
    const response = await api.post('/settings/webhooks', webhookData);
    return response.data;
  },

  updateWebhook: async (id: string, webhookData: {
    name?: string;
    url?: string;
    events?: string[];
    secret?: string;
    headers?: Record<string, string>;
    isActive?: boolean;
  }) => {
    const response = await api.patch(`/settings/webhooks/${id}`, webhookData);
    return response.data;
  },

  deleteWebhook: async (id: string) => {
    const response = await api.delete(`/settings/webhooks/${id}`);
    return response.data;
  },

  testWebhook: async (id: string, testData: {
    event: string;
    data?: Record<string, any>;
  }) => {
    const response = await api.post(`/settings/webhooks/${id}/test`, testData);
    return response.data;
  },

  // ============= BACKUP E RESTAURAÇÃO =============
  createBackup: async (backupData: {
    description?: string;
    includeFiles?: boolean;
    includeLogs?: boolean;
  }) => {
    const response = await api.post('/settings/backup', backupData);
    return response.data;
  },

  listBackups: async () => {
    const response = await api.get('/settings/backup/list');
    return response.data;
  },

  restoreBackup: async (restoreData: {
    filename: string;
    confirmation: string;
    restoreFiles?: boolean;
    restoreLogs?: boolean;
  }) => {
    const response = await api.post('/settings/backup/restore', restoreData);
    return response.data;
  },

  deleteBackup: async (filename: string) => {
    const response = await api.delete(`/settings/backup/${filename}`);
    return response.data;
  },

  downloadBackup: async (filename: string): Promise<Blob> => {
    const response = await api.get(`/settings/backup/download/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ============= CONFIGURAÇÕES PREDEFINIDAS =============
  getSchoolSettings: async () => {
    try {
      const [
        schoolName,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        academicYear,
        currency,
        timezone,
        language
      ] = await Promise.all([
        settingsAPI.getSettingByKey('school.name').catch(() => ({ value: 'Escola Synexa' })),
        settingsAPI.getSettingByKey('school.address').catch(() => ({ value: 'Luanda, Angola' })),
        settingsAPI.getSettingByKey('school.phone').catch(() => ({ value: '+244 222 123 456' })),
        settingsAPI.getSettingByKey('school.email').catch(() => ({ value: 'geral@escola.ao' })),
        settingsAPI.getSettingByKey('academic.year').catch(() => ({ value: '2024/2025' })),
        settingsAPI.getSettingByKey('system.currency').catch(() => ({ value: 'AOA' })),
        settingsAPI.getSettingByKey('system.timezone').catch(() => ({ value: 'Africa/Luanda' })),
        settingsAPI.getSettingByKey('system.language').catch(() => ({ value: 'pt-AO' })),
      ]);

      return {
        schoolName: schoolName.value,
        schoolAddress: schoolAddress.value,
        schoolPhone: schoolPhone.value,
        schoolEmail: schoolEmail.value,
        academicYear: academicYear.value,
        currency: currency.value,
        timezone: timezone.value,
        language: language.value,
      };
    } catch (error) {
      console.error('Erro ao carregar configurações da escola:', error);
      return {
        schoolName: 'Escola Synexa',
        schoolAddress: 'Luanda, Angola',
        schoolPhone: '+244 222 123 456',
        schoolEmail: 'geral@escola.ao',
        academicYear: '2024/2025',
        currency: 'AOA',
        timezone: 'Africa/Luanda',
        language: 'pt-AO',
      };
    }
  },

  updateSchoolSettings: async (settings: {
    schoolName?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
    academicYear?: string;
    currency?: string;
    timezone?: string;
    language?: string;
  }) => {
    // Execute updates sequentially to avoid race conditions
    if (settings.schoolName) {
      await settingsAPI.updateSettingByKey('school.name', settings.schoolName);
    }
    if (settings.schoolAddress) {
      await settingsAPI.updateSettingByKey('school.address', settings.schoolAddress);
    }
    if (settings.schoolPhone) {
      await settingsAPI.updateSettingByKey('school.phone', settings.schoolPhone);
    }
    if (settings.schoolEmail) {
      await settingsAPI.updateSettingByKey('school.email', settings.schoolEmail);
    }
    if (settings.academicYear) {
      await settingsAPI.updateSettingByKey('academic.year', settings.academicYear);
    }
    if (settings.currency) {
      await settingsAPI.updateSettingByKey('system.currency', settings.currency);
    }
    if (settings.timezone) {
      await settingsAPI.updateSettingByKey('system.timezone', settings.timezone);
    }
    if (settings.language) {
      await settingsAPI.updateSettingByKey('system.language', settings.language);
    }

    return { message: 'Configurações atualizadas com sucesso' };
  },

  updateSettingByKey: async (key: string, value: string) => {
    try {
      const setting = await settingsAPI.getSettingByKey(key);
      return await settingsAPI.updateSetting(setting.id, { value });
    } catch (error: any) {
      // Se não existir, criar
      if (error.response?.status === 404) {
        const category = key.split('.')[0];
        const descriptions: Record<string, string> = {
          'system.fontSize': 'Tamanho da fonte do sistema',
          'school.name': 'Nome da escola',
          'school.address': 'Endereço da escola',
          'school.phone': 'Telefone da escola',
          'school.email': 'Email da escola',
          'academic.year': 'Ano letivo atual',
          'system.currency': 'Moeda do sistema',
          'system.timezone': 'Fuso horário',
          'system.language': 'Idioma do sistema',
        };
        
        return await settingsAPI.createSetting({
          key,
          value,
          type: 'STRING',
          description: descriptions[key] || `Configuração ${key}`,
          isPublic: false,
        });
      }
      throw error;
    }
  },

  // ============= UTILITY FUNCTIONS =============
  exportSettings: async (): Promise<Blob> => {
    const settings = await settingsAPI.getAllSettings();
    const data = JSON.stringify(settings, null, 2);
    return new Blob([data], { type: 'application/json' });
  },

  importSettings: async (file: File) => {
    const text = await file.text();
    const settings = JSON.parse(text);
    
    const imports = settings.map((setting: any) => 
      settingsAPI.createSetting(setting).catch(() => 
        settingsAPI.updateSettingByKey(setting.key, setting.value)
      )
    );
    
    await Promise.all(imports);
    return { message: 'Configurações importadas com sucesso' };
  },

  resetToDefaults: async () => {
    const defaultSettings = {
      'school.name': 'Escola Synexa',
      'school.address': 'Luanda, Angola',
      'school.phone': '+244 222 123 456',
      'school.email': 'geral@escola.ao',
      'academic.year': '2024/2025',
      'system.currency': 'AOA',
      'system.timezone': 'Africa/Luanda',
      'system.language': 'pt-AO',
    };

    const updates = Object.entries(defaultSettings).map(([key, value]) =>
      settingsAPI.updateSettingByKey(key, value)
    );

    await Promise.all(updates);
    return { message: 'Configurações restauradas para os valores padrão' };
  },

  // ============= VALIDATION =============
  validateSmtpConfig: (config: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.host?.trim()) {
      errors.push('Host do servidor SMTP é obrigatório');
    }

    if (!config.port || config.port < 1 || config.port > 65535) {
      errors.push('Porta deve estar entre 1 e 65535');
    }

    if (!config.username?.trim()) {
      errors.push('Nome de usuário é obrigatório');
    }

    if (!config.password?.trim()) {
      errors.push('Senha é obrigatória');
    }

    if (!config.fromEmail?.trim() || !/\S+@\S+\.\S+/.test(config.fromEmail)) {
      errors.push('Email válido é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  validateWebhook: (webhook: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!webhook.name?.trim()) {
      errors.push('Nome do webhook é obrigatório');
    }

    if (!webhook.url?.trim()) {
      errors.push('URL é obrigatória');
    } else if (!/^https?:\/\/.+/.test(webhook.url)) {
      errors.push('URL deve começar com http:// ou https://');
    }

    if (!webhook.events || webhook.events.length === 0) {
      errors.push('Pelo menos um evento deve ser selecionado');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // ============= BACKUP FUNCTIONS (DUPLICATED - COMMENTED) =============
  // createBackup: async (backupData: { description?: string }) => {
  //   const response = await api.post('/settings/backup', backupData);
  //   return response.data;
  // },

  // getBackupList: async () => {
  //   const response = await api.get('/settings/backup/list');
  //   return response.data;
  // },

  // restoreBackup: async (filename: string, confirm: boolean = false) => {
  //   const response = await api.post('/settings/backup/restore', { filename, confirm });
  //   return response.data;
  // },

  // deleteBackup: async (filename: string) => {
  //   const response = await api.delete(`/settings/backup/${filename}`);
  //   return response.data;
  // },

  // ============= SYSTEM INFO =============
  getSystemInfo: async () => {
    try {
      // Mock data for now since this endpoint might not be implemented yet
      return {
        version: '1.0.0',
        environment: 'development',
        uptime: '99.9%',
        memory: 75,
        database: 'Connected',
        cache: 'Active',
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      // Fallback mock data
      return {
        version: '1.0.0',
        environment: 'development',
        uptime: '99.9%',
        memory: 75,
        database: 'Connected',
        cache: 'Active',
      };
    }
  },

  // ============= ENHANCED SMTP (DUPLICATED - COMMENTED) =============
  // testSmtpConfig: async (testData: { email: string }) => {
  //   const response = await api.post('/settings/smtp/test', { testEmail: testData.email });
  //   return response.data;
  // },
};
