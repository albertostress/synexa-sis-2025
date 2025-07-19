/**
 * Tipos para módulo Library - Sistema de Biblioteca Escolar Angolana
 * Alinhado com backend NestJS + Prisma
 */

// Status de empréstimos
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';

// Interface principal de livro
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  copies: number;
  availableCopies?: number; // Calculado dinamicamente
  category?: string;
  publisher?: string;
  publishedYear?: number;
  description?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  activeLoans?: Loan[];
}

// Interface para empréstimo
export interface Loan {
  id: string;
  bookId: string;
  book?: Book;
  studentId?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
    email?: string;
  };
  teacherId?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: LoanStatus;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  daysOverdue?: number; // Calculado dinamicamente
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para criar livro
export interface CreateBookDto {
  title: string;
  author: string;
  isbn: string;
  copies: number;
  category?: string;
  publisher?: string;
  publishedYear?: number;
  description?: string;
  location?: string;
}

// Interface para fazer empréstimo
export interface LoanBookDto {
  bookId: string;
  studentId?: string;
  teacherId?: string;
  dueDate?: string; // Opcional, padrão 15 dias
  notes?: string;
}

// Interface para devolver livro
export interface ReturnBookDto {
  notes?: string;
}

// Interface para filtros de livros
export interface BookFilters {
  title?: string;
  author?: string;
  isbn?: string;
  category?: string;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
}

// Interface para filtros de empréstimos
export interface LoanFilters {
  status?: LoanStatus;
  studentId?: string;
  teacherId?: string;
  bookId?: string;
  startDate?: string;
  endDate?: string;
  search?: string; // Busca por nome do usuário ou título do livro
  page?: number;
  limit?: number;
}

