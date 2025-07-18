/**
 * Tipos para módulo Financeiro - Sistema Escolar Angolano
 * Adaptado para o contexto monetário de Angola (Kwanza - AOA)
 */

// Status de faturas
export type InvoiceStatus = 'PENDENTE' | 'PAGA' | 'VENCIDA' | 'CANCELADA' | 'PARCIAL';

// Métodos de pagamento populares em Angola
export type PaymentMethod = 
  | 'DINHEIRO' 
  | 'TRANSFERENCIA' 
  | 'MULTICAIXA'      // Sistema bancário angolano
  | 'EXPRESS'         // Multicaixa Express (mobile)
  | 'PAYWAY'          // Sistema de pagamento angolano
  | 'CARTAO'
  | 'CHEQUE';

// Tipos de faturas escolares
export type InvoiceType = 
  | 'MENSALIDADE'     // Propina mensal
  | 'MATRICULA'       // Taxa de matrícula
  | 'UNIFORME'        // Fardamento escolar
  | 'MATERIAL'        // Material didático
  | 'TRANSPORTE'      // Transporte escolar
  | 'ALIMENTACAO'     // Cantina/Lanche
  | 'ATIVIDADE'       // Atividades extracurriculares
  | 'EXAME'           // Taxas de exame
  | 'CERTIFICADO'     // Emissão de documentos
  | 'OUTRO';          // Outras taxas

// Interface principal de fatura
export interface Invoice {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    studentNumber: string;
    class?: string;
  };
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  type: InvoiceType;
  description: string;
  dueDate: string;
  month: number;
  year: number;
  academicYear: string;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

// Interface para pagamento
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paymentDate: string;
  createdAt: string;
  createdBy: string;
  cancelled: boolean;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

// Interface para criar fatura
export interface CreateInvoiceDto {
  studentId: string;
  amount: number;
  type: InvoiceType;
  description: string;
  dueDate: string;
  month: number;
  year: number;
}

// Interface para registrar pagamento
export interface PayInvoiceDto {
  amount: number;
  method: PaymentMethod;
  reference?: string;
}

// Interface para filtros de busca
export interface InvoiceFilters {
  studentId?: string;
  status?: InvoiceStatus;
  type?: InvoiceType;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Interface para plano de pagamento
export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  frequency: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  type: InvoiceType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para criar plano de pagamento
export interface CreatePaymentPlanDto {
  name: string;
  description: string;
  amount: number;
  frequency: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  type: InvoiceType;
}

// Interface para histórico financeiro do aluno
export interface StudentFinancialHistory {
  student: {
    id: string;
    name: string;
    studentNumber: string;
    email?: string;
  };
  summary: {
    totalInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    overdueInvoices: number;
  };
  invoices: Invoice[];
}

// Interface para estatísticas financeiras
export interface FinancialStats {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  paidThisMonth: number;
  invoicesThisMonth: number;
  defaultersCount: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  revenueByType: Record<InvoiceType, number>;
  paymentMethods: Record<PaymentMethod, number>;
}

// Interface para lista paginada
export interface InvoiceListResponse {
  data: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface para inadimplentes
export interface Defaulter {
  studentId: string;
  studentName: string;
  studentNumber: string;
  class: string;
  totalOverdue: number;
  overdueInvoices: number;
  oldestDueDate: string;
  parentPhone?: string;
  parentEmail?: string;
}

// Labels traduzidos para português angolano
export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  PENDENTE: 'Pendente',
  PAGA: 'Paga',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
  PARCIAL: 'Parcialmente Paga',
};

// Cores para badges de status
export const InvoiceStatusColors: Record<InvoiceStatus, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAGA: 'bg-green-100 text-green-800 border-green-200',
  VENCIDA: 'bg-red-100 text-red-800 border-red-200',
  CANCELADA: 'bg-gray-100 text-gray-800 border-gray-200',
  PARCIAL: 'bg-blue-100 text-blue-800 border-blue-200',
};

// Labels de tipos de fatura
export const InvoiceTypeLabels: Record<InvoiceType, string> = {
  MENSALIDADE: 'Mensalidade',
  MATRICULA: 'Matrícula',
  UNIFORME: 'Uniforme',
  MATERIAL: 'Material Didático',
  TRANSPORTE: 'Transporte',
  ALIMENTACAO: 'Alimentação',
  ATIVIDADE: 'Atividade Extra',
  EXAME: 'Taxa de Exame',
  CERTIFICADO: 'Certificado',
  OUTRO: 'Outros',
};

// Labels de métodos de pagamento
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  DINHEIRO: 'Dinheiro',
  TRANSFERENCIA: 'Transferência Bancária',
  MULTICAIXA: 'Multicaixa',
  EXPRESS: 'Multicaixa Express',
  PAYWAY: 'PayWay',
  CARTAO: 'Cartão',
  CHEQUE: 'Cheque',
};

// Ícones para tipos de fatura
export const InvoiceTypeIcons: Record<InvoiceType, string> = {
  MENSALIDADE: '📅',
  MATRICULA: '📋',
  UNIFORME: '👔',
  MATERIAL: '📚',
  TRANSPORTE: '🚌',
  ALIMENTACAO: '🍽️',
  ATIVIDADE: '⚽',
  EXAME: '📝',
  CERTIFICADO: '📜',
  OUTRO: '💰',
};

// Moeda angolana
export const CURRENCY = {
  code: 'AOA',
  symbol: 'Kz',
  locale: 'pt-AO',
} as const;

// Helper para formatar moeda angolana
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper para calcular status da fatura
export const calculateInvoiceStatus = (invoice: Invoice): InvoiceStatus => {
  if (invoice.status === 'CANCELADA') return 'CANCELADA';
  if (invoice.paidAmount >= invoice.amount) return 'PAGA';
  if (invoice.paidAmount > 0 && invoice.paidAmount < invoice.amount) return 'PARCIAL';
  if (new Date(invoice.dueDate) < new Date() && invoice.paidAmount === 0) return 'VENCIDA';
  return 'PENDENTE';
};

// Helper para calcular idade da dívida
export const calculateDebtAge = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - due.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Referências bancárias angolanas
export const BANK_REFERENCES = {
  MULTICAIXA: {
    entity: '00324',
    prefix: 'MCA',
  },
  EXPRESS: {
    prefix: 'EXP',
  },
  IBAN: {
    prefix: 'AO06',
    length: 25,
  },
} as const;

// Configurações de multas e juros
export const PENALTY_CONFIG = {
  latePaymentFee: 0.02, // 2% ao mês
  gracePeriodDays: 5,    // Dias de tolerância
  maxPenaltyRate: 0.10,  // Máximo 10% de multa
} as const;

// Interface para isenção
export interface ExemptionRequest {
  reason: string;
  percentage: number; // 0-100
  approvedBy?: string;
  documentUrl?: string;
}

// Interface para desconto
export interface DiscountRequest {
  reason: string;
  amount?: number;
  percentage?: number; // 0-100
  type: 'FIXED' | 'PERCENTAGE';
}

// Meses do ano em português
export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

// Helper para obter nome do mês
export const getMonthName = (month: number): string => {
  return MONTHS_PT[month - 1] || '';
};

// Período escolar em Angola
export const ACADEMIC_PERIOD = {
  startMonth: 2,  // Fevereiro
  endMonth: 11,   // Novembro
  terms: [
    { name: '1º Trimestre', months: [2, 3, 4] },
    { name: '2º Trimestre', months: [5, 6, 7] },
    { name: '3º Trimestre', months: [9, 10, 11] },
  ],
} as const;