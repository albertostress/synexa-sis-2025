import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Student, CreateStudentDto } from '@/types/student';

// Configurar axios com baseURL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const useStudents = () => {
  const queryClient = useQueryClient();

  // Query para buscar todos os alunos
  const {
    data: studentsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      console.log('🔄 Fazendo requisição para /students...');
      const { data } = await api.get('/students');
      console.log('✅ Resposta recebida:', data);
      console.log('📊 Total de alunos:', data?.students?.length || 0);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 10, // 10 minutos
  });

  // Extrair array de students da resposta paginada
  const students = studentsResponse?.students || [];

  // Mutation para criar aluno
  const createStudent = useMutation({
    mutationFn: async (studentData: CreateStudentDto) => {
      console.log('➕ Criando aluno:', studentData);
      const { data } = await api.post<Student>('/students', studentData);
      console.log('✅ Aluno criado:', data);
      return data;
    },
    onSuccess: () => {
      // Invalidar e refetch a lista de alunos
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  // Mutation para atualizar aluno
  const updateStudent = useMutation({
    mutationFn: async ({ id, ...studentData }: { id: string } & Partial<CreateStudentDto>) => {
      console.log('✏️ Atualizando aluno:', id, studentData);
      const { data } = await api.put<Student>(`/students/${id}`, studentData);
      console.log('✅ Aluno atualizado:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  // Mutation para deletar aluno
  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ Deletando aluno:', id);
      await api.delete(`/students/${id}`);
      console.log('✅ Aluno deletado');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  return {
    students: Array.isArray(students) ? students : [], // Garantir que sempre seja array
    isLoading,
    error,
    refetch,
    createStudent,
    updateStudent,
    deleteStudent,
  };
};