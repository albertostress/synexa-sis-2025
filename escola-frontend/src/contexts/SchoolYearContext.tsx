/**
 * 🎯 MELHORIA 2: Contexto Global de Ano Letivo
 * Contexto para gerenciar o ano letivo ativo em toda a aplicação
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SchoolYearContextType {
  currentYear: string;
  setCurrentYear: (year: string) => void;
  availableYears: string[];
  setAvailableYears: (years: string[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

interface SchoolYearProviderProps {
  children: ReactNode;
}

export function SchoolYearProvider({ children }: SchoolYearProviderProps) {
  // Estado do ano letivo atual (formato: "2025/2026")
  const [currentYear, setCurrentYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar com ano atual ao carregar
  useEffect(() => {
    const initializeYear = () => {
      const now = new Date();
      const currentCalendarYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12
      
      // Se estivermos entre setembro-dezembro, o ano letivo é currentYear/nextYear
      // Se estivermos entre janeiro-agosto, o ano letivo é previousYear/currentYear
      let schoolYear: string;
      if (currentMonth >= 9) {
        schoolYear = `${currentCalendarYear}/${currentCalendarYear + 1}`;
      } else {
        schoolYear = `${currentCalendarYear - 1}/${currentCalendarYear}`;
      }
      
      setCurrentYear(schoolYear);
      setAvailableYears([schoolYear]); // Será substituído pelos dados reais da API
      setIsLoading(false);
    };

    initializeYear();
  }, []);

  const value: SchoolYearContextType = {
    currentYear,
    setCurrentYear,
    availableYears,
    setAvailableYears,
    isLoading,
    setIsLoading,
  };

  return (
    <SchoolYearContext.Provider value={value}>
      {children}
    </SchoolYearContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export function useSchoolYear(): SchoolYearContextType {
  const context = useContext(SchoolYearContext);
  if (context === undefined) {
    throw new Error('useSchoolYear deve ser usado dentro de um SchoolYearProvider');
  }
  return context;
}

// Hook para obter formatação do ano
export function useSchoolYearHelper() {
  const { currentYear } = useSchoolYear();
  
  return {
    currentYear,
    // Converte "2025/2026" para 2025 (ano de início)
    getCurrentYearNumber: (): number => {
      return parseInt(currentYear.split('/')[0]);
    },
    // Formata para exibição
    formatYear: (year: string): string => {
      return `Ano Letivo ${year}`;
    }
  };
}