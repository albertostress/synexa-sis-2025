
export interface PaymentPlan {
  id: string;
  name: string;
  academicYear: string;
  courseId?: string;
  classId?: string;
  monthlyAmount: number;
  dueDay: number; // Dia do mês para vencimento
  lateFeePercent: number;
  interestRate: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  paymentPlanId: string;
  type: 'mensalidade' | 'material' | 'uniforme' | 'atividade' | 'transporte' | 'alimentacao' | 'multa';
  description: string;
  originalAmount: number;
  discountAmount: number;
  exemptionAmount: number;
  finalAmount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  method?: 'dinheiro' | 'transferencia' | 'multicaixa' | 'kwik';
  receiptNumber?: string;
  paidAmount: number;
  remainingAmount: number;
  lateFee: number;
  interest: number;
  exemptionReason?: string;
  discountReason?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'dinheiro' | 'transferencia' | 'multicaixa' | 'kwik';
  receiptNumber: string;
  paymentDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface FinancialStats {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  partialPayments: number;
  exemptions: number;
  monthlyRevenue: { month: string; amount: number }[];
  paymentMethods: { method: string; amount: number; count: number }[];
}
