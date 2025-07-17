
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, UserPlus, Calendar, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const enrollmentSchema = z.object({
  studentName: z.string().min(1, 'Nome do aluno é obrigatório'),
  studentId: z.string().min(1, 'ID do aluno é obrigatório'),
  classId: z.string().min(1, 'Turma é obrigatória'),
  enrollmentDate: z.string().min(1, 'Data de matrícula é obrigatória'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED']),
  academicYear: z.string().min(1, 'Ano letivo é obrigatório'),
});

const reenrollmentSchema = z.object({
  classId: z.string().min(1, 'Turma é obrigatória'),
  enrollmentDate: z.string().min(1, 'Data de rematrícula é obrigatória'),
  academicYear: z.string().min(1, 'Ano letivo é obrigatório'),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;
type ReenrollmentFormData = z.infer<typeof reenrollmentSchema>;

interface Enrollment {
  id: string;
  studentName: string;
  studentId: string;
  classId: string;
  className: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'COMPLETED';
  academicYear: string;
}

const mockEnrollments: Enrollment[] = [
  {
    id: '1',
    studentName: 'Ana Silva',
    studentId: 'ST001',
    classId: 'C001',
    className: '10º A - Ciências',
    enrollmentDate: '2024-09-01',
    status: 'ACTIVE',
    academicYear: '2024/2025',
  },
  {
    id: '2',
    studentName: 'João Santos',
    studentId: 'ST002',
    classId: 'C002',
    className: '11º B - Humanidades',
    enrollmentDate: '2024-09-01',
    status: 'ACTIVE',
    academicYear: '2024/2025',
  },
];

const mockClasses = [
  { id: 'C001', name: '10º A - Ciências' },
  { id: 'C002', name: '11º B - Humanidades' },
  { id: 'C003', name: '12º C - Artes' },
];

export default function Enrollments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReenrollmentDialogOpen, setIsReenrollmentDialogOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [reenrollingStudent, setReenrollingStudent] = useState<Enrollment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      studentName: '',
      studentId: '',
      classId: '',
      enrollmentDate: '',
      status: 'PENDING',
      academicYear: '2024/2025',
    },
  });

  const reenrollmentForm = useForm<ReenrollmentFormData>({
    resolver: zodResolver(reenrollmentSchema),
    defaultValues: {
      classId: '',
      enrollmentDate: '',
      academicYear: '2025/2026',
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => Promise.resolve(mockEnrollments),
  });

  const createMutation = useMutation({
    mutationFn: (data: EnrollmentFormData) => {
      console.log('Creating enrollment:', data);
      return Promise.resolve({
        id: Date.now().toString(),
        ...data,
        className: mockClasses.find(c => c.id === data.classId)?.name || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast({ title: 'Matrícula criada com sucesso!' });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & EnrollmentFormData) => {
      console.log('Updating enrollment:', data);
      return Promise.resolve(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast({ title: 'Matrícula atualizada com sucesso!' });
      setIsDialogOpen(false);
      setEditingEnrollment(null);
      form.reset();
    },
  });

  const reenrollmentMutation = useMutation({
    mutationFn: (data: ReenrollmentFormData & { studentId: string; studentName: string }) => {
      console.log('Creating reenrollment:', data);
      return Promise.resolve({
        id: Date.now().toString(),
        ...data,
        status: 'PENDING' as const,
        className: mockClasses.find(c => c.id === data.classId)?.name || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast({ title: 'Rematrícula criada com sucesso!' });
      setIsReenrollmentDialogOpen(false);
      setReenrollingStudent(null);
      reenrollmentForm.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('Deleting enrollment:', id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast({ title: 'Matrícula removida com sucesso!' });
    },
  });

  const onSubmit = (data: EnrollmentFormData) => {
    if (editingEnrollment) {
      updateMutation.mutate({ ...data, id: editingEnrollment.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const onReenrollmentSubmit = (data: ReenrollmentFormData) => {
    if (reenrollingStudent) {
      reenrollmentMutation.mutate({
        ...data,
        studentId: reenrollingStudent.studentId,
        studentName: reenrollingStudent.studentName,
      });
    }
  };

  const handleEdit = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    form.reset({
      studentName: enrollment.studentName,
      studentId: enrollment.studentId,
      classId: enrollment.classId,
      enrollmentDate: enrollment.enrollmentDate,
      status: enrollment.status,
      academicYear: enrollment.academicYear,
    });
    setIsDialogOpen(true);
  };

  const handleReenrollment = (enrollment: Enrollment) => {
    setReenrollingStudent(enrollment);
    reenrollmentForm.reset({
      classId: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      academicYear: '2025/2026',
    });
    setIsReenrollmentDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta matrícula?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      PENDING: 'outline',
      COMPLETED: 'destructive',
    };
    
    const labels = {
      ACTIVE: 'Ativo',
      INACTIVE: 'Inativo',
      PENDING: 'Pendente',
      COMPLETED: 'Concluído',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Matrículas</h1>
          <p className="text-muted-foreground">Gerir matrículas de alunos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEnrollment(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Matrícula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEnrollment ? 'Editar Matrícula' : 'Nova Matrícula'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Aluno</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID do Aluno</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turma</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar turma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockClasses.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="enrollmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Matrícula</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="ACTIVE">Ativo</SelectItem>
                          <SelectItem value="INACTIVE">Inativo</SelectItem>
                          <SelectItem value="COMPLETED">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Letivo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingEnrollment ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Rematrícula */}
        <Dialog open={isReenrollmentDialogOpen} onOpenChange={setIsReenrollmentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Rematrícula - {reenrollingStudent?.studentName}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...reenrollmentForm}>
              <form onSubmit={reenrollmentForm.handleSubmit(onReenrollmentSubmit)} className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Aluno</p>
                  <p className="font-medium">{reenrollingStudent?.studentName}</p>
                  <p className="text-sm text-muted-foreground">ID: {reenrollingStudent?.studentId}</p>
                </div>
                
                <FormField
                  control={reenrollmentForm.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Turma</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar turma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockClasses.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={reenrollmentForm.control}
                  name="enrollmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Rematrícula</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={reenrollmentForm.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano Letivo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsReenrollmentDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Confirmar Rematrícula
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Lista de Matrículas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>ID Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Data Matrícula</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ano Letivo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">{enrollment.studentName}</TableCell>
                  <TableCell>{enrollment.studentId}</TableCell>
                  <TableCell>{enrollment.className}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(enrollment.enrollmentDate).toLocaleDateString('pt-PT')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                  <TableCell>{enrollment.academicYear}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(enrollment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReenrollment(enrollment)}
                        title="Rematrícula"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(enrollment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
