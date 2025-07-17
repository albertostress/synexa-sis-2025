
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, FileText, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const gradeSchema = z.object({
  studentId: z.string().min(1, 'Aluno é obrigatório'),
  subjectId: z.string().min(1, 'Disciplina é obrigatória'),
  classId: z.string().min(1, 'Turma é obrigatória'),
  gradeType: z.enum(['MAC', 'NPP', 'NPT', 'MT', 'FAL']),
  value: z.number().min(0).max(20, 'Nota deve estar entre 0 e 20'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  term: z.enum(['1', '2', '3']),
});

type GradeFormData = z.infer<typeof gradeSchema>;

interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  gradeType: 'MAC' | 'NPP' | 'NPT' | 'MT' | 'FAL';
  value: number;
  description?: string;
  date: string;
  term: '1' | '2' | '3';
}

const mockGrades: Grade[] = [
  {
    id: '1',
    studentId: 'ST001',
    studentName: 'Ana Silva',
    subjectId: 'SUB001',
    subjectName: 'Língua Portuguesa',
    classId: 'C001',
    className: '10ª Classe',
    gradeType: 'MAC',
    value: 16,
    description: 'Média das avaliações contínuas',
    date: '2024-01-15',
    term: '1',
  },
  {
    id: '2',
    studentId: 'ST002',
    studentName: 'João Santos',
    subjectId: 'SUB002',
    subjectName: 'Matemática',
    classId: 'C001',
    className: '10ª Classe',
    gradeType: 'NPP',
    value: 14,
    description: 'Nota da prova do professor',
    date: '2024-01-20',
    term: '1',
  },
];

// Disciplinas curriculares angolanas
const angolanSubjects = [
  { id: 'SUB001', name: 'Língua Portuguesa' },
  { id: 'SUB002', name: 'Matemática' },
  { id: 'SUB003', name: 'Educação Manual e Plástica' },
  { id: 'SUB004', name: 'Educação Musical' },
  { id: 'SUB005', name: 'Estudo do Meio' },
  { id: 'SUB006', name: 'Educação Física' },
  { id: 'SUB007', name: 'Língua de Origem Africana' },
  { id: 'SUB008', name: 'História' },
  { id: 'SUB009', name: 'Geografia' },
  { id: 'SUB010', name: 'Biologia' },
  { id: 'SUB011', name: 'Física' },
  { id: 'SUB012', name: 'Química' },
  { id: 'SUB013', name: 'Francês' },
  { id: 'SUB014', name: 'Inglês' },
];

const mockStudents = [
  { id: 'ST001', name: 'Ana Silva' },
  { id: 'ST002', name: 'João Santos' },
  { id: 'ST003', name: 'Maria Costa' },
];

const mockClasses = [
  { id: 'C001', name: '10ª Classe' },
  { id: 'C002', name: '11ª Classe' },
  { id: 'C003', name: '12ª Classe' },
  { id: 'C004', name: '13ª Classe' },
];

