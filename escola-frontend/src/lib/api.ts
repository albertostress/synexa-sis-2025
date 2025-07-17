import axios from 'axios';
import { CreateStudentDto, Student, StudentResponse, StudentsListResponse } from '../types/student';

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
  getAll: async () => {
    const response = await api.get('/classes');
    return response.data;
  },
  
  getByProfessor: async (professorId: string) => {
    const response = await api.get(`/classes/professor/${professorId}`);
    return response.data;
  }
};

// Grades API functions
export const gradesAPI = {
  getByClass: async (classId: string) => {
    const response = await api.get(`/grades/class/${classId}`);
    return response.data;
  },
  
  create: async (gradeData: any) => {
    const response = await api.post('/grades', gradeData);
    return response.data;
  },
  
  update: async (id: string, gradeData: any) => {
    const response = await api.put(`/grades/${id}`, gradeData);
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
  getByStudent: async (studentId: string) => {
    const response = await api.get(`/documents/student/${studentId}`);
    return response.data;
  },
  
  generate: async (documentData: any) => {
    const response = await api.post('/documents/generate', documentData);
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
