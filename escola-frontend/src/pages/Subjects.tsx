
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, BookOpen, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
  workload: number;
  category: 'CORE' | 'ELECTIVE' | 'OPTIONAL';
  grade: string;
  active: boolean;
}

const mockSubjects: Subject[] = [
  {
    id: '1',
    name: 'Matemática A',
    code: 'MAT001',
    description: 'Matemática aplicada para ensino secundário',
    credits: 6,
    workload: 120,
    category: 'CORE',
    grade: '12º Ano',
    active: true
  },
  {
    id: '2',
    name: 'História',
    code: 'HIS001',
    description: 'História contemporânea e moderna',
    credits: 4,
    workload: 80,
    category: 'CORE',
    grade: '11º Ano',
    active: true
  }
];

export default function Subjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects = mockSubjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockSubjects;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newSubject: Omit<Subject, 'id'>) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...newSubject, id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsDialogOpen(false);
      setEditingSubject(null);
      toast({ title: 'Disciplina criada com sucesso!' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedSubject: Subject) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return updatedSubject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsDialogOpen(false);
      setEditingSubject(null);
      toast({ title: 'Disciplina atualizada com sucesso!' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: 'Disciplina removida com sucesso!' });
    }
  });

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subjectData = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string,
      credits: parseInt(formData.get('credits') as string),
      workload: parseInt(formData.get('workload') as string),
      category: formData.get('category') as 'CORE' | 'ELECTIVE' | 'OPTIONAL',
      grade: formData.get('grade') as string,
      active: formData.get('active') === 'true'
    };

    if (editingSubject) {
      updateMutation.mutate({ ...editingSubject, ...subjectData });
    } else {
      createMutation.mutate(subjectData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Disciplinas</h1>
          <p className="text-muted-foreground">Gerir currículo e disciplinas da escola</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSubject(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Disciplina
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? 'Editar Disciplina' : 'Nova Disciplina'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Disciplina</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingSubject?.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    name="code"
                    defaultValue={editingSubject?.code}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="credits">Créditos</Label>
                  <Input
                    id="credits"
                    name="credits"
                    type="number"
                    defaultValue={editingSubject?.credits}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="workload">Carga Horária (horas)</Label>
                  <Input
                    id="workload"
                    name="workload"
                    type="number"
                    defaultValue={editingSubject?.workload}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select name="category" defaultValue={editingSubject?.category || 'CORE'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORE">Obrigatória</SelectItem>
                      <SelectItem value="ELECTIVE">Eletiva</SelectItem>
                      <SelectItem value="OPTIONAL">Opcional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="grade">Ano Letivo</Label>
                  <Select name="grade" defaultValue={editingSubject?.grade || '10º Ano'}>
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
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingSubject?.description}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="active">Status</Label>
                <Select name="active" defaultValue={editingSubject?.active ? 'true' : 'false'}>
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
                  {editingSubject ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Disciplinas</span>
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
                <TableHead>Créditos</TableHead>
                <TableHead>Carga Horária</TableHead>
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
              ) : filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma disciplina encontrada
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
                          <div className="text-sm text-muted-foreground">{subject.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{subject.code}</code>
                    </TableCell>
                    <TableCell>{subject.grade}</TableCell>
                    <TableCell>
                      <Badge variant={
                        subject.category === 'CORE' ? 'default' :
                        subject.category === 'ELECTIVE' ? 'secondary' : 'outline'
                      }>
                        {subject.category === 'CORE' ? 'Obrigatória' :
                         subject.category === 'ELECTIVE' ? 'Eletiva' : 'Opcional'}
                      </Badge>
                    </TableCell>
                    <TableCell>{subject.credits}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {subject.workload}h
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.active ? 'default' : 'secondary'}>
                        {subject.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSubject(subject);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(subject.id)}
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
