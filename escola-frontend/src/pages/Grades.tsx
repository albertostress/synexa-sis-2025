
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, FileText, GraduationCap, Search, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { gradesAPI, studentsAPI, subjectsAPI, classesAPI, teachersAPI } from '@/lib/api';
import { 
  GradeWithRelations, 
  CreateGradeDto, 
  UpdateGradeDto, 
  GradeType,
  formatStudentName,
  formatTeacherName,
  formatGradeDate,
  formatSchoolYear,
  getGradeClassification,
  getGradeBadgeVariant,
  calculateGradeStats,
  getGradeTypeName,
  formatTerm
} from '@/types/grade';
import { ErrorBoundary } from '@/components/ErrorBoundary';



export default function Grades() {
  // Grades component - fixed and working
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar notas do backend
  const { data: grades = [], isLoading: loadingGrades, refetch } = useQuery({
    queryKey: ['grades', selectedYear, selectedClassId, selectedSubjectId],
    queryFn: () => {
      console.log('📊 Carregando notas...');
      const filters = {
        ...(selectedYear && { year: selectedYear }),
        ...(selectedClassId && { classId: selectedClassId }),
        ...(selectedSubjectId && { subjectId: selectedSubjectId })
      };
      return gradesAPI.getAll(filters);
    },
    onSuccess: (data) => {
      console.log('✅ Notas carregadas:', data?.length, 'notas');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao carregar notas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notas',
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

  // Carregar disciplinas para seleção
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsAPI.getAll(),
    enabled: isDialogOpen,
    onError: (error: any) => {
      console.error('Erro ao carregar disciplinas:', error);
    }
  });

  // Carregar turmas para seleção
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll(),
    enabled: isDialogOpen,
    onError: (error: any) => {
      console.error('Erro ao carregar turmas:', error);
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

  // Mutation para criar nota
  const createMutation = useMutation({
    mutationFn: (data: CreateGradeDto) => {
      console.log('🚀 Criando nota:', data);
      return gradesAPI.create(data);
    },
    onSuccess: (result) => {
      console.log('✅ Nota criada com sucesso:', result);
      refetch();
      setIsDialogOpen(false);
      setEditingGrade(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Nota lançada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar nota:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao lançar nota';
      
      if (error.response?.status === 403) {
        toast({
          title: 'Erro de Permissão',
          description: 'Você não tem permissão para lançar notas desta disciplina',
          variant: 'destructive'
        });
      } else if (error.response?.status === 409) {
        toast({
          title: 'Conflito',
          description: 'Já existe uma nota lançada para este aluno nesta disciplina',
          variant: 'destructive'
        });
      } else if (error.response?.status === 400) {
        toast({
          title: 'Erro de Validação',
          description: 'Aluno não está matriculado nesta turma no ano especificado',
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

  // Mutation para atualizar nota
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradeDto }) => 
      gradesAPI.update(id, data),
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingGrade(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Nota atualizada com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar nota:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar nota';
      
      if (error.response?.status === 403) {
        toast({
          title: 'Erro de Permissão',
          description: 'Você só pode atualizar notas que você mesmo lançou',
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

  // Mutation para remover nota
  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradesAPI.delete(id),
    onSuccess: () => {
      refetch();
      toast({ 
        title: 'Sucesso!',
        description: 'Nota removida com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao remover nota:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao remover nota';
      
      if (error.response?.status === 403) {
        toast({
          title: 'Erro de Permissão',
          description: 'Você só pode remover notas que você mesmo lançou',
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

  // Filtrar notas
  const filteredGrades = grades.filter(grade => {
    const studentName = formatStudentName(grade.student);
    const subjectName = grade.subject.name;
    const className = grade.class.name;
    const teacherName = formatTeacherName(grade.teacher);
    
    return (
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calcular estatísticas
  const stats = calculateGradeStats(filteredGrades);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const gradeData: CreateGradeDto = {
      studentId: formData.get('studentId') as string,
      subjectId: formData.get('subjectId') as string,
      teacherId: formData.get('teacherId') as string,
      classId: formData.get('classId') as string,
      type: formData.get('type') as GradeType,
      term: parseInt(formData.get('term') as string) || 1,
      year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
      value: parseFloat(formData.get('value') as string) || 0,
    };

    // Validações básicas
    if (!gradeData.studentId) {
      toast({
        title: 'Erro',
        description: 'Aluno é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.subjectId) {
      toast({
        title: 'Erro',
        description: 'Disciplina é obrigatória',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.teacherId) {
      toast({
        title: 'Erro',
        description: 'Professor é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.classId) {
      toast({
        title: 'Erro',
        description: 'Turma é obrigatória',
        variant: 'destructive'
      });
      return;
    }

    if (gradeData.year < 2020) {
      toast({
        title: 'Erro',
        description: 'Ano deve ser 2020 ou posterior',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.type) {
      toast({
        title: 'Erro',
        description: 'Tipo de avaliação é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (!gradeData.term || gradeData.term < 1 || gradeData.term > 3) {
      toast({
        title: 'Erro',
        description: 'Trimestre deve ser 1, 2 ou 3',
        variant: 'destructive'
      });
      return;
    }

    if (gradeData.value < 0 || gradeData.value > 20) {
      toast({
        title: 'Erro',
        description: 'Nota deve estar entre 0 e 20',
        variant: 'destructive'
      });
      return;
    }

    if (editingGrade) {
      updateMutation.mutate({ 
        id: editingGrade.id, 
        data: gradeData 
      });
    } else {
      createMutation.mutate(gradeData);
    }
  };

  const handleEdit = (grade: GradeWithRelations) => {
    setEditingGrade(grade);
    setIsDialogOpen(true);
  };

  const handleDelete = (grade: GradeWithRelations) => {
    if (confirm(`Tem certeza que deseja remover a nota de "${formatStudentName(grade.student)}" na disciplina "${grade.subject.name}"?`)) {
      deleteMutation.mutate(grade.id);
    }
  };

  const resetForm = () => {
    setEditingGrade(null);
    setIsDialogOpen(false);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sistema de Notas</h1>
            <p className="text-muted-foreground">Gestão de notas e avaliações dos alunos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingGrade(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingGrade ? 'Editar Nota' : 'Nova Nota'}
                </DialogTitle>
                <DialogDescription>
                  {editingGrade 
                    ? 'Modifique as informações da nota conforme necessário.'
                    : 'Preencha os campos para lançar uma nova nota no sistema.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentId">Aluno</Label>
                    <Select name="studentId" defaultValue={editingGrade?.studentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingStudents ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : (
                          students.map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              {formatStudentName(student)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subjectId">Disciplina</Label>
                    <Select name="subjectId" defaultValue={editingGrade?.subjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingSubjects ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : (
                          subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="teacherId">Professor</Label>
                    <Select name="teacherId" defaultValue={editingGrade?.teacherId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um professor" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingTeachers ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : (
                          teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {formatTeacherName(teacher)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="classId">Turma</Label>
                    <Select name="classId" defaultValue={editingGrade?.classId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingClasses ? (
                          <div className="text-center p-2">Carregando...</div>
                        ) : (
                          classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} ({formatSchoolYear(cls.year)})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year">Ano Letivo</Label>
                    <Select name="year" defaultValue={editingGrade?.year?.toString() || new Date().getFullYear().toString()}>
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
                    <Label htmlFor="type">Tipo de Avaliação</Label>
                    <Select name="type" defaultValue={editingGrade?.type || GradeType.MAC}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GradeType.MAC}>
                          {getGradeTypeName(GradeType.MAC)}
                        </SelectItem>
                        <SelectItem value={GradeType.NPP}>
                          {getGradeTypeName(GradeType.NPP)}
                        </SelectItem>
                        <SelectItem value={GradeType.NPT}>
                          {getGradeTypeName(GradeType.NPT)}
                        </SelectItem>
                        <SelectItem value={GradeType.MT}>
                          {getGradeTypeName(GradeType.MT)}
                        </SelectItem>
                        <SelectItem value={GradeType.FAL}>
                          {getGradeTypeName(GradeType.FAL)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="term">Trimestre</Label>
                    <Select name="term" defaultValue={editingGrade?.term?.toString() || '1'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o trimestre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Trimestre</SelectItem>
                        <SelectItem value="2">2º Trimestre</SelectItem>
                        <SelectItem value="3">3º Trimestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Nota (0-20)</Label>
                    <Input
                      type="number"
                      name="value"
                      min="0"
                      max="20"
                      step="0.5"
                      defaultValue={editingGrade?.value || ''}
                      placeholder="Digite a nota"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {editingGrade ? 'Atualizar' : 'Lançar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGrades}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageGrade.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.passedStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedStudents}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Notas</span>
              <div className="flex items-center gap-2">
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 11}, (_, i) => 2020 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedClassId || 'ALL'} onValueChange={(value) => setSelectedClassId(value === 'ALL' ? '' : value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as Turmas</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSubjectId || 'ALL'} onValueChange={(value) => setSelectedSubjectId(value === 'ALL' ? '' : value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas as Disciplinas</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar notas..."
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
                  <TableHead>Aluno</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Trimestre</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Classificação</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingGrades ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : filteredGrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhuma nota encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGrades.map((grade) => {
                    const classification = getGradeClassification(grade.value);
                    return (
                      <TableRow key={grade.id}>
                        <TableCell>
                          <div className="font-medium">{formatStudentName(grade.student)}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{grade.subject.name}</span>
                        </TableCell>
                        <TableCell>
                          <span>{formatTeacherName(grade.teacher)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            <span>{grade.class.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {grade.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span>{formatTerm(grade.term)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getGradeBadgeVariant(grade.value)}>
                            {grade.value.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={classification.color}>
                            {classification.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{formatGradeDate(grade.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(grade)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(grade)}
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
