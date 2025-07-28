import { useQuery } from '@tanstack/react-query';
import { financialAPI } from '@/lib/api';

export interface FinancialData {
  currentMonth: {
    totalRevenue: number;
    pendingAmount: number;
    overdueAmount: number;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    pending: number;
    overdue: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
    color: string;
  }>;
  monthlyTarget: number;
}

export function useFinancialData() {
  return useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: async (): Promise<FinancialData> => {
      // Por enquanto, simular dados - mais tarde conectar com backend
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      // Gerar dados dos últimos 6 meses
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Aug', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyData = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const month = monthNames[date.getMonth()];
        
        // Simular dados crescentes com variação
        const baseRevenue = 50000 + (5 - i) * 8000;
        const variation = (Math.random() - 0.5) * 10000;
        
        monthlyData.push({
          month,
          revenue: Math.max(0, baseRevenue + variation),
          pending: Math.random() * 15000 + 5000,
          overdue: Math.random() * 8000 + 2000,
        });
      }
      
      // Dados do mês atual
      const currentMonthData = monthlyData[monthlyData.length - 1];
      const currentMonthSummary = {
        totalRevenue: currentMonthData.revenue,
        pendingAmount: currentMonthData.pending,
        overdueAmount: currentMonthData.overdue,
        totalInvoices: 156,
        paidInvoices: 125,
        pendingInvoices: 23,
        overdueInvoices: 8,
      };
      
      // Métodos de pagamento com cores específicas para Angola
      const paymentMethods = [
        { method: 'Transferência Bancária', amount: 35000, count: 45, color: '#10b981' },
        { method: 'Multicaixa', amount: 28000, count: 38, color: '#3b82f6' },
        { method: 'Dinheiro', amount: 15000, count: 25, color: '#f59e0b' },
        { method: 'Express', amount: 8000, count: 12, color: '#8b5cf6' },
        { method: 'PayWay', amount: 4000, count: 5, color: '#06b6d4' },
      ];
      
      return {
        currentMonth: currentMonthSummary,
        monthlyData,
        paymentMethods,
        monthlyTarget: 95000, // Meta mensal de 95k AOA
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // Refresh a cada 30 segundos
  });
}