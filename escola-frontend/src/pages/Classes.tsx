
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, GraduationCap, Users, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelectSimple } from '@/components/ui/multi-select-simple';
import { useToast } from '@/hooks/use-toast';
import { classesAPI, studentsAPI, teachersAPI } from '@/lib/api';
import { 
  SchoolClassWithRelations, 
  CreateClassDto, 
  UpdateClassDto, 
  Shift, 
  ShiftLabels,
  calculateClassStats,
  formatSchoolYear,
  getOccupancyBadgeVariant
} from '@/types/class';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Classes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClassWithRelations | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar turmas do backend
  const { data: classes = [], isLoading: loadingClasses, refetch } = useQuery({
    queryKey: ['classes'],
    queryFn: () => {
      console.log('📚 Carregando turmas...');
      return classesAPI.getAll();
    },
    onSuccess: (data) => {
      console.log('🎓 Turmas carregadas:', data?.length, 'turmas');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao carregar turmas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as turmas',
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

  // Carregar professores para seleção
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersAPI.getAll(),
    enabled: isDialogOpen,
    onError: (error: any) => {
      console.error('Erro ao carregar professores:', error);
    }
  });

  // Mutation para criar turma
  const createMutation = useMutation({
    mutationFn: (data: CreateClassDto) => {
      console.log('🚀 Criando turma:', data);
      return classesAPI.create(data);
    },
    onSuccess: (result) => {
      console.log('✅ Turma criada com sucesso:', result);
      refetch();
      setIsDialogOpen(false);
      setEditingClass(null);
      setSelectedStudents([]);
      setSelectedTeachers([]);
      toast({ 
        title: 'Sucesso!',
        description: 'Turma criada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar turma:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar turma';
      
      if (error.response?.status === 409) {
        toast({
          title: 'Conflito',
          description: 'Já existe uma turma com este nome para este ano',
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

  // Mutation para atualizar turma
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClassDto }) => 
      classesAPI.update(id, data),
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingClass(null);
      setSelectedStudents([]);
      setSelectedTeachers([]);
      toast({ 
        title: 'Sucesso!',
        description: 'Turma atualizada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar turma:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar turma';
      
      if (error.response?.status === 409) {
        toast({
          title: 'Conflito',
          description: 'Já existe uma turma com este nome para este ano',
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

  // Mutation para deletar turma
  const deleteMutation = useMutation({
    mutationFn: (id: string) => classesAPI.delete(id),
    onSuccess: () => {
      refetch();
      toast({ 
        title: 'Sucesso!',
        description: 'Turma removida com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao remover turma:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao remover turma';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // Filtrar e ordenar turmas
  const filteredClasses = classes
    .filter(cls =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.year.toString().includes(searchTerm) ||
      ShiftLabels[cls.shift].toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teachers?.some(teacher => 
        teacher.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      // Ordenar por ano (desc) e depois por nome (asc)
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return a.name.localeCompare(b.name);
    });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const classData: CreateClassDto = {
      name: formData.get('name') as string,
      year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
      shift: formData.get('shift') as Shift,
      capacity: parseInt(formData.get('capacity') as string) || 30,
      studentIds: selectedStudents.length > 0 ? selectedStudents : undefined,
      teacherIds: selectedTeachers.length > 0 ? selectedTeachers : undefined
    };

    // Validações básicas
    if (!classData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da turma é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (classData.capacity <= 0) {
      toast({
        title: 'Erro',
        description: 'Capacidade deve ser maior que zero',
        variant: 'destructive'
      });
      return;
    }

    if (classData.year < 2020) {
      toast({
        title: 'Erro',
        description: 'Ano deve ser 2020 ou posterior',
        variant: 'destructive'
      });
      return;
    }

    if (editingClass) {
      updateMutation.mutate({ 
        id: editingClass.id, 
        data: classData 
      });
    } else {
      createMutation.mutate(classData);
    }
  };

  const handleEdit = (schoolClass: SchoolClassWithRelations) => {
    setEditingClass(schoolClass);
    setSelectedStudents(schoolClass.students?.map(s => s.id) || []);
    setSelectedTeachers(schoolClass.teachers?.map(t => t.id) || []);
    setIsDialogOpen(true);
  };

  const handleDelete = (schoolClass: SchoolClassWithRelations) => {
    if (confirm(`Tem certeza que deseja remover a turma "${schoolClass.name}"?`)) {
      deleteMutation.mutate(schoolClass.id);
    }
  };

  const resetForm = () => {
    setEditingClass(null);
    setSelectedStudents([]);
    setSelectedTeachers([]);
    setIsDialogOpen(false);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground">Gerir turmas e organização escolar</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingClass(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingClass ? 'Editar Turma' : 'Nova Turma'}
              </DialogTitle>
              <DialogDescription>
                {editingClass 
                  ? 'Modifique as informações da turma conforme necessário.'
                  : 'Preencha os campos para criar uma nova turma no sistema.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Turma</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingClass?.name}
                    placeholder="Ex: 10ª A, 11ª B"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Ano Letivo</Label>
                  <Select name="year" defaultValue={editingClass?.year?.toString() || new Date().getFullYear().toString()}>
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
                  <Label htmlFor="shift">Turno</Label>
                  <Select name="shift" defaultValue={editingClass?.shift || Shift.MORNING}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Shift).map(shift => (
                        <SelectItem key={shift} value={shift}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {ShiftLabels[shift]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="capacity">Capacidade Máxima</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    defaultValue={editingClass?.capacity || 30}
                    placeholder="Ex: 30"
                    min="1"
                    max="50"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Estudantes da Turma</Label>
                  <MultiSelectSimple
                    options={(students || []).map(student => ({
                      value: student.id,
                      label: `${student.firstName} ${student.lastName} (${student.studentNumber})`,
                      icon: Users
                    }))}
                    selected={selectedStudents}
                    onChange={setSelectedStudents}
                    placeholder="Selecionar estudantes..."
                    emptyIndicator={
                      loadingStudents ? 
                        "Carregando estudantes..." : 
                        "Nenhum estudante encontrado"
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedStudents.length} estudante(s) selecionado(s)
                  </p>
                </div>
                
                <div>
                  <Label>Professores da Turma</Label>
                  <MultiSelectSimple
                    options={(teachers || []).map(teacher => ({
                      value: teacher.id,
                      label: `${teacher.user?.name || 'Nome não disponível'}${teacher.user?.email ? ` (${teacher.user.email})` : ''}`,
                      icon: GraduationCap
                    }))}
                    selected={selectedTeachers}
                    onChange={setSelectedTeachers}
                    placeholder="Selecionar professores..."
                    emptyIndicator={
                      loadingTeachers ? 
                        "Carregando professores..." : 
                        "Nenhum professor encontrado"
                    }
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTeachers.length} professor(es) selecionado(s)
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingClass ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Turmas</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar turmas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Turma</TableHead>
                <TableHead>Ano Letivo</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Estudantes</TableHead>
                <TableHead>Professores</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingClasses ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma turma encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls) => {
                  const stats = calculateClassStats(cls);
                  return (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{cls.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {cls.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{formatSchoolYear(cls.year)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          {ShiftLabels[cls.shift]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{stats.totalStudents}</div>
                            <div className="text-sm text-muted-foreground">
                              {stats.totalStudents > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {cls.students?.slice(0, 3).map(student => (
                                    <Badge key={student.id} variant="secondary" className="text-xs">
                                      {student.firstName}
                                    </Badge>
                                  ))}
                                  {cls.students && cls.students.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{cls.students.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{cls.teachers?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">
                              {cls.teachers && cls.teachers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {cls.teachers.slice(0, 2).map(teacher => (
                                    <Badge key={teacher.id} variant="secondary" className="text-xs">
                                      {teacher.user?.name?.split(' ')[0] || 'N/A'}
                                    </Badge>
                                  ))}
                                  {cls.teachers.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{cls.teachers.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-medium">{stats.totalStudents}/{stats.capacity}</div>
                            <Badge 
                              variant={getOccupancyBadgeVariant(stats.occupancyPercentage)}
                              className="text-xs"
                            >
                              {stats.occupancyPercentage}%
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cls)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cls)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  );
}
