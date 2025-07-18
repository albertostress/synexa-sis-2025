import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, BookOpen, Users, Check, X } from 'lucide-react';
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
import { MultiSelectSimple, Option } from '@/components/ui/multi-select-simple';
import { useToast } from '@/hooks/use-toast';
import { subjectsAPI, teachersAPI } from '@/lib/api';
import { SubjectWithTeachers, CreateSubjectDto, UpdateSubjectDto } from '@/types/subject';
import { Teacher } from '@/types/subject';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Subjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithTeachers | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Filtrar e ordenar disciplinas por busca
  const filteredSubjects = subjects
    .filter(subject =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
    
    const subjectData: CreateSubjectDto = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      code: formData.get('code') as string,
      year: formData.get('year') as string,
      category: formData.get('category') as "Obrigatória" | "Opcional",
      credits: parseInt(formData.get('credits') as string) || 0,
      workloadHours: parseInt(formData.get('workloadHours') as string) || 0,
      isActive: formData.get('isActive') === 'true',
      teacherIds: selectedTeachers.length > 0 ? selectedTeachers : undefined
    };

    // Validações básicas
    if (!subjectData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da disciplina é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!subjectData.code.trim()) {
      toast({
        title: 'Erro',
        description: 'Código da disciplina é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (subjectData.credits <= 0) {
      toast({
        title: 'Erro',
        description: 'Número de créditos deve ser maior que zero',
        variant: 'destructive'
      });
      return;
    }

    if (subjectData.workloadHours <= 0) {
      toast({
        title: 'Erro',
        description: 'Carga horária deve ser maior que zero',
        variant: 'destructive'
      });
      return;
    }

    if (editingSubject) {
      updateMutation.mutate({ 
        id: editingSubject.id, 
        data: subjectData 
      });
    } else {
      createMutation.mutate(subjectData);
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
            <DialogContent className="max-w-2xl" aria-describedby="dialog-description">
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Editar Disciplina' : 'Nova Disciplina'}
                </DialogTitle>
                <DialogDescription id="dialog-description">
                  {editingSubject 
                    ? 'Modifique as informações da disciplina conforme necessário.'
                    : 'Preencha os campos para criar uma nova disciplina no sistema.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome da Disciplina *</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingSubject?.name}
                        placeholder="Ex: Matemática, História, Física..."
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="code">Código *</Label>
                      <Input
                        id="code"
                        name="code"
                        defaultValue={editingSubject?.code}
                        placeholder="Ex: MAT101, HIS201..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="year">Ano *</Label>
                      <Select name="year" defaultValue={editingSubject?.year}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1º Ano">1º Ano</SelectItem>
                          <SelectItem value="2º Ano">2º Ano</SelectItem>
                          <SelectItem value="3º Ano">3º Ano</SelectItem>
                          <SelectItem value="4º Ano">4º Ano</SelectItem>
                          <SelectItem value="5º Ano">5º Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category">Categoria *</Label>
                      <Select name="category" defaultValue={editingSubject?.category}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Obrigatória">Obrigatória</SelectItem>
                          <SelectItem value="Opcional">Opcional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="isActive">Status *</Label>
                      <Select name="isActive" defaultValue={editingSubject?.isActive ? 'true' : 'false'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Ativa</SelectItem>
                          <SelectItem value="false">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="credits">Créditos *</Label>
                      <Input
                        id="credits"
                        name="credits"
                        type="number"
                        min="1"
                        max="10"
                        defaultValue={editingSubject?.credits}
                        placeholder="Ex: 3"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="workloadHours">Carga Horária (horas) *</Label>
                      <Input
                        id="workloadHours"
                        name="workloadHours"
                        type="number"
                        min="1"
                        max="500"
                        defaultValue={editingSubject?.workloadHours}
                        placeholder="Ex: 60"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingSubject?.description || ''}
                      placeholder="Descrição da disciplina (opcional)"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="teachers">Professores Associados</Label>
                    <div className="mt-2">
                      <MultiSelectSimple
                        options={teachers.map(teacher => ({
                          value: teacher.id,
                          label: `${teacher.user?.name || 'Nome não disponível'}${teacher.user?.email ? ` (${teacher.user.email})` : ''}`,
                        }))}
                        selected={selectedTeachers}
                        onChange={setSelectedTeachers}
                        placeholder={loadingTeachers ? "Carregando professores..." : "Selecione os professores..."}
                        disabled={loadingTeachers}
                        className="w-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione os professores que irão lecionar esta disciplina
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Processando...' : editingSubject ? 'Atualizar' : 'Criar'}
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
                {subjects.length > 0 && (
                  <Badge variant="secondary">{subjects.length} disciplina{subjects.length !== 1 ? 's' : ''}</Badge>
                )}
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar disciplinas..."
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
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Professores</TableHead>
                  <TableHead>Créditos</TableHead>
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
                            <div className="text-xs text-muted-foreground">
                              {subject.workloadHours}h de carga horária
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm font-medium">
                          {subject.code}
                        </div>
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
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {subject.teachers?.length || 0} professor{(subject.teachers?.length || 0) !== 1 ? 'es' : ''}
                          </span>
                          {subject.teachers && subject.teachers.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {subject.teachers.slice(0, 2).map((teacher) => (
                                <Badge key={teacher.id} variant="outline" className="text-xs">
                                  {teacher.user?.name?.split(' ')[0] || 'N/A'}
                                </Badge>
                              ))}
                              {subject.teachers.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{subject.teachers.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {subject.credits} crédito{subject.credits !== 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={subject.isActive ? 'default' : 'secondary'}
                          className={`text-xs ${subject.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
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