import { useQuery } from '@tanstack/react-query';
import { financialAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface FinancialData {
  monthlyRevenue: number;
  overdueAmount: number;
  collectionRate: number;
  monthlyGoalProgress: number;
  revenueGrowth: number;
}

export function useFinancialData() {
  const { user } = useAuth();
  const userRole = user?.role || '';
  const enabled = userRole === 'ADMIN' || userRole === 'DIRETOR' || userRole === 'FINANCEIRO';

  return useQuery({
    queryKey: ['financial-summary'],
    queryFn: async (): Promise<FinancialData> => {
      return financialAPI.getSummary();
    },
    enabled, // Não faz request se SECRETARIA
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: enabled ? 30 * 1000 : false, // Refresh a cada 30 segundos apenas se permitido
  });
}