import { useQuery } from '@tanstack/react-query';
import { enrollmentAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook personalizado para carregar anos letivos disponíveis
 * Substitui arrays hardcoded por dados dinâmicos da API
 */
export const useEnrollmentYears = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: availableYears = [], isLoading: loadingYears, error } = useQuery({
    queryKey: ['enrollment-years'],
    queryFn: async () => {
      try {
        const data = await enrollmentAPI.getAvailableYears();
        return data || [];
      } catch (err) {
        console.error('Erro ao carregar anos letivos:', err);
        // Return default years if API fails
        return ['2025/2026', '2024/2025'];
      }
    },
    enabled: !!user, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: 1
  });

  // Handle error in a useEffect
  if (error) {
    console.error('Erro ao carregar anos letivos:', error);
  }

  // Use default years if not authenticated or no data - ensure it's always an array
  const safeAvailableYears = Array.isArray(availableYears) ? availableYears : [];
  const finalYears = safeAvailableYears.length > 0 ? safeAvailableYears : ['2025/2026', '2024/2025'];
  
  // Converter formato "2025/2026" para number (2025) para compatibilidade
  const yearsAsNumbers = Array.isArray(finalYears) ? finalYears.map(yearRange => 
    typeof yearRange === 'string' ? parseInt(yearRange.split('/')[0]) : 2025
  ) : [2025, 2024];

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