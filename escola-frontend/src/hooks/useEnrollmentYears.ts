import { useQuery } from '@tanstack/react-query';
import { enrollmentAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook personalizado para carregar anos letivos disponíveis
 * Substitui arrays hardcoded por dados dinâmicos da API
 */
export const useEnrollmentYears = () => {
  const { toast } = useToast();

  const { data: availableYears = [], isLoading: loadingYears, error } = useQuery({
    queryKey: ['enrollment-years'],
    queryFn: () => enrollmentAPI.getAvailableYears(),
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    onError: (error: any) => {
      console.error('Erro ao carregar anos letivos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os anos letivos disponíveis',
        variant: 'destructive'
      });
    }
  });

  // Converter formato "2025/2026" para number (2025) para compatibilidade
  const yearsAsNumbers = availableYears.map(yearRange => 
    parseInt(yearRange.split('/')[0])
  );

  // Ano mais recente (primeiro da lista)
  const mostRecentYear = yearsAsNumbers.length > 0 ? yearsAsNumbers[0] : 2025;

  return {
    availableYears,        // Array de strings: ["2025/2026", "2024/2025"]
    yearsAsNumbers,        // Array de numbers: [2025, 2024]
    mostRecentYear,        // Number: 2025
    loadingYears,          // Boolean: loading state
    error                  // Error object
  };
};