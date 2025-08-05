import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, BookOpen, Users, Check, X, GraduationCap, Calendar, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { subjectsAPI, teachersAPI, classesAPI } from '@/lib/api';
import { SubjectWithTeachers, CreateSubjectDto, UpdateSubjectDto } from '@/types/subject';
import { Teacher } from '@/types/subject';
import { 
  ClassLevel, 
  CLASS_LEVEL_OPTIONS, 
  SCHOOL_CYCLE_LABELS, 
  getCycleFromClassLevel 
} from '@/types/pedagogical';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Subjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithTeachers | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [isTeacherPopoverOpen, setIsTeacherPopoverOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Função para alternar seleção de professores
  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId) 
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  // Carregar disciplinas do backend
  const { data: subjects = [], isLoading: loadingSubjects, refetch } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => {
      console.log('📖 Carregando disciplinas...');
      return subjectsAPI.getAll();
    },
    onSuccess: (data) => {
      console.log('📚 Disciplinas carregadas:', data?.length, 'disciplinas');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao carregar disciplinas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as disciplinas',
        variant: 'destructive'
      });
    }
  });

  // Carregar professores para o formulário
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersAPI.getAll(),
    enabled: isDialogOpen, // Só carrega quando o modal abre
    onError: (error: any) => {
      console.error('Erro ao carregar professores:', error);
    }
  });

  // Carregar anos letivos das turmas existentes
  const { data: availableYears = [] } = useQuery({
    queryKey: ['classes-years'],
    queryFn: async () => {
      const classes = await classesAPI.getAll();
      const years = [...new Set(classes.map(cls => cls.year))].sort((a, b) => b - a);
      return years.map(year => `${year}/${year + 1}`);
    },
    enabled: isDialogOpen,
    onError: (error: any) => {
      console.error('Erro ao carregar anos letivos:', error);
    }
  });

  // Mutation para criar disciplina
  const createMutation = useMutation({
    mutationFn: (data: CreateSubjectDto) => {
      console.log('🚀 Criando disciplina:', data);
      return subjectsAPI.create(data);
    },
    onSuccess: (result) => {
      console.log('✅ Disciplina criada com sucesso:', result);
      refetch(); // Atualiza a lista imediatamente
      setIsDialogOpen(false);
      setEditingSubject(null);
      setSelectedTeachers([]);
      toast({ 
        title: 'Sucesso!',
        description: 'Disciplina criada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar disciplina:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 'Erro ao criar disciplina';
      
      if (error.response?.status === 409) {
        toast({
          title: 'Conflito',
          description: 'Já existe uma disciplina com este nome',
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

  // Mutation para atualizar disciplina
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectDto }) => 
      subjectsAPI.update(id, data),
    onSuccess: () => {
      refetch(); // Atualiza a lista imediatamente
      setIsDialogOpen(false);
      setEditingSubject(null);
      setSelectedTeachers([]);
      toast({ 
        title: 'Sucesso!',
        description: 'Disciplina atualizada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar disciplina:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar disciplina';
      
      if (error.response?.status === 409) {
        toast({
          title: 'Conflito',
          description: 'Já existe uma disciplina com este nome',
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

  // Mutation para deletar disciplina
  const deleteMutation = useMutation({
    mutationFn: (id: string) => subjectsAPI.delete(id),
    onSuccess: () => {
      refetch(); // Atualiza a lista imediatamente
      toast({ 
        title: 'Sucesso!',
        description: 'Disciplina removida com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao remover disciplina:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao remover disciplina';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // Filtrar e ordenar disciplinas por busca avançada
  const filteredSubjects = subjects
    .filter(subject => {
      const searchLower = searchTerm.toLowerCase();
      
      // Busca no nome da disciplina
      const nameMatch = subject.name.toLowerCase().includes(searchLower);
      
      // Busca na descrição
      const descriptionMatch = subject.description && 
        subject.description.toLowerCase().includes(searchLower);
      
      // Busca no ano
      const yearMatch = subject.year.toLowerCase().includes(searchLower);
      
      // Busca nos nomes dos professores
      const teacherMatch = subject.teachers?.some(teacher => 
        teacher.user?.name?.toLowerCase().includes(searchLower)
      );
      
      return nameMatch || descriptionMatch || yearMatch || teacherMatch;
    })
    .sort((a, b) => {
      // Ordenar por ano primeiro, depois por nome
      if (a.year !== b.year) {
        return a.year.localeCompare(b.year);
      }
      return a.name.localeCompare(b.name);
    });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const subjectData = {
      name: (formData.get('name') as string)?.trim(),
      description: (formData.get('description') as string)?.trim() || undefined,
      classLevel: formData.get('classLevel') as ClassLevel,
      year: formData.get('year') as string,
      category: formData.get('category') as string,
      status: formData.get('status') as "ATIVO" | "INATIVO",
      teacherIds: selectedTeachers
    };

    // Validações para Angola
    if (!subjectData.name || subjectData.name.length < 3) {
      toast({
        title: 'Erro de Validação',
        description: 'Nome da disciplina deve ter pelo menos 3 caracteres',
        variant: 'destructive'
      });
      return;
    }

    if (!subjectData.classLevel) {
      toast({
        title: 'Erro de Validação',
        description: 'Classe é obrigatória',
        variant: 'destructive'
      });
      return;
    }

    if (!subjectData.year) {
      toast({
        title: 'Erro de Validação',
        description: 'Ano letivo é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!subjectData.category) {
      toast({
        title: 'Erro de Validação',
        description: 'Categoria da disciplina é obrigatória',
        variant: 'destructive'
      });
      return;
    }

    if (!subjectData.status) {
      toast({
        title: 'Erro de Validação',
        description: 'Status da disciplina é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (selectedTeachers.length === 0) {
      toast({
        title: 'Erro de Validação',
        description: 'Selecione pelo menos um professor para a disciplina',
        variant: 'destructive'
      });
      return;
    }

    if (subjectData.description && subjectData.description.length > 500) {
      toast({
        title: 'Erro de Validação',
        description: 'Descrição não pode exceder 500 caracteres',
        variant: 'destructive'
      });
      return;
    }

    // Converter para formato do backend
    const backendPayload: CreateSubjectDto = {
      name: subjectData.name,
      description: subjectData.description,
      classLevel: subjectData.classLevel,
      year: subjectData.year,
      // Mapear categorias angolanas para formato backend
      category: subjectData.category === 'Técnica' || subjectData.category === 'Artística' ? 'Opcional' : 'Obrigatória',
      isActive: subjectData.status === 'ATIVO',
      teacherIds: subjectData.teacherIds,
      // Campos removidos mas necessários para compatibilidade temporária
      code: `${subjectData.category.substring(0,3).toUpperCase()}${Date.now().toString().slice(-3)}`,
      credits: 1,
      workloadHours: 40
    };

    if (editingSubject) {
      updateMutation.mutate({ 
        id: editingSubject.id, 
        data: backendPayload 
      });
    } else {
      createMutation.mutate(backendPayload);
    }
  };


  const handleEdit = (subject: SubjectWithTeachers) => {
    setEditingSubject(subject);
    setSelectedTeachers(subject.teachers?.map(t => t.id) || []);
    setIsDialogOpen(true);
  };

  const handleDelete = (subject: SubjectWithTeachers) => {
    if (confirm(`Tem certeza que deseja remover a disciplina "${subject.name}"?`)) {
      deleteMutation.mutate(subject.id);
    }
  };

  const resetForm = () => {
    setEditingSubject(null);
    setSelectedTeachers([]);
    setIsTeacherPopoverOpen(false);
    setIsDialogOpen(false);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Disciplinas</h1>
            <p className="text-muted-foreground">Gerir disciplinas e associar professores</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Disciplina
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingSubject ? 'Editar Disciplina' : 'Nova Disciplina'}
                </DialogTitle>
                <DialogDescription id="dialog-description" className="text-muted-foreground">
                  {editingSubject 
                    ? 'Modifique as informações da disciplina conforme necessário.'
                    : 'Preencha os campos obrigatórios para criar uma nova disciplina no sistema educacional.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Disciplina *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingSubject?.name}
                      placeholder="Ex: Matemática, Língua Portuguesa, Biologia..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="classLevel">🎯 Classe *</Label>
                      <Select 
                        name="classLevel" 
                        defaultValue={editingSubject?.classLevel || ''}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a classe" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASS_LEVEL_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="year">Ano Letivo *</Label>
                      <Select name="year" defaultValue={editingSubject?.year}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.length > 0 ? (
                            availableYears.map(year => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="2024/2025">2024/2025</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Categoria *</Label>
                      <Select name="category" defaultValue={editingSubject?.category}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Geral">Geral</SelectItem>
                          <SelectItem value="Técnica">Técnica</SelectItem>
                          <SelectItem value="Cívica">Cívica</SelectItem>
                          <SelectItem value="Artística">Artística</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select name="status" defaultValue={editingSubject?.isActive ? 'ATIVO' : 'INATIVO'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  
                  <div>
                    <Label htmlFor="description">Descrição (Opcional)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingSubject?.description || ''}
                      placeholder="Breve descrição sobre os conteúdos e objetivos da disciplina..."
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Máximo 500 caracteres
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="teachers">Professores Associados *</Label>
                    <div className="mt-2">
                      <Popover open={isTeacherPopoverOpen} onOpenChange={setIsTeacherPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isTeacherPopoverOpen}
                            className="w-full justify-between"
                            disabled={loadingTeachers}
                          >
                            {loadingTeachers ? (
                              "Carregando professores..."
                            ) : selectedTeachers.length > 0 ? (
                              `${selectedTeachers.length} professor(es) selecionado(s)`
                            ) : (
                              "Selecionar professores..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar professor..." />
                            <CommandEmpty>Nenhum professor encontrado.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {teachers.map((teacher) => (
                                <CommandItem
                                  key={teacher.id}
                                  onSelect={() => {
                                    toggleTeacher(teacher.id);
                                  }}
                                  className="flex items-center space-x-2 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={selectedTeachers.includes(teacher.id)}
                                    className="mr-2"
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {teacher.user?.name || 'Nome não disponível'}
                                    </span>
                                    {teacher.user?.email && (
                                      <span className="text-sm text-muted-foreground">
                                        {teacher.user.email}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Exibir professores selecionados */}
                      {selectedTeachers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedTeachers.map((teacherId) => {
                            const teacher = teachers.find(t => t.id === teacherId);
                            return teacher ? (
                              <Badge key={teacherId} variant="secondary" className="text-xs">
                                {teacher.user?.name || 'Nome não disponível'}
                                <button
                                  type="button"
                                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                                  onClick={() => toggleTeacher(teacherId)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione pelo menos um professor que irá lecionar esta disciplina
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || selectedTeachers.length === 0}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processando...
                      </div>
                    ) : (
                      editingSubject ? 'Atualizar Disciplina' : 'Criar Disciplina'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Lista de Disciplinas
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {filteredSubjects.length} {filteredSubjects.length === 1 ? 'disciplina' : 'disciplinas'}
                  {searchTerm && subjects.length !== filteredSubjects.length && ` de ${subjects.length}`}
                </Badge>
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por disciplina, professor, ano..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-72"
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>🎯 Classe</TableHead>
                  <TableHead>📘 Ciclo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Professores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSubjects ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : filteredSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhuma disciplina encontrada para a busca' : 'Nenhuma disciplina cadastrada'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{subject.name}</div>
                            {subject.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {subject.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">
                            {subject.classLevel ? CLASS_LEVEL_OPTIONS.find(opt => opt.value === subject.classLevel)?.label || subject.classLevel : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Calendar className="w-3 h-3" />
                          {subject.classLevel ? SCHOOL_CYCLE_LABELS[getCycleFromClassLevel(subject.classLevel)] : 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {subject.year}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={subject.category === 'Obrigatória' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {subject.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {subject.teachers && subject.teachers.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {subject.teachers.slice(0, 3).map((teacher, index) => (
                                  <div
                                    key={teacher.id}
                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-background"
                                    title={teacher.user?.name || 'Professor'}
                                  >
                                    {teacher.user?.name?.charAt(0) || 'P'}
                                  </div>
                                ))}
                                {subject.teachers.length > 3 && (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                                    +{subject.teachers.length - 3}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {subject.teachers.length} professor{subject.teachers.length !== 1 ? 'es' : ''}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Sem professores</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={subject.isActive ? 'default' : 'secondary'}
                          className={`text-xs ${subject.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {subject.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(subject)}
                            title="Editar disciplina"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(subject)}
                            disabled={deleteMutation.isPending}
                            title="Remover disciplina"
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
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}