/**
 * 🎯 MELHORIA 2: Seletor de Ano Letivo Global
 * Componente para seleção do ano letivo ativo em toda a aplicação
 */
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Loader2 } from 'lucide-react';
import { useSchoolYear } from '@/contexts/SchoolYearContext';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const SchoolYearSelector: React.FC = () => {
  const { currentYear, setCurrentYear, availableYears, setAvailableYears, isLoading, setIsLoading } = useSchoolYear();
  const { user } = useAuth();

  // Buscar anos letivos disponíveis da API
  // Apenas para ADMIN, SECRETARIA e DIRETOR
  const canFetchYears = user?.role && ['ADMIN', 'SECRETARIA', 'DIRETOR'].includes(user.role);
  
  const { data: enrollmentYears, isLoading: isLoadingYears } = useQuery({
    queryKey: ['enrollment-years'],
    queryFn: async () => {
      const response = await api.get('/enrollment/years');
      return response.data as string[];
    },
    enabled: canFetchYears,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Atualizar anos disponíveis quando dados chegarem da API
  useEffect(() => {
    if (canFetchYears && enrollmentYears && enrollmentYears.length > 0) {
      setAvailableYears(enrollmentYears);
      
      // Se currentYear não estiver na lista, selecionar o mais recente
      if (!enrollmentYears.includes(currentYear)) {
        setCurrentYear(enrollmentYears[0]); // Lista já vem ordenada desc
      }
      
      setIsLoading(false);
    } else if (!canFetchYears) {
      // Para professores e outros roles, usar anos padrão
      const currentYearNum = new Date().getFullYear();
      const defaultYears = [
        `${currentYearNum}/${currentYearNum + 1}`,
        `${currentYearNum - 1}/${currentYearNum}`,
        `${currentYearNum - 2}/${currentYearNum - 1}`,
      ];
      setAvailableYears(defaultYears);
      
      // Definir ano atual como padrão
      if (!currentYear || !defaultYears.includes(currentYear)) {
        setCurrentYear(defaultYears[0]);
      }
      
      setIsLoading(false);
    }
  }, [enrollmentYears, currentYear, setAvailableYears, setCurrentYear, setIsLoading, canFetchYears]);

  const handleYearChange = (value: string) => {
    setCurrentYear(value);
    // Invalidar queries que dependem do ano para refetch
    // queryClient.invalidateQueries(['enrollments']);
    // queryClient.invalidateQueries(['grades']);
    // etc...
  };

  if (isLoading || isLoadingYears) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm">
        <Calendar className="h-4 w-4" />
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={currentYear} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[140px] h-8 text-sm">
          <SelectValue placeholder="Ano Letivo" />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year}>
              <div className="flex items-center gap-2">
                <span>{year}</span>
                {year === currentYear && (
                  <Badge variant="secondary" className="text-xs">
                    Ativo
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SchoolYearSelector;