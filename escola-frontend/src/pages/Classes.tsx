
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, GraduationCap, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Class {
  id: string;
  name: string;
  code: string;
  grade: string;
  year: string;
  teacher: string;
  students: number;
  maxStudents: number;
  schedule: string;
  room: string;
  active: boolean;
}

const mockClasses: Class[] = [
  {
    id: '1',
    name: 'Turma A',
    code: '12A',
    grade: '12º Ano',
    year: '2024/2025',
    teacher: 'Prof. Maria Santos',
    students: 25,
    maxStudents: 30,
    schedule: 'Segunda a Sexta, 8:00-17:00',
    room: 'Sala 101',
    active: true
  },
  {
    id: '2',
    name: 'Turma B',
    code: '11B',
    grade: '11º Ano',
    year: '2024/2025',
    teacher: 'Prof. João Silva',
    students: 28,
    maxStudents: 30,
    schedule: 'Segunda a Sexta, 8:00-17:00',
    room: 'Sala 102',
    active: true
  }
];

export default function Classes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes = mockClasses, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockClasses;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newClass: Omit<Class, 'id'>) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...newClass, id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsDialogOpen(false);
      setEditingClass(null);
      toast({ title: 'Turma criada com sucesso!' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedClass: Class) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return updatedClass;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsDialogOpen(false);
      setEditingClass(null);
      toast({ title: 'Turma atualizada com sucesso!' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({ title: 'Turma removida com sucesso!' });
    }
  });

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const classData = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      grade: formData.get('grade') as string,
      year: formData.get('year') as string,
      teacher: formData.get('teacher') as string,
      students: parseInt(formData.get('students') as string) || 0,
      maxStudents: parseInt(formData.get('maxStudents') as string),
      schedule: formData.get('schedule') as string,
      room: formData.get('room') as string,
      active: formData.get('active') === 'true'
    };

    if (editingClass) {
      updateMutation.mutate({ ...editingClass, ...classData });
    } else {
      createMutation.mutate(classData);
    }
  };

  return (
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
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Turma</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingClass?.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    name="code"
                    defaultValue={editingClass?.code}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Ano Letivo</Label>
                  <Select name="grade" defaultValue={editingClass?.grade || '10º Ano'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10º Ano">10º Ano</SelectItem>
                      <SelectItem value="11º Ano">11º Ano</SelectItem>
                      <SelectItem value="12º Ano">12º Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Ano Escolar</Label>
                  <Select name="year" defaultValue={editingClass?.year || '2024/2025'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024/2025">2024/2025</SelectItem>
                      <SelectItem value="2025/2026">2025/2026</SelectItem>
                      <SelectItem value="2026/2027">2026/2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="teacher">Professor Responsável</Label>
                  <Input
                    id="teacher"
                    name="teacher"
                    defaultValue={editingClass?.teacher}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="room">Sala</Label>
                  <Input
                    id="room"
                    name="room"
                    defaultValue={editingClass?.room}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="students">Alunos Atuais</Label>
                  <Input
                    id="students"
                    name="students"
                    type="number"
                    defaultValue={editingClass?.students || 0}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="maxStudents">Máximo de Alunos</Label>
                  <Input
                    id="maxStudents"
                    name="maxStudents"
                    type="number"
                    defaultValue={editingClass?.maxStudents}
                    required
                    min="1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="schedule">Horário</Label>
                <Input
                  id="schedule"
                  name="schedule"
                  defaultValue={editingClass?.schedule}
                  placeholder="Ex: Segunda a Sexta, 8:00-17:00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="active">Status</Label>
                <Select name="active" defaultValue={editingClass?.active ? 'true' : 'false'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativa</SelectItem>
                    <SelectItem value="false">Inativa</SelectItem>
                  </SelectContent>
                </Select>
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
                <TableHead>Ano</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Sala</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma turma encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{cls.name}</div>
                          <div className="text-sm text-muted-foreground">{cls.code}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cls.grade}</div>
                        <div className="text-sm text-muted-foreground">{cls.year}</div>
                      </div>
                    </TableCell>
                    <TableCell>{cls.teacher}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className={cls.students >= cls.maxStudents ? 'text-destructive font-medium' : ''}>
                          {cls.students}/{cls.maxStudents}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{cls.room}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-sm">{cls.schedule}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cls.active ? 'default' : 'secondary'}>
                        {cls.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingClass(cls);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(cls.id)}
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
    </div>
  );
}