export default function Grades() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      studentId: '',
      subjectId: '',
      classId: '',
      gradeType: 'MAC',
      value: 0,
      description: '',
      date: '',
      term: '1',
    },
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => Promise.resolve(mockGrades),
  });

  const createMutation = useMutation({
    mutationFn: (data: GradeFormData) => {
      console.log('Creating grade:', data);
      return Promise.resolve({
        id: Date.now().toString(),
        ...data,
        studentName: mockStudents.find(s => s.id === data.studentId)?.name || '',
        subjectName: angolanSubjects.find(s => s.id === data.subjectId)?.name || '',
        className: mockClasses.find(c => c.id === data.classId)?.name || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast({ title: 'Nota registada com sucesso!' });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string } & GradeFormData) => {
      console.log('Updating grade:', data);
      return Promise.resolve(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast({ title: 'Nota actualizada com sucesso!' });
      setIsDialogOpen(false);
      setEditingGrade(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('Deleting grade:', id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast({ title: 'Nota removida com sucesso!' });
    },
  });

  const onSubmit = (data: GradeFormData) => {
    if (editingGrade) {
      updateMutation.mutate({ ...data, id: editingGrade.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade);
    form.reset({
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      classId: grade.classId,
      gradeType: grade.gradeType,
      value: grade.value,
      description: grade.description || '',
      date: grade.date,
      term: grade.term,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta nota?')) {
      deleteMutation.mutate(id);
    }
  };

  const getGradeTypeBadge = (type: string) => {
    const variants = {
      MAC: 'default',
      NPP: 'secondary',
      NPT: 'outline',
      MT: 'destructive',
      FAL: 'outline',
    };
    
    const labels = {
      MAC: 'MAC - Média das Avaliações Contínuas',
      NPP: 'NPP - Nota da Prova do Professor',
      NPT: 'NPT - Nota da Prova Trimestral',
      MT: 'MT - Média Trimestral',
      FAL: 'FAL - Faltas',
    };

    return (
      <Badge variant={variants[type as keyof typeof variants] as any}>
        {type}
      </Badge>
    );
  };

  const getGradeClassification = (value: number) => {
    if (value >= 17) return { label: 'Excelente', color: 'text-green-700' };
    if (value >= 14) return { label: 'Muito Bom', color: 'text-green-600' };
    if (value >= 12) return { label: 'Bom', color: 'text-blue-600' };
    if (value >= 10) return { label: 'Satisfatório', color: 'text-yellow-600' };
    return { label: 'Não Satisfatório', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Avaliação - MINED</h1>
          <p className="text-muted-foreground">Gestão de notas conforme regulamentação do Ministério da Educação</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingGrade(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGrade ? 'Editar Avaliação' : 'Nova Avaliação'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aluno</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar aluno" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockStudents.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name}
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
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disciplina</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar disciplina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {angolanSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
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
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classe</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar classe" />
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
                  name="gradeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Avaliação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MAC">MAC - Média das Avaliações Contínuas</SelectItem>
                          <SelectItem value="NPP">NPP - Nota da Prova do Professor</SelectItem>
                          <SelectItem value="NPT">NPT - Nota da Prova Trimestral</SelectItem>
                          <SelectItem value="MT">MT - Média Trimestral</SelectItem>
                          <SelectItem value="FAL">FAL - Faltas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota (0-20)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="20" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trimestre</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1º Trimestre</SelectItem>
                          <SelectItem value="2">2º Trimestre</SelectItem>
                          <SelectItem value="3">3º Trimestre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
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
                    {editingGrade ? 'Actualizar' : 'Registar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Legenda do Sistema de Avaliação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Sistema de Classificação - MINED Angola
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Tipos de Avaliação:</h4>
              <ul className="space-y-1">
                <li><strong>MAC</strong> - Média das Avaliações Contínuas</li>
                <li><strong>NPP</strong> - Nota da Prova do Professor</li>
                <li><strong>NPT</strong> - Nota da Prova Trimestral</li>
                <li><strong>MT</strong> - Média Trimestral</li>
                <li><strong>FAL</strong> - Faltas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Classificação Qualitativa:</h4>
              <ul className="space-y-1">
                <li><strong>17-20:</strong> Excelente</li>
                <li><strong>14-16:</strong> Muito Bom</li>
                <li><strong>12-13:</strong> Bom</li>
                <li><strong>10-11:</strong> Satisfatório</li>
                <li><strong>0-9:</strong> Não Satisfatório</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Observações:</h4>
              <p className="text-muted-foreground">
                Sistema de avaliação conforme o regulamento do Ministério da Educação de Angola.
                Escala de 0 a 20 valores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Registo de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead>Trimestre</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => {
                const classification = getGradeClassification(grade.value);
                return (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{grade.studentName}</TableCell>
                    <TableCell>{grade.subjectName}</TableCell>
                    <TableCell>{grade.className}</TableCell>
                    <TableCell>{getGradeTypeBadge(grade.gradeType)}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${classification.color}`}>
                        {grade.value} valores
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={classification.color}>
                        {classification.label}
                      </span>
                    </TableCell>
                    <TableCell>{grade.term}º Trimestre</TableCell>
                    <TableCell>{new Date(grade.date).toLocaleDateString('pt-AO')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(grade)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(grade.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