// Interface para lista paginada de livros
export interface BookListResponse {
  data: Book[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface para lista paginada de empréstimos
export interface LoanListResponse {
  data: Loan[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface para estatísticas da biblioteca
export interface LibraryStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  activeLoans: number;
  overdueLoans: number;
  totalCategories: number;
  popularBooks: Array<{
    book: Book;
    loanCount: number;
  }>;
}

// Interface para histórico de empréstimos do usuário
export interface UserLoanHistory {
  user: {
    id: string;
    name: string;
    type: 'STUDENT' | 'TEACHER';
    identifier: string; // studentNumber ou email
  };
  summary: {
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    completedLoans: number;
  };
  loans: Loan[];
}

// Labels traduzidos para português angolano
export const LoanStatusLabels: Record<LoanStatus, string> = {
  ACTIVE: 'Ativo',
  RETURNED: 'Devolvido',
  OVERDUE: 'Em Atraso',
};

// Cores para badges de status
export const LoanStatusColors: Record<LoanStatus, string> = {
  ACTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
  RETURNED: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
};

// Labels de disponibilidade de livros
export const BookAvailabilityLabels = {
  AVAILABLE: 'Disponível',
  PARTIALLY_AVAILABLE: 'Parcialmente Disponível',
  UNAVAILABLE: 'Indisponível',
} as const;

// Cores para badges de disponibilidade
export const BookAvailabilityColors = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  PARTIALLY_AVAILABLE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  UNAVAILABLE: 'bg-red-100 text-red-800 border-red-200',
} as const;

// Categorias comuns para escolas angolanas
export const BOOK_CATEGORIES = [
  'Matemática',
  'Português',
  'História',
  'Geografia',
  'Ciências Naturais',
  'Física',
  'Química',
  'Biologia',
  'Literatura',
  'Filosofia',
  'Inglês',
  'Francês',
  'Educação Moral e Cívica',
  'Educação Física',
  'Artes Visuais',
  'Música',
  'Informática',
  'Psicologia',
  'Sociologia',
  'Economia',
  'Direito',
  'Referência',
  'Dicionários',
  'Enciclopédias',
  'Literatura Africana',
  'História de Angola',
  'Geografia de Angola',
  'Cultura Angolana',
  'Outros',
] as const;

// Helper para calcular disponibilidade do livro
export const calculateBookAvailability = (book: Book): keyof typeof BookAvailabilityLabels => {
  const available = book.availableCopies ?? (book.copies - (book.activeLoans?.length ?? 0));
  
  if (available === 0) return 'UNAVAILABLE';
  if (available < book.copies) return 'PARTIALLY_AVAILABLE';
  return 'AVAILABLE';
};

// Helper para calcular dias de atraso
export const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Helper para determinar se empréstimo está em atraso
export const isLoanOverdue = (loan: Loan): boolean => {
  return loan.status === 'ACTIVE' && new Date(loan.dueDate) < new Date();
};

// Helper para formatar nome do usuário
export const formatUserName = (loan: Loan): string => {
  if (loan.student) {
    return `${loan.student.firstName} ${loan.student.lastName}`;
  }
  if (loan.teacher) {
    return `${loan.teacher.firstName} ${loan.teacher.lastName}`;
  }
  return 'Usuário Desconhecido';
};

// Helper para formatar identificador do usuário
export const formatUserIdentifier = (loan: Loan): string => {
  if (loan.student) {
    return loan.student.studentNumber;
  }
  if (loan.teacher) {
    return loan.teacher.email;
  }
  return '';
};

// Helper para calcular multa por atraso (em dias)
export const calculateLateFee = (daysOverdue: number): number => {
  // Regra: 50 AOA por dia de atraso (configurável)
  const feePerDay = 50; // AOA
  return Math.max(0, daysOverdue * feePerDay);
};

// Configurações da biblioteca
export const LIBRARY_CONFIG = {
  defaultLoanPeriodDays: 15,
  maxLoansPerUser: 3,
  lateFeePerDay: 50, // AOA
  gracePeriodDays: 2,
  maxRenewalTimes: 1,
  reservationMaxDays: 7,
} as const;

// Interface para configurações personalizáveis
export interface LibrarySettings {
  defaultLoanPeriodDays: number;
  maxLoansPerUser: number;
  lateFeePerDay: number;
  gracePeriodDays: number;
  allowRenewals: boolean;
  maxRenewalTimes: number;
  allowReservations: boolean;
  reservationMaxDays: number;
  sendReminderNotifications: boolean;
  reminderDaysBefore: number;
}

// Interface para notificação/lembrete
export interface LibraryNotification {
  id: string;
  userId: string;
  userType: 'STUDENT' | 'TEACHER';
  type: 'DUE_REMINDER' | 'OVERDUE_WARNING' | 'RETURN_CONFIRMATION';
  message: string;
  loanId?: string;
  createdAt: string;
  read: boolean;
}

// Interface para relatório da biblioteca
export interface LibraryReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalLoans: number;
    totalReturns: number;
    overdueLoans: number;
    newBooks: number;
    activeUsers: number;
  };
  topBooks: Array<{
    book: Book;
    loanCount: number;
  }>;
  topCategories: Array<{
    category: string;
    loanCount: number;
  }>;
  userActivity: Array<{
    user: string;
    type: 'STUDENT' | 'TEACHER';
    loanCount: number;
  }>;
}

// Helper para validar ISBN
export const validateISBN = (isbn: string): boolean => {
  // Remove hífens e espaços
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  // Verifica se tem 10 ou 13 dígitos
  if (!/^\d{10}(\d{3})?$/.test(cleanISBN)) {
    return false;
  }
  
  // Validação básica de comprimento
  return cleanISBN.length === 10 || cleanISBN.length === 13;
};

// Helper para formatar ISBN
export const formatISBN = (isbn: string): string => {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  if (cleanISBN.length === 13) {
    return `${cleanISBN.slice(0, 3)}-${cleanISBN.slice(3, 4)}-${cleanISBN.slice(4, 6)}-${cleanISBN.slice(6, 12)}-${cleanISBN.slice(12)}`;
  }
  
  if (cleanISBN.length === 10) {
    return `${cleanISBN.slice(0, 1)}-${cleanISBN.slice(1, 3)}-${cleanISBN.slice(3, 9)}-${cleanISBN.slice(9)}`;
  }
  
  return isbn;
};

// Meses do ano em português
export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

// Helper para obter nome do mês
export const getMonthName = (month: number): string => {
  return MONTHS_PT[month - 1] || '';
};