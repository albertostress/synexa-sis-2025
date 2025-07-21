
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
import { Plus, Edit, Trash2, FileText, GraduationCap, Search, Calendar, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { gradesAPI, studentsAPI, subjectsAPI, classesAPI, teachersAPI } from '@/lib/api';
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



export default function Grades() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeWithRelations | null>(null);
  
  // Estados dos filtros organizados conforme nova especificação
  const [studentName, setStudentName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedType, setSelectedType] = useState<string>('');
  
  // Estado interno para debounce do nome do aluno
  const [debouncedStudentName, setDebouncedStudentName] = useState('');
  const { toast } = useToast();
  const { user, hasAnyRole } = useAuth();
  const queryClient = useQueryClient();

  // Debounce para nome do aluno (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedStudentName(studentName);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [studentName]);

  // Limpar disciplina quando turma mudar
  useEffect(() => {
    setSelectedSubjectId('');
  }, [selectedClassId]);

  // Verificar permissões: apenas ADMIN e PROFESSOR podem modificar notas
  const canModifyGrades = hasAnyRole(['ADMIN', 'PROFESSOR']);
  const isSecretaria = user?.role === 'SECRETARIA';

  // Construir filtros ativos (apenas com valores válidos)
  const activeFilters = useMemo(() => {
    const filters: any = {};
    if (selectedYear) filters.year = selectedYear;
    if (selectedClassId) filters.classId = selectedClassId;
    if (selectedSubjectId) filters.subjectId = selectedSubjectId;
    if (debouncedStudentName.trim()) filters.studentName = debouncedStudentName.trim();
    if (selectedType) filters.type = selectedType;
    return filters;
  }, [selectedYear, selectedClassId, selectedSubjectId, debouncedStudentName, selectedType]);

  // Verificar se deve carregar dados (pelo menos um filtro ativo ou ano padrão)
  const shouldFetch = useMemo(() => {
    return Object.keys(activeFilters).length > 0 || selectedYear === 2024;
  }, [activeFilters, selectedYear]);

  // Carregar notas do backend com filtros reativos
  const { data: grades = [], isLoading: loadingGrades, refetch, isFetching } = useQuery({
    queryKey: ['grades', activeFilters],
    queryFn: async () => {
      console.log('📊 Carregando notas com filtros...');
      console.log('🔍 Filtros ativos:', activeFilters);
      
      // Se não há filtros ativos, carregar apenas do ano atual
      const filters = Object.keys(activeFilters).length > 0 
        ? activeFilters 
        : { year: selectedYear };
      
      const result = await gradesAPI.getAll(filters);
      console.log('✅ Notas carregadas:', result?.length, 'notas');
      return result;
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    onError: (error: any) => {
      console.error('❌ Erro ao carregar notas:', error);
      toast({
        title: 'Erro ao carregar notas',
        description: error.response?.data?.message || 'Não foi possível carregar as notas',
        variant: 'destructive'
      });
    }
  });

  // Carregar estudantes para seleção
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsAPI.getAll(),
    enabled: isDialogOpen,
    onError: (error: any) => {
      console.error('Erro ao carregar estudantes:', error);
    }
  });

  // Carregar disciplinas para seleção (sempre disponíveis para filtros)
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsAPI.getAll(),
    onError: (error: any) => {
      console.error('Erro ao carregar disciplinas:', error);
    }
  });

  // Carregar turmas para seleção (sempre disponíveis para filtros)
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    onError: (error: any) => {
      console.error('Erro ao carregar turmas:', error);
    }
  });

  // Carregar professores para seleção
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersAPI.getAll(),
    enabled: isDialogOpen,
    onError: (error: any) => {
      console.error('Erro ao carregar professores:', error);
    }
  });

  // Mutation para criar nota
  const createMutation = useMutation({
    mutationFn: (data: CreateGradeDto) => {
      console.log('🚀 Criando nota:', data);
      return gradesAPI.create(data);
    },
    onSuccess: (result) => {
      console.log('✅ Nota criada com sucesso:', result);
      refetch();
      setIsDialogOpen(false);
      setEditingGrade(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Nota lançada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar nota:', error);
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
      } else if (error.response?.status === 400) {
        toast({
          title: 'Erro de Validação',
          description: 'Aluno não está matriculado nesta turma no ano especificado',
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
      refetch();
      setIsDialogOpen(false);
      setEditingGrade(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Nota atualizada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar nota:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar nota';
      
      if (error.response?.status === 403) {
        toast({
          title: 'Erro de Permissão',
          description: 'Você só pode atualizar notas que você mesmo lançou',
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

  // Mutation para remover nota
  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradesAPI.delete(id),
    onSuccess: () => {
      refetch();
      toast({ 
        title: 'Sucesso!',
        description: 'Nota removida com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao remover nota:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao remover nota';
      
      if (error.response?.status === 403) {
        toast({
          title: 'Erro de Permissão',
          description: 'Você só pode remover notas que você mesmo lançou',
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

  // Calcular estatísticas (agora usa dados já filtrados do backend)
  const stats = calculateGradeStats(grades);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const gradeData: CreateGradeDto = {
      studentId: formData.get('studentId') as string,
      subjectId: formData.get('subjectId') as string,
      teacherId: formData.get('teacherId') as string,
      classId: formData.get('classId') as string,
      type: formData.get('type') as GradeType,
      term: parseInt(formData.get('term') as string) || 1,
      year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
      value: parseFloat(formData.get('value') as string) || 0,
    };

    // Validações básicas
    if (!gradeData.studentId) {
      toast({
        title: 'Erro',
        description: 'Aluno é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.subjectId) {
      toast({
        title: 'Erro',
        description: 'Disciplina é obrigatória',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.teacherId) {
      toast({
        title: 'Erro',
        description: 'Professor é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.classId) {
      toast({
        title: 'Erro',
        description: 'Turma é obrigatória',
        variant: 'destructive'
      });
      return;
    }

    if (gradeData.year < 2020) {
      toast({
        title: 'Erro',
        description: 'Ano deve ser 2020 ou posterior',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.type) {
      toast({
        title: 'Erro',
        description: 'Tipo de avaliação é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.term || gradeData.term < 1 || gradeData.term > 3) {
      toast({
        title: 'Erro',
        description: 'Trimestre deve ser 1, 2 ou 3',
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
      updateMutation.mutate({ 
        id: editingGrade.id, 
        data: gradeData 
      });
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

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Função para limpar todos os filtros
  const handleResetFilters = useCallback(() => {
    setStudentName('');
    setSelectedClassId('');
    setSelectedSubjectId('');
    setSelectedYear(2024);
    setSelectedType('');
    console.log('🧹 Filtros limpos - Página recarregará automaticamente');
  }, []);

  // Log para debug dos filtros ativos
  useEffect(() => {
    console.log('🔍 Filtros ativos mudaram:', activeFilters);
    console.log('📋 shouldFetch:', shouldFetch);
  }, [activeFilters, shouldFetch]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sistema de Notas - Angola 🇦🇴</h1>
            <p className="text-muted-foreground">
              {isSecretaria 
                ? 'Visualização de notas e avaliações dos alunos (Modo Somente Leitura)'
                : 'Gestão de notas e avaliações dos alunos'
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
                        {loadingStudents ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : (
                          students.map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              {formatStudentName(student)}
                            </SelectItem>
                          ))
                        )}
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
                        {loadingSubjects ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : (
                          subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="teacherId">Professor</Label>
                    <Select name="teacherId" defaultValue={editingGrade?.teacherId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um professor" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingTeachers ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : (
                          teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {formatTeacherName(teacher)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="classId">Turma</Label>
                    <Select name="classId" defaultValue={editingGrade?.classId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingClasses ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : (
                          classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} ({formatSchoolYear(cls.year)})
                            </SelectItem>
                          ))
                        )}
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
                        {Array.from({length: 11}, (_, i) => 2020 + i).map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {formatSchoolYear(year)}
                          </SelectItem>
                        ))}
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
                        <SelectItem value={GradeType.MT}>
                          {getGradeTypeName(GradeType.MT)}
                        </SelectItem>
                        <SelectItem value={GradeType.FAL}>
                          {getGradeTypeName(GradeType.FAL)}
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

        {/* Estatísticas - Fixas no topo */}
        <div className="sticky top-0 z-20 bg-background pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Notas</span>
              <div className="flex items-end gap-3 flex-wrap">
                {/* 1. Nome do Aluno */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Nome do Aluno</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome do aluno..."
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="pl-10 pr-10 w-64"
                    />
                    {debouncedStudentName !== studentName && studentName && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Turma */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Turma</label>
                  <Select 
                    value={selectedClassId || 'ALL'} 
                    onValueChange={(value) => setSelectedClassId(value === 'ALL' ? '' : value)}
                    disabled={loadingClasses}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={loadingClasses ? "Carregando..." : "Todas as turmas"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas as Turmas</SelectItem>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Disciplina */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Disciplina</label>
                  <Select 
                    value={selectedSubjectId || 'ALL'} 
                    onValueChange={(value) => setSelectedSubjectId(value === 'ALL' ? '' : value)}
                    disabled={loadingSubjects}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={loadingSubjects ? "Carregando..." : "Todas as disciplinas"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas as Disciplinas</SelectItem>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 4. Ano Letivo */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Ano Letivo</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 5. Tipo de Avaliação */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Tipo de Avaliação</label>
                  <Select 
                    value={selectedType || 'ALL'} 
                    onValueChange={(value) => setSelectedType(value === 'ALL' ? '' : value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos os tipos</SelectItem>
                      <SelectItem value="MAC">MAC - Média das Avaliações Contínuas</SelectItem>
                      <SelectItem value="NPP">NPP - Nota da Prova do Professor</SelectItem>
                      <SelectItem value="NPT">NPT - Nota da Prova Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão de Reset */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground invisible">Reset</label>
                  <Button 
                    variant="outline" 
                    onClick={handleResetFilters}
                    className="h-10 px-3"
                    disabled={loadingGrades || isFetching}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
              
              {/* Indicador de Loading Global */}
              {(loadingGrades || isFetching) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Carregando notas...</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[600px] border-t">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="bg-background">Aluno</TableHead>
                    <TableHead className="bg-background">Disciplina</TableHead>
                    <TableHead className="bg-background">Professor</TableHead>
                    <TableHead className="bg-background">Turma</TableHead>
                    <TableHead className="bg-background">Tipo</TableHead>
                    <TableHead className="bg-background">Trimestre</TableHead>
                    <TableHead className="bg-background">Nota</TableHead>
                    <TableHead className="bg-background">Classificação</TableHead>
                    <TableHead className="bg-background">Data</TableHead>
                    {canModifyGrades && <TableHead className="bg-background">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                {loadingGrades ? (
                  <TableRow>
                    <TableCell colSpan={canModifyGrades ? 10 : 9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground">Carregando notas...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : grades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canModifyGrades ? 10 : 9} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-4xl">📊</div>
                        <div>
                          <p className="font-medium">Nenhuma nota encontrada</p>
                          <p className="text-sm">
                            {Object.keys(activeFilters).length > 0 
                              ? 'Tente ajustar os filtros acima'
                              : 'Adicione filtros para visualizar as notas'
                            }
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  grades.map((grade) => {
                    const classification = getGradeClassification(grade.value);
                    return (
                      <TableRow key={grade.id}>
                        <TableCell>
                          <div className="font-medium">{formatStudentName(grade.student)}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{grade.subject.name}</span>
                        </TableCell>
                        <TableCell>
                          <span>{formatTeacherName(grade.teacher)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            <span>{grade.class.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {grade.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span>{formatTerm(grade.term)}</span>
                        </TableCell>
                        <TableCell className={`${getGradeBackgroundClass(grade.value)} border-l-4`}>
                          <div className="px-2 py-1 rounded-md">
                            <span className="font-bold text-lg">
                              {grade.value.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{classification.icon}</span>
                            <span className={classification.color}>
                              {classification.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{formatGradeDate(grade.createdAt)}</span>
                          </div>
                        </TableCell>
                        {canModifyGrades && (
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
