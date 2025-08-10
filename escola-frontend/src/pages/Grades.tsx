import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Plus, Edit, Trash2, FileText, GraduationCap, Search, Calendar, Eye, Loader2,
  BookOpen, User, Users, School, Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { gradesAPI, studentsAPI, subjectsAPI, classesAPI, teachersAPI, reportsAPI, enrollmentAPI } from '@/lib/api';
import { 
  GradeWithRelations, 
  CreateGradeDto, 
  UpdateGradeDto, 
  GradeType,
  formatStudentName,
  formatTeacherName,
  formatGradeDate,
  formatSchoolYear,
  getGradeClassification,
  getGradeBadgeVariant,
  getGradeBackgroundClass,
  calculateGradeStats,
  getGradeTypeName,
  formatTerm
} from '@/types/grade';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Anos letivos agora são carregados dinamicamente da API

// Tipos de avaliação Angola
const GRADE_TYPES = [
  { value: 'MAC', label: 'MAC - Média das Avaliações Contínuas' },
  { value: 'NPP', label: 'NPP - Nota da Prova do Professor' },
  { value: 'NPT', label: 'NPT - Nota da Prova Trimestral' }
];

export default function Grades() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeWithRelations | null>(null);
  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);
  
  // Estados dos filtros organizados conforme nova especificação
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  
  const { toast } = useToast();
  const { user, hasAnyRole } = useAuth();
  const queryClient = useQueryClient();

  // Verificar permissões: apenas ADMIN e PROFESSOR podem modificar notas
  const canModifyGrades = hasAnyRole(['ADMIN', 'PROFESSOR']);
  const isSecretaria = user?.role === 'SECRETARIA';
  const isProfessor = user?.role === 'PROFESSOR';

  // Buscar o professor associado ao usuário quando for PROFESSOR
  useEffect(() => {
    const fetchCurrentTeacher = async () => {
      if (isProfessor && user?.id) {
        try {
          const teachers = await teachersAPI.getAll();
          const currentTeacher = teachers.find(t => t.userId === user.id);
          if (currentTeacher) {
            setCurrentTeacherId(currentTeacher.id);
          }
        } catch (error) {
          console.error('Erro ao buscar professor atual:', error);
        }
      }
    };
    
    fetchCurrentTeacher();
  }, [isProfessor, user?.id]);

  // Limpar seleções dependentes quando filtros superiores mudarem
  useEffect(() => {
    setSelectedStudentId('ALL');
  }, [selectedClassId]);

  useEffect(() => {
    setSelectedStudentId('ALL');
    setSelectedSubjectId('ALL');
  }, [selectedYear]);

  // Construir filtros ativos (apenas com valores válidos)
  const activeFilters = useMemo(() => {
    const filters: any = {};
    if (selectedYear) filters.year = selectedYear;
    if (selectedClassId && selectedClassId !== 'ALL') filters.classId = selectedClassId;
    if (selectedStudentId && selectedStudentId !== 'ALL') filters.studentId = selectedStudentId;
    if (selectedSubjectId && selectedSubjectId !== 'ALL') filters.subjectId = selectedSubjectId;
    if (selectedType && selectedType !== 'ALL') filters.type = selectedType;
    return filters;
  }, [selectedYear, selectedClassId, selectedStudentId, selectedSubjectId, selectedType]);

  // ================== QUERIES PARA FILTROS ==================

  // Carregar anos letivos disponíveis dinamicamente
  const { data: availableYears = [], isLoading: loadingYears } = useQuery({
    queryKey: ['enrollment-years'],
    queryFn: () => enrollmentAPI.getAvailableYears(),
    onError: (error: any) => {
      console.error('Erro ao carregar anos letivos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os anos letivos disponíveis',
        variant: 'destructive'
      });
    }
  });

  // Definir o ano mais recente como padrão quando os anos forem carregados
  useEffect(() => {
    if (availableYears.length > 0) {
      // Extrair o primeiro ano da string "2025/2026" -> 2025
      const mostRecentYear = parseInt(availableYears[0].split('/')[0]);
      if (selectedYear !== mostRecentYear) {
        setSelectedYear(mostRecentYear);
      }
    }
  }, [availableYears]);

  // Carregar turmas para seleção
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes', selectedYear],
    queryFn: async () => {
      const result = await classesAPI.getAll({ year: selectedYear });
      return result || [];
    },
    onError: (error: any) => {
      console.error('Erro ao carregar turmas:', error);
    }
  });

  // Carregar alunos da turma selecionada (usando endpoint otimizado)
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students-by-class', selectedClassId, selectedYear],
    queryFn: async () => {
      if (!selectedClassId || selectedClassId === 'ALL' || !selectedYear) return [];
      const result = await reportsAPI.getStudentsByClass(selectedClassId, selectedYear);
      return result || [];
    },
    enabled: Boolean(selectedClassId && selectedClassId !== 'ALL' && selectedYear),
    onError: (error: any) => {
      console.error('Erro ao carregar alunos da turma:', error);
    }
  });

  // Carregar disciplinas para seleção
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsAPI.getAll(),
    onError: (error: any) => {
      console.error('Erro ao carregar disciplinas:', error);
    }
  });

  // ================== QUERY PRINCIPAL PARA NOTAS ==================

  // Decidir qual endpoint usar baseado nos filtros
  const shouldFetchOptimized = Boolean(selectedStudentId && selectedStudentId !== 'ALL' && selectedTerm);
  const shouldFetchTraditional = Boolean(Object.keys(activeFilters).length > 0 && !shouldFetchOptimized);

  // Query para endpoint otimizado Angola (individual student)
  const { 
    data: angolaGrades, 
    isLoading: loadingAngolaGrades, 
    refetch: refetchAngolaGrades 
  } = useQuery({
    queryKey: ['angola-student-grades', selectedStudentId, selectedTerm],
    queryFn: async () => {
      if (!selectedStudentId || selectedStudentId === 'ALL') {
        return null;
      }
      const result = await gradesAPI.getStudentTermGrades(selectedStudentId, selectedTerm);
      console.log('📊 Angola grades loaded:', result);
      return result;
    },
    enabled: shouldFetchOptimized,
    staleTime: 5 * 60 * 1000,
    onError: (error: any) => {
      console.error('❌ Erro ao carregar notas Angola:', error);
      toast({
        title: 'Erro ao carregar notas',
        description: error.response?.data?.message || 'Não foi possível carregar as notas do aluno',
        variant: 'destructive'
      });
    }
  });

  // Query para endpoint tradicional (filtros gerais)
  const { 
    data: traditionalGrades = [], 
    isLoading: loadingTraditionalGrades, 
    refetch: refetchTraditionalGrades 
  } = useQuery({
    queryKey: ['traditional-grades', activeFilters],
    queryFn: async () => {
      console.log('📊 Carregando notas tradicionais com filtros:', activeFilters);
      const result = await gradesAPI.getAll(activeFilters);
      console.log('✅ Notas tradicionais carregadas:', result?.length, 'notas');
      return result;
    },
    enabled: shouldFetchTraditional,
    staleTime: 5 * 60 * 1000,
    onError: (error: any) => {
      console.error('❌ Erro ao carregar notas tradicionais:', error);
      toast({
        title: 'Erro ao carregar notas',
        description: error.response?.data?.message || 'Não foi possível carregar as notas',
        variant: 'destructive'
      });
    }
  });

  // ================== MUTATIONS ==================

  // Carregar dados adicionais para o formulário
  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-students'],
    queryFn: () => studentsAPI.getAll(),
    enabled: Boolean(isDialogOpen)
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersAPI.getAll(),
    enabled: Boolean(isDialogOpen)
  });

  // Mutation para criar nota
  const createMutation = useMutation({
    mutationFn: (data: CreateGradeDto) => gradesAPI.create(data),
    onSuccess: () => {
      refetchAngolaGrades();
      refetchTraditionalGrades();
      setIsDialogOpen(false);
      setEditingGrade(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Nota lançada com sucesso!' 
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erro ao lançar nota';
      
      if (error.response?.status === 403) {
        toast({
          title: 'Erro de Permissão',
          description: 'Você não tem permissão para lançar notas desta disciplina',
          variant: 'destructive'
        });
      } else if (error.response?.status === 409) {
        toast({
          title: 'Conflito',
          description: 'Já existe uma nota lançada para este aluno nesta disciplina',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro!',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    }
  });

  // Mutation para atualizar nota
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradeDto }) => 
      gradesAPI.update(id, data),
    onSuccess: () => {
      refetchAngolaGrades();
      refetchTraditionalGrades();
      setIsDialogOpen(false);
      setEditingGrade(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Nota atualizada com sucesso!' 
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar nota';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // Mutation para remover nota
  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradesAPI.delete(id),
    onSuccess: () => {
      refetchAngolaGrades();
      refetchTraditionalGrades();
      toast({ 
        title: 'Sucesso!',
        description: 'Nota removida com sucesso!' 
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erro ao remover nota';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // ================== HANDLERS ==================

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const gradeData: CreateGradeDto = {
      studentId: formData.get('studentId') as string,
      subjectId: formData.get('subjectId') as string,
      teacherId: isProfessor && currentTeacherId ? currentTeacherId : (formData.get('teacherId') as string),
      classId: formData.get('classId') as string,
      type: formData.get('type') as GradeType,
      term: parseInt(formData.get('term') as string) || 1,
      year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
      value: parseFloat(formData.get('value') as string) || 0,
    };

    // Validações básicas
    if (!gradeData.studentId || !gradeData.subjectId || !gradeData.teacherId || 
        !gradeData.classId || !gradeData.type) {
      toast({
        title: 'Erro',
        description: 'Todos os campos são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    if (gradeData.value < 0 || gradeData.value > 20) {
      toast({
        title: 'Erro',
        description: 'Nota deve estar entre 0 e 20',
        variant: 'destructive'
      });
      return;
    }

    if (editingGrade) {
      updateMutation.mutate({ id: editingGrade.id, data: gradeData });
    } else {
      createMutation.mutate(gradeData);
    }
  };

  const handleEdit = (grade: GradeWithRelations) => {
    setEditingGrade(grade);
    setIsDialogOpen(true);
  };

  const handleDelete = (grade: GradeWithRelations) => {
    if (confirm(`Tem certeza que deseja remover a nota de "${formatStudentName(grade.student)}" na disciplina "${grade.subject.name}"?`)) {
      deleteMutation.mutate(grade.id);
    }
  };

  const resetForm = () => {
    setEditingGrade(null);
    setIsDialogOpen(false);
  };

  const handleResetFilters = useCallback(() => {
    setSelectedYear(2024);
    setSelectedClassId('');
    setSelectedStudentId('');
    setSelectedSubjectId('');
    setSelectedType('');
    setSelectedTerm(1);
    console.log('🧹 Filtros limpos');
  }, []);

  // ================== DATA PROCESSING ==================

  // Determinar dados e loading state
  const isLoadingGrades = loadingAngolaGrades || loadingTraditionalGrades;
  const hasData = shouldFetchOptimized ? !!angolaGrades : traditionalGrades.length > 0;

  // Converter dados Angola para formato da tabela
  const displayGrades = useMemo(() => {
    if (shouldFetchOptimized && angolaGrades) {
      // Converter dados otimizados para formato da tabela
      return angolaGrades.subjects.map((subject: any) => ({
        id: `angola-${angolaGrades.student}-${subject.subject}-${selectedTerm}`,
        student: { firstName: angolaGrades.student.split(' ')[0], lastName: angolaGrades.student.split(' ').slice(1).join(' ') },
        subject: { name: subject.subject },
        teacher: { firstName: 'Sistema', lastName: 'Angola' },
        class: { name: 'Turma Selecionada' },
        type: 'MT',
        term: selectedTerm,
        year: selectedYear,
        value: subject.mt,
        createdAt: new Date().toISOString(),
        // Adicionar campos extras para mostrar detalhes Angola
        angolaData: {
          mac: subject.mac,
          npp: subject.npp,
          npt: subject.npt,
          mt: subject.mt,
          status: subject.status
        }
      }));
    }
    return traditionalGrades;
  }, [shouldFetchOptimized, angolaGrades, traditionalGrades, selectedTerm, selectedYear]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (shouldFetchOptimized && angolaGrades) {
      return {
        totalGrades: angolaGrades.subjects.length,
        averageGrade: angolaGrades.average || 0,
        passedStudents: angolaGrades.subjects.filter((s: any) => s.status === 'APROVADO').length,
        failedStudents: angolaGrades.subjects.filter((s: any) => s.status === 'REPROVADO').length
      };
    }
    return calculateGradeStats(traditionalGrades);
  }, [shouldFetchOptimized, angolaGrades, traditionalGrades]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sistema de Notas - Angola 🇦🇴</h1>
            <p className="text-muted-foreground">
              {isSecretaria 
                ? 'Visualização de notas com sistema otimizado Angola (Modo Somente Leitura)'
                : 'Gestão de notas com endpoints otimizados para o sistema educacional angolano'
              }
            </p>
            {isSecretaria && (
              <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                <Eye className="w-4 h-4" />
                <span>Modo Visualização - Apenas consulta de notas</span>
              </div>
            )}
          </div>
          {canModifyGrades && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingGrade(null)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Nota
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingGrade ? 'Editar Nota' : 'Nova Nota'}
                </DialogTitle>
                <DialogDescription>
                  {editingGrade 
                    ? 'Modifique as informações da nota conforme necessário.'
                    : 'Preencha os campos para lançar uma nova nota no sistema.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentId">Aluno</Label>
                    <Select name="studentId" defaultValue={editingGrade?.studentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {allStudents.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {formatStudentName(student)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subjectId">Disciplina</Label>
                    <Select name="subjectId" defaultValue={editingGrade?.subjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!isProfessor && (
                    <div>
                      <Label htmlFor="teacherId">Professor</Label>
                      <Select name="teacherId" defaultValue={editingGrade?.teacherId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um professor" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {formatTeacherName(teacher)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="classId">Turma</Label>
                    <Select name="classId" defaultValue={editingGrade?.classId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({formatSchoolYear(cls.year)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year">Ano Letivo</Label>
                    <Select name="year" defaultValue={editingGrade?.year?.toString() || new Date().getFullYear().toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map(yearRange => {
                          const year = parseInt(yearRange.split('/')[0]);
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {yearRange}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo de Avaliação</Label>
                    <Select name="type" defaultValue={editingGrade?.type || GradeType.MAC}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GradeType.MAC}>
                          {getGradeTypeName(GradeType.MAC)}
                        </SelectItem>
                        <SelectItem value={GradeType.NPP}>
                          {getGradeTypeName(GradeType.NPP)}
                        </SelectItem>
                        <SelectItem value={GradeType.NPT}>
                          {getGradeTypeName(GradeType.NPT)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="term">Trimestre</Label>
                    <Select name="term" defaultValue={editingGrade?.term?.toString() || '1'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o trimestre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Trimestre</SelectItem>
                        <SelectItem value="2">2º Trimestre</SelectItem>
                        <SelectItem value="3">3º Trimestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Nota (0-20)</Label>
                    <Input
                      type="number"
                      name="value"
                      min="0"
                      max="20"
                      step="0.5"
                      defaultValue={editingGrade?.value || ''}
                      placeholder="Digite a nota"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {editingGrade ? 'Atualizar' : 'Lançar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Estatísticas - KPIs no topo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGrades}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageGrade.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.passedStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedStudents}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Organizados em Layout Linear */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros de Pesquisa</CardTitle>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mt-4">
              
              {/* 1. Ano Letivo */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Ano Letivo
                  {loadingYears && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                </label>
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                  disabled={loadingYears || availableYears.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingYears 
                        ? "Carregando anos letivos..." 
                        : availableYears.length === 0 
                        ? "Nenhum ano letivo disponível"
                        : "Selecione um ano letivo"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(yearRange => {
                      const year = parseInt(yearRange.split('/')[0]);
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {yearRange}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {!loadingYears && availableYears.length === 0 && (
                  <p className="text-xs text-orange-600">Nenhum ano letivo encontrado no sistema</p>
                )}
                {!loadingYears && availableYears.length > 0 && (
                  <p className="text-xs text-green-600">{availableYears.length} ano(s) letivo(s) disponível(eis)</p>
                )}
              </div>

              {/* 2. Turma */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Turma
                </label>
                <Select 
                  value={selectedClassId} 
                  onValueChange={setSelectedClassId}
                  disabled={loadingClasses}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClasses ? "Carregando..." : "Selecione uma turma"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as turmas</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Aluno (depende da turma) */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Aluno
                </label>
                <Select 
                  value={selectedStudentId} 
                  onValueChange={setSelectedStudentId}
                  disabled={!selectedClassId || selectedClassId === 'ALL' || loadingStudents}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedClassId || selectedClassId === 'ALL' 
                        ? "Selecione uma turma primeiro" 
                        : loadingStudents 
                          ? "Carregando alunos..."
                          : "Selecione um aluno"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os alunos da turma</SelectItem>
                    {students.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Disciplina */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Disciplina
                </label>
                <Select 
                  value={selectedSubjectId} 
                  onValueChange={setSelectedSubjectId}
                  disabled={loadingSubjects}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingSubjects ? "Carregando..." : "Todas as disciplinas"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as disciplinas</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Tipo de Avaliação */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Tipo
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os tipos</SelectItem>
                    {GRADE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 6. Trimestre (para Angola) */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <School className="w-4 h-4" />
                  Trimestre
                </label>
                <Select value={selectedTerm.toString()} onValueChange={(value) => setSelectedTerm(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1º Trimestre</SelectItem>
                    <SelectItem value="2">2º Trimestre</SelectItem>
                    <SelectItem value="3">3º Trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                {isLoadingGrades && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Carregando {shouldFetchOptimized ? 'dados otimizados Angola' : 'notas'}...
                    </span>
                  </>
                )}
                {shouldFetchOptimized && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Modo Angola Otimizado
                  </Badge>
                )}
              </div>
              
              <Button variant="outline" onClick={handleResetFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Tabela de Notas com Scroll Interno */}
        <Card>
          <CardHeader>
            <CardTitle>
              {shouldFetchOptimized 
                ? `Notas Detalhadas - ${angolaGrades?.student || 'Aluno'} (${formatTerm(selectedTerm)})`
                : 'Lista de Notas'
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Container com scroll interno */}
            <div className="overflow-auto max-h-[600px] border-t">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="bg-background">Aluno</TableHead>
                    <TableHead className="bg-background">Disciplina</TableHead>
                    {!shouldFetchOptimized && <TableHead className="bg-background">Professor</TableHead>}
                    {!shouldFetchOptimized && <TableHead className="bg-background">Turma</TableHead>}
                    <TableHead className="bg-background">Tipo</TableHead>
                    {shouldFetchOptimized && <TableHead className="bg-background">MAC</TableHead>}
                    {shouldFetchOptimized && <TableHead className="bg-background">NPP</TableHead>}
                    {shouldFetchOptimized && <TableHead className="bg-background">NPT</TableHead>}
                    <TableHead className="bg-background">
                      {shouldFetchOptimized ? 'MT (Média)' : 'Nota'}
                    </TableHead>
                    <TableHead className="bg-background">Status</TableHead>
                    <TableHead className="bg-background">Trimestre</TableHead>
                    {!shouldFetchOptimized && <TableHead className="bg-background">Data</TableHead>}
                    {canModifyGrades && !shouldFetchOptimized && (
                      <TableHead className="bg-background">Ações</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                {isLoadingGrades ? (
                  <TableRow>
                    <TableCell colSpan={shouldFetchOptimized ? 9 : (canModifyGrades ? 10 : 9)} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          {shouldFetchOptimized ? 'Carregando dados otimizados...' : 'Carregando notas...'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayGrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={shouldFetchOptimized ? 9 : (canModifyGrades ? 10 : 9)} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-4xl">📊</div>
                        <div>
                          <p className="font-medium">Nenhuma nota encontrada</p>
                          <p className="text-sm">
                            {shouldFetchOptimized 
                              ? 'Selecione um aluno e trimestre para ver as notas otimizadas'
                              : 'Ajuste os filtros para visualizar as notas'
                            }
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayGrades.map((grade) => {
                    const classification = getGradeClassification(grade.value);
                    return (
                      <TableRow key={grade.id}>
                        <TableCell>
                          <div className="font-medium">
                            {formatStudentName(grade.student)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{grade.subject.name}</span>
                        </TableCell>
                        {!shouldFetchOptimized && (
                          <>
                            <TableCell>
                              <span>{formatTeacherName(grade.teacher)}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                <span>{grade.class.name}</span>
                              </div>
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Badge variant="outline">
                            {shouldFetchOptimized ? 'MT' : grade.type}
                          </Badge>
                        </TableCell>
                        {shouldFetchOptimized && (
                          <>
                            <TableCell>
                              <span className="text-sm">
                                {grade.angolaData?.mac ?? '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {grade.angolaData?.npp ?? '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {grade.angolaData?.npt ?? '-'}
                              </span>
                            </TableCell>
                          </>
                        )}
                        <TableCell className={`${getGradeBackgroundClass(grade.value)} border-l-4`}>
                          <div className="px-2 py-1 rounded-md">
                            <span className="font-bold text-lg">
                              {grade.value.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{
                              shouldFetchOptimized 
                                ? (grade.angolaData?.status === 'APROVADO' ? '✅' : 
                                   grade.angolaData?.status === 'REPROVADO' ? '❌' : '⏳')
                                : classification.icon
                            }</span>
                            <span className={
                              shouldFetchOptimized 
                                ? (grade.angolaData?.status === 'APROVADO' ? 'text-green-600' : 
                                   grade.angolaData?.status === 'REPROVADO' ? 'text-red-600' : 'text-yellow-600')
                                : classification.color
                            }>
                              {shouldFetchOptimized 
                                ? grade.angolaData?.status 
                                : classification.label
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{formatTerm(grade.term)}</span>
                        </TableCell>
                        {!shouldFetchOptimized && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">{formatGradeDate(grade.createdAt)}</span>
                            </div>
                          </TableCell>
                        )}
                        {canModifyGrades && !shouldFetchOptimized && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(grade)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(grade)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}