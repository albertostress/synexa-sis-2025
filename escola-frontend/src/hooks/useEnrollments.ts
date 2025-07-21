import { useState, useCallback } from 'react';
import { api, enrollmentAPI, classesAPI } from '../lib/api';
import { useToast } from './use-toast';
import {
  CreateEnrollmentWithStudentDto,
  EnrollmentWithRelations,
  SchoolClass
} from '../types/enrollment';

export interface UseEnrollmentsReturn {
  enrollments: EnrollmentWithRelations[];
  classes: SchoolClass[];
  isLoading: boolean;
  error: string | null;
  createEnrollment: (data: CreateEnrollmentWithStudentDto) => Promise<EnrollmentWithRelations>;
  fetchEnrollments: () => Promise<void>;
  fetchClasses: () => Promise<void>;
}

export const useEnrollments = (): UseEnrollmentsReturn => {
  const [enrollments, setEnrollments] = useState<EnrollmentWithRelations[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await enrollmentAPI.getAll();
      setEnrollments(response);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar matrículas';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await classesAPI.getAll();
      setClasses(response);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar turmas';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createEnrollment = useCallback(async (data: CreateEnrollmentWithStudentDto): Promise<EnrollmentWithRelations> => {
    console.log('🎣 useEnrollments.createEnrollment chamado');
    console.log('📋 Hook recebeu data:', JSON.stringify(data, null, 2));
    
    try {
      console.log('📑 Definindo isLoading = true');
      setIsLoading(true);
      setError(null);

      console.log('🌐 Chamando enrollmentAPI.createWithStudent...');
      const response = await enrollmentAPI.createWithStudent(data);
      console.log('📨 API response:', response);
      
      // Adicionar nova matrícula à lista local
      const newEnrollment = response;
      setEnrollments(prev => [newEnrollment, ...prev]);
      
      toast({
        title: 'Sucesso!',
        description: `Matrícula de ${newEnrollment.student?.firstName || 'estudante'} criada com sucesso`,
      });
      
      return newEnrollment;
    } catch (err: any) {
      let errorMessage = 'Erro ao criar matrícula';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 409) {
        errorMessage = 'Estudante já possui matrícula ativa ou turma lotada';
      } else if (err.response?.status === 400) {
        errorMessage = 'Dados inválidos fornecidos';
      }
      
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    enrollments,
    classes,
    isLoading,
    error,
    createEnrollment,
    fetchEnrollments,
    fetchClasses,
  };
};