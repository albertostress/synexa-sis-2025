import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, UserPlus, Calendar, Users, GraduationCap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { enrollmentAPI, studentsAPI, classesAPI } from '@/lib/api';
import { useEnrollmentYears } from '@/hooks/useEnrollmentYears';
import { 
  EnrollmentWithRelations, 
  CreateEnrollmentDto, 
  UpdateEnrollmentDto, 
  EnrollmentStatus,
  EnrollmentStatusLabels,
  formatStudentName,
  formatEnrollmentDate,
  formatSchoolYear,
  getStatusBadgeVariant,
  calculateEnrollmentStats
} from '@/types/enrollment';
import { EnrollmentCreateModal } from '@/components/enrollment/EnrollmentCreateModal';

export default function Enrollments() {
  console.log('🚀 Enrollments component rendering...');
  
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewEnrollmentModalOpen, setIsNewEnrollmentModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<EnrollmentWithRelations | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025); // Default to 2025
  const [selectedStatus, setSelectedStatus] = useState<EnrollmentStatus | ''>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar anos letivos disponíveis dinamicamente
  const { yearsAsNumbers, mostRecentYear, loadingYears } = useEnrollmentYears();

  // Definir o ano mais recente como padrão quando os anos forem carregados
  useEffect(() => {
    if (yearsAsNumbers.length > 0 && selectedYear !== mostRecentYear) {
      console.log('🎯 Setting selected year to:', mostRecentYear);
      setSelectedYear(mostRecentYear);
    }
  }, [yearsAsNumbers, mostRecentYear]);

  // Carregar matrículas do backend
  const { 
    data: enrollments = [], 
    isLoading: loadingEnrollments, 
    error: enrollmentsError,
    refetch 
  } = useQuery({
    queryKey: ['enrollments', selectedYear, selectedStatus],
    queryFn: async () => {
      console.log('📚 Carregando matrículas para o ano:', selectedYear);
      const filters = {
        ...(selectedYear && { year: selectedYear }),
        ...(selectedStatus && { status: selectedStatus as EnrollmentStatus })
      };
      const data = await enrollmentAPI.getAll(filters);
      // Garantir que sempre retorna um array
      const enrollmentsArray = Array.isArray(data) ? data : [];
      console.log('🎓 Matrículas carregadas:', enrollmentsArray.length, 'matrículas');
      return enrollmentsArray;
    },
    enabled: !!user && !loadingYears && selectedYear > 0, // Only fetch when authenticated and year is ready
    staleTime: 30000, // Cache por 30 segundos
    retry: 1
  });

  // Tratamento de erro do lado do React
  if (enrollmentsError) {
    console.error('❌ Erro ao carregar matrículas:', enrollmentsError);
    toast({
      title: 'Erro',
      description: 'Não foi possível carregar as matrículas',
      variant: 'destructive'
    });
  }

  // Carregar estudantes para seleção
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const data = await studentsAPI.getAll();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user && isDialogOpen,
    staleTime: 60000, // Cache por 1 minuto
    retry: 1
  });
  const students = Array.isArray(studentsData) ? studentsData : [];

  // Carregar turmas para seleção
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const data = await classesAPI.getAll();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user && isDialogOpen,
    staleTime: 60000, // Cache por 1 minuto
    retry: 1
  });
  const classes = Array.isArray(classesData) ? classesData : [];

  // Mutation para criar matrícula
  const createMutation = useMutation({
    mutationFn: (data: CreateEnrollmentDto) => {
      console.log('🚀 Criando matrícula:', data);
      return enrollmentAPI.create(data);
    },
    onSuccess: (result) => {
      console.log('✅ Matrícula criada com sucesso:', result);
      refetch();
      setIsDialogOpen(false);
      setEditingEnrollment(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Matrícula criada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar matrícula:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar matrícula';
      
      if (error.response?.status === 409) {
        toast({
          title: 'Conflito',
          description: 'Aluno já possui matrícula ativa neste ano letivo',
          variant: 'destructive'
        });
      } else if (error.response?.status === 400) {
        toast({
          title: 'Erro de Validação',
          description: 'Turma já atingiu a capacidade máxima',
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

  // Mutation para atualizar matrícula
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEnrollmentDto }) => 
      enrollmentAPI.update(id, data),
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingEnrollment(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Matrícula atualizada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar matrícula:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar matrícula';
      
      if (error.response?.status === 409) {
        toast({
          title: 'Conflito',
          description: 'Aluno já possui matrícula ativa neste ano letivo',
          variant: 'destructive'
        });
      } else if (error.response?.status === 400) {
        toast({
          title: 'Erro de Validação',
          description: 'Turma já atingiu a capacidade máxima',
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

  // Mutation para cancelar matrícula
  const deleteMutation = useMutation({
    mutationFn: (id: string) => enrollmentAPI.delete(id),
    onSuccess: () => {
      refetch();
      toast({ 
        title: 'Sucesso!',
        description: 'Matrícula cancelada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao cancelar matrícula:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao cancelar matrícula';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // Filtrar matrículas (garantir que enrollments é sempre um array)
  const safeEnrollments = Array.isArray(enrollments) ? enrollments : [];
  const filteredEnrollments = safeEnrollments.filter(enrollment => {
    const studentName = formatStudentName(enrollment.student);
    const className = enrollment.class.name;
    const studentNumber = enrollment.student.studentNumber || '';
    
    // Filtro de busca
    const matchesSearch = searchTerm === '' || (
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Filtro de turma
    const matchesClass = selectedClassFilter === '' || enrollment.class.id === selectedClassFilter;
    
    return matchesSearch && matchesClass;
  });

  // Calcular estatísticas (garantir que filteredEnrollments é um array)
  const stats = calculateEnrollmentStats(Array.isArray(filteredEnrollments) ? filteredEnrollments : []);
  
  // Obter lista única de turmas das matrículas
  const uniqueClasses = Array.from(
    new Map(
      safeEnrollments.map(enrollment => [
        enrollment.class.id,
        { id: enrollment.class.id, name: enrollment.class.name }
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const enrollmentData: CreateEnrollmentDto = {
      studentId: formData.get('studentId') as string,
      classId: formData.get('classId') as string,
      year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
      status: formData.get('status') as EnrollmentStatus,
    };

    // Validações básicas
    if (!enrollmentData.studentId) {
      toast({
        title: 'Erro',
        description: 'Aluno é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!enrollmentData.classId) {
      toast({
        title: 'Erro',
        description: 'Turma é obrigatória',
        variant: 'destructive'
      });
      return;
    }

    if (enrollmentData.year < 2020) {
      toast({
        title: 'Erro',
        description: 'Ano deve ser 2020 ou posterior',
        variant: 'destructive'
      });
      return;
    }

    if (editingEnrollment) {
      updateMutation.mutate({ 
        id: editingEnrollment.id, 
        data: enrollmentData 
      });
    } else {
      createMutation.mutate(enrollmentData);
    }
  };

  const handleEdit = (enrollment: EnrollmentWithRelations) => {
    setEditingEnrollment(enrollment);
    setIsDialogOpen(true);
  };

  const handleDelete = (enrollment: EnrollmentWithRelations) => {
    if (confirm(`Tem certeza que deseja cancelar a matrícula de "${formatStudentName(enrollment.student)}"?`)) {
      deleteMutation.mutate(enrollment.id);
    }
  };

  const resetForm = () => {
    setEditingEnrollment(null);
    setIsDialogOpen(false);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Debug info
  console.log('🔍 Render state:', {
    user: !!user,
    loadingYears,
    yearsAsNumbers,
    selectedYear,
    loadingEnrollments,
    enrollmentsCount: enrollments?.length,
    enrollmentsError
  });

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  // Early return if still loading years
  if (loadingYears) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando anos letivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Matrículas</h1>
            <p className="text-muted-foreground">Gerir matrículas e rematrículas de alunos</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsNewEnrollmentModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              + Nova Matrícula
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingEnrollment(null)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Estudante Existente
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEnrollment ? 'Editar Matrícula' : 'Nova Matrícula'}
                </DialogTitle>
                <DialogDescription>
                  {editingEnrollment 
                    ? 'Modifique as informações da matrícula conforme necessário.'
                    : 'Preencha os campos para criar uma nova matrícula no sistema.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentId">Aluno</Label>
                    <Select name="studentId" defaultValue={editingEnrollment?.studentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingStudents ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : students && students.length > 0 ? (
                          students.map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              {formatStudentName(student)} ({student.studentNumber})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center p-2">Nenhum aluno disponível</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="classId">Turma</Label>
                    <Select name="classId" defaultValue={editingEnrollment?.classId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingClasses ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : classes && classes.length > 0 ? (
                          classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} ({formatSchoolYear(cls.year)})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center p-2">Nenhuma turma disponível</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year">Ano Letivo</Label>
                    <Select name="year" defaultValue={editingEnrollment?.year?.toString() || mostRecentYear.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingYears ? "Carregando anos..." : "Selecione o ano"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingYears ? (
                          <div className="text-center p-2">Carregando anos letivos...</div>
                        ) : yearsAsNumbers && yearsAsNumbers.length > 0 ? (
                          yearsAsNumbers.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {formatSchoolYear(year)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center p-2">Nenhum ano disponível</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingEnrollment?.status || EnrollmentStatus.ACTIVE}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {(EnrollmentStatus ? Object.values(EnrollmentStatus) : []).map(status => (
                          <SelectItem key={status} value={status}>
                            {EnrollmentStatusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {editingEnrollment ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Filtros e estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeEnrollments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingEnrollments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelledEnrollments}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="py-3 border-b">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Lista de Matrículas ({filteredEnrollments.length})
              </span>
              <div className="flex items-center gap-2">
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))} disabled={loadingYears}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={loadingYears ? "..." : selectedYear.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingYears ? (
                      <div className="text-center p-2">Carregando...</div>
                    ) : yearsAsNumbers && yearsAsNumbers.length > 0 ? (
                      yearsAsNumbers.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="text-center p-2">Nenhum ano</div>
                    )}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus || 'ALL'} onValueChange={(value) => setSelectedStatus(value === 'ALL' ? '' : value as EnrollmentStatus)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {(EnrollmentStatus ? Object.values(EnrollmentStatus) : []).map(status => (
                      <SelectItem key={status} value={status}>
                        {EnrollmentStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedClassFilter || 'ALL'} onValueChange={(value) => setSelectedClassFilter(value === 'ALL' ? '' : value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as Turmas</SelectItem>
                    {uniqueClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar matrículas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto" style={{ maxHeight: '480px', minHeight: '300px' }}>
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
                  <TableRow>
                    <TableHead className="w-2/5">Aluno</TableHead>
                    <TableHead className="w-1/5">Turma</TableHead>
                    <TableHead className="w-1/5">Status</TableHead>
                    <TableHead className="w-1/5 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {loadingYears || loadingEnrollments ? (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={4} className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded animate-pulse w-1/3"></div>
                              <div className="h-3 bg-muted/60 rounded animate-pulse w-1/5"></div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : enrollmentsError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="text-red-500">Erro ao carregar matrículas. Tente novamente.</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => refetch()}
                      >
                        Tentar novamente
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : !safeEnrollments || safeEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma matrícula cadastrada
                    </TableCell>
                  </TableRow>
                ) : filteredEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma matrícula encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="w-2/5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold">
                              {enrollment.student.firstName?.charAt(0)}{enrollment.student.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{formatStudentName(enrollment.student)}</div>
                            <div className="text-xs text-muted-foreground">{enrollment.student.studentNumber || 'N/A'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-1/5">
                        <div>
                          <div className="font-medium">{enrollment.class.name}</div>
                          <div className="text-xs text-muted-foreground">{formatSchoolYear(enrollment.year)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="w-1/5">
                        <Badge variant={getStatusBadgeVariant(enrollment.status)}>
                          {EnrollmentStatusLabels[enrollment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-1/5">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(enrollment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(enrollment)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal do novo formulário de matrícula */}
        <EnrollmentCreateModal 
          open={isNewEnrollmentModalOpen}
          onOpenChange={setIsNewEnrollmentModalOpen}
          onSuccess={() => {
            refetch(); // Recarregar lista de matrículas
          }}
        />
      </div>
  );
}