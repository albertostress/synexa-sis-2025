import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, UserCheck, Phone, Mail, Clock, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScheduleManagement } from '@/components/teachers/ScheduleManagement';
import { api } from '@/lib/api';
import { Teacher, User, CreateTeacherDto } from '@/types/teacher';

// Interfaces moved to /types/teacher.ts

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar professores do backend
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data;
    }
  });

  // Buscar usuários com role PROFESSOR quando o modal abrir
  useEffect(() => {
    if (isDialogOpen && !editingTeacher) {
      api.get('/users')
        .then(res => {
          // Filtrar apenas usuários com role PROFESSOR e IDs válidos
          const professorUsers = res.data.filter((user: User) => 
            user.role === 'PROFESSOR' && user.id && user.id.trim() !== ''
          );
          setUsers(professorUsers);
        })
        .catch((error) => {
          console.error('Erro ao carregar usuários:', error);
          toast({
            title: 'Erro',
            description: 'Erro ao carregar usuários',
            variant: 'destructive'
          });
        });
    }
  }, [isDialogOpen, editingTeacher, toast]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateTeacherDto) => {
      const response = await api.post('/teachers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      setSelectedUserId('');
      toast({ 
        title: 'Sucesso!',
        description: 'Professor criado com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao criar professor:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar professor';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & Partial<CreateTeacherDto>) => {
      const { id, ...updateData } = data;
      const response = await api.put(`/teachers/${id}`, updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Professor atualizado com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar professor:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar professor';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teachers/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ 
        title: 'Sucesso!',
        description: 'Professor removido com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao remover professor:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao remover professor';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  const filteredTeachers = teachers.filter(teacher =>
    teacher.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (teacher.specialization && teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingTeacher) {
      // Atualizar professor existente
      const updateData = {
        id: editingTeacher.id,
        bio: formData.get('bio') as string,
        qualification: formData.get('qualification') as string,
        specialization: formData.get('specialization') as string,
        experience: parseInt(formData.get('experience') as string) || 0,
      };
      updateMutation.mutate(updateData);
    } else {
      // Criar novo professor
      if (!selectedUserId) {
        toast({
          title: 'Erro!',
          description: 'Selecione um usuário para vincular ao professor',
          variant: 'destructive'
        });
        return;
      }
      
      const teacherData: CreateTeacherDto = {
        userId: selectedUserId,
        bio: formData.get('bio') as string,
        qualification: formData.get('qualification') as string,
        specialization: formData.get('specialization') as string,
        experience: parseInt(formData.get('experience') as string) || 0,
      };
      createMutation.mutate(teacherData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Professores</h1>
          <p className="text-muted-foreground">Gerir corpo docente da escola</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTeacher(null);
              setSelectedUserId('');
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                {editingTeacher ? 'Editar Professor' : 'Novo Professor'}
              </DialogTitle>
              <DialogDescription>
                {editingTeacher 
                  ? 'Modifique as informações do professor conforme necessário.'
                  : 'Selecione um usuário e preencha as informações do professor.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção de usuário (apenas para criação) */}
              {!editingTeacher && (
                <div className="space-y-2">
                  <Label htmlFor="userId">Selecionar Usuário</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolher usuário professor" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.length === 0 ? (
                        <SelectItem value="empty" disabled>Nenhum usuário professor encontrado</SelectItem>
                      ) : (
                        users
                          .filter(user => user.id && user.id.trim() !== '')
                          .map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} — {user.email}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  {users.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum usuário com role PROFESSOR encontrado
                    </p>
                  )}
                </div>
              )}

              {/* Informações do professor atual (apenas para edição) */}
              {editingTeacher && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{editingTeacher.user.name}</p>
                      <p className="text-sm text-muted-foreground">{editingTeacher.user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialization">Especialização</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    defaultValue={editingTeacher?.specialization || ''}
                    placeholder="Ex: Matemática, História, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="qualification">Qualificação</Label>
                  <Input
                    id="qualification"
                    name="qualification"
                    defaultValue={editingTeacher?.qualification || ''}
                    placeholder="Ex: Licenciatura em Matemática"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="experience">Anos de Experiência</Label>
                <Input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  max="50"
                  defaultValue={editingTeacher?.experience || ''}
                  placeholder="Ex: 5"
                />
              </div>

              <div>
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={editingTeacher?.bio || ''}
                  placeholder="Descreva a experiência e especialidades do professor..."
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Processando...' : editingTeacher ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teachers">Lista de Professores</TabsTrigger>
          <TabsTrigger value="schedules">Gestão de Horários</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lista de Professores</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar professores..."
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
                    <TableHead>Professor</TableHead>
                    <TableHead>Especialização</TableHead>
                    <TableHead>Informações</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : filteredTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum professor encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{teacher.user.name}</div>
                              <div className="text-sm text-muted-foreground">{teacher.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{teacher.specialization || 'Não informado'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              {teacher.user.email}
                            </div>
                            {teacher.experience && (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="w-3 h-3" />
                                {teacher.experience} anos
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Ativo</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(teacher.createdAt).toLocaleDateString('pt-PT')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                              }}
                              title="Ver horários"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTeacher(teacher);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja remover este professor?')) {
                                  deleteMutation.mutate(teacher.id);
                                }
                              }}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          {selectedTeacher ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTeacher(null)}
                >
                  ← Voltar para todos os horários
                </Button>
              </div>
              <ScheduleManagement 
                teacherId={selectedTeacher.id}
                teacherName={selectedTeacher.user.name}
              />
            </div>
          ) : (
            <ScheduleManagement />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
