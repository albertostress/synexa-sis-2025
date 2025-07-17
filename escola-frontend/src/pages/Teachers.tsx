import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, UserCheck, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ScheduleManagement } from '@/components/teachers/ScheduleManagement';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  status: 'ACTIVE' | 'INACTIVE';
  hireDate: string;
  subjects: string[];
}

const mockTeachers: Teacher[] = [
  {
    id: '1',
    name: 'Prof. Maria Santos',
    email: 'maria.santos@school.com',
    phone: '+351 912 345 678',
    specialization: 'Matemática',
    status: 'ACTIVE',
    hireDate: '2020-09-01',
    subjects: ['Matemática A', 'Matemática B']
  },
  {
    id: '2',
    name: 'Prof. João Silva',
    email: 'joao.silva@school.com',
    phone: '+351 912 345 679',
    specialization: 'História',
    status: 'ACTIVE',
    hireDate: '2019-09-01',
    subjects: ['História', 'Geografia']
  }
];

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teachers = mockTeachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockTeachers;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newTeacher: Omit<Teacher, 'id'>) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...newTeacher, id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      toast({ title: 'Professor criado com sucesso!' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedTeacher: Teacher) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return updatedTeacher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      toast({ title: 'Professor atualizado com sucesso!' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: 'Professor removido com sucesso!' });
    }
  });

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const teacherData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      specialization: formData.get('specialization') as string,
      status: formData.get('status') as 'ACTIVE' | 'INACTIVE',
      hireDate: formData.get('hireDate') as string,
      subjects: []
    };

    if (editingTeacher) {
      updateMutation.mutate({ ...editingTeacher, ...teacherData });
    } else {
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
            <Button onClick={() => setEditingTeacher(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Professor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? 'Editar Professor' : 'Novo Professor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingTeacher?.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingTeacher?.email}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={editingTeacher?.phone}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Especialização</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    defaultValue={editingTeacher?.specialization}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hireDate">Data de Contratação</Label>
                  <Input
                    id="hireDate"
                    name="hireDate"
                    type="date"
                    defaultValue={editingTeacher?.hireDate}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingTeacher?.status || 'ACTIVE'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="INACTIVE">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingTeacher ? 'Atualizar' : 'Criar'}
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
                    <TableHead>Contacto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Contratação</TableHead>
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
                              <div className="font-medium">{teacher.name}</div>
                              <div className="text-sm text-muted-foreground">{teacher.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{teacher.specialization}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {teacher.phone}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              {teacher.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={teacher.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {teacher.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(teacher.hireDate).toLocaleDateString('pt-PT')}
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
                              onClick={() => deleteMutation.mutate(teacher.id)}
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
                teacherName={selectedTeacher.name}
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
