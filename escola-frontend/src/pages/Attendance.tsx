import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CalendarIcon, 
  UserCheck, 
  UserX, 
  Users, 
  Clock,
  Save,
  Eye,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Filter
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  attendanceAPI, 
  classesAPI, 
  subjectsAPI, 
  studentsAPI 
} from '@/lib/api';
import {
  AttendanceStatus,
  AttendanceStatusLabels,
  AttendanceStatusColors,
  SchoolShifts,
  ClassAttendanceReport,
  StudentAttendanceSummary,
  MarkAttendanceDto
} from '@/types/attendance';

export default function AttendanceAngolan() {
  const { user, hasRole } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<{[key: string]: {
    present: boolean;
    justified: boolean;
    note: string;
  }}>({});
  const [viewMode, setViewMode] = useState<'register' | 'report' | 'individual'>('register');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar turmas
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: classesAPI.getAll,
  });

  // Buscar disciplinas
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: subjectsAPI.getAll,
  });

  // Buscar alunos
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: studentsAPI.getAll,
  });

  // Buscar presenças da turma para a data selecionada
  const { data: classAttendance, isLoading: loadingClassAttendance } = useQuery({
    queryKey: ['class-attendance', selectedClass, attendanceAPI.formatDateForBackend(selectedDate), selectedSubject],
    queryFn: () => attendanceAPI.getClassAttendance(
      selectedClass, 
      attendanceAPI.formatDateForBackend(selectedDate),
      selectedSubject || undefined
    ),
    enabled: !!selectedClass && !!selectedSubject,
  });

  // Buscar resumo individual do aluno
  const { data: studentSummary } = useQuery({
    queryKey: ['student-attendance', selectedStudent],
    queryFn: () => attendanceAPI.getStudentAttendance(selectedStudent, {
      startDate: attendanceAPI.formatDateForBackend(startOfMonth(selectedDate)),
      endDate: attendanceAPI.formatDateForBackend(endOfMonth(selectedDate))
    }),
    enabled: !!selectedStudent && viewMode === 'individual',
  });

  // Mutation para salvar presenças
  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: MarkAttendanceDto) => {
      return attendanceAPI.markAttendance(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['class-attendance'] });
      toast({
        title: 'Presenças Registradas!',
        description: `${response.created} registros criados, ${response.updated} atualizados.`,
      });
      setAttendanceData({});
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Registrar Presenças',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Atualizar attendanceData quando classAttendance mudar
  useEffect(() => {
    if (classAttendance?.attendances) {
      const initialData: {[key: string]: {present: boolean, justified: boolean, note: string}} = {};
      
      classAttendance.attendances.forEach((attendance: any) => {
        initialData[attendance.studentId] = {
          present: attendance.present,
          justified: attendance.justified,
          note: attendance.note || '',
        };
      });
      
      setAttendanceData(initialData);
    }
  }, [classAttendance]);

  const handleAttendanceChange = (studentId: string, field: 'present' | 'justified', value: boolean) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
        // Se marcar como presente, desmarcar justificado automaticamente
        ...(field === 'present' && value ? { justified: false } : {}),
      }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      }
    }));
  };

  const saveAttendance = () => {
    if (!selectedClass || !selectedSubject) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Selecione uma turma e disciplina.',
        variant: 'destructive',
      });
      return;
    }

    // Filtrar apenas alunos da turma selecionada
    const classStudents = students.filter(student => {
      // Assumindo que existe relação de matrícula - aqui pegamos todos por simplicidade
      return true;
    });

    const attendances = classStudents.map(student => ({
      studentId: student.id,
      present: attendanceData[student.id]?.present ?? false,
      justified: attendanceData[student.id]?.justified ?? false,
      note: attendanceData[student.id]?.note || undefined,
    }));

    const markAttendanceData: MarkAttendanceDto = {
      date: attendanceAPI.formatDateForBackend(selectedDate),
      classId: selectedClass,
      subjectId: selectedSubject,
      attendances,
    };

    saveAttendanceMutation.mutate(markAttendanceData);
  };

  const getAttendanceStats = () => {
    const classStudents = students.filter(student => true); // Simplificado
    const present = classStudents.filter(s => attendanceData[s.id]?.present === true).length;
    const absent = classStudents.filter(s => attendanceData[s.id]?.present === false).length;
    const justified = classStudents.filter(s => attendanceData[s.id]?.justified === true).length;
    
    return { 
      total: classStudents.length, 
      present, 
      absent, 
      justified,
      attendanceRate: classStudents.length > 0 ? Math.round((present / classStudents.length) * 100) : 0
    };
  };

  const getStatusBadge = (present: boolean, justified: boolean) => {
    let status: AttendanceStatus;
    if (present) {
      status = 'PRESENTE';
    } else if (justified) {
      status = 'JUSTIFICADO';
    } else {
      status = 'AUSENTE';
    }

    return (
      <Badge className={AttendanceStatusColors[status]}>
        {AttendanceStatusLabels[status]}
      </Badge>
    );
  };

  const getAttendanceIcon = (attendancePercentage: number) => {
    if (attendancePercentage >= 90) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (attendancePercentage >= 75) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const stats = getAttendanceStats();
  const selectedClassData = classes.find(c => c.id === selectedClass);
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  // Filtrar alunos da turma selecionada (simplificado)
  const classStudents = students.filter(student => true);

  const canRegister = hasRole('PROFESSOR') || hasRole('SECRETARIA') || hasRole('ADMIN');
  const canViewReports = hasRole('ADMIN') || hasRole('SECRETARIA') || hasRole('DIRETOR') || hasRole('PROFESSOR');

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Presenças</h1>
          <p className="text-muted-foreground">
            Sistema de frequência escolar adaptado para Angola
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Modo de visualização" />
            </SelectTrigger>
            <SelectContent>
              {canRegister && (
                <SelectItem value="register">
                  <div className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Registrar Presenças</span>
                  </div>
                </SelectItem>
              )}
              {canViewReports && (
                <>
                  <SelectItem value="report">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Relatório da Turma</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="individual">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>Consulta Individual</span>
                    </div>
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estatísticas */}
      {viewMode === 'register' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presentes</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausentes</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Justificados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.justified}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Frequência</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.attendanceRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Turma */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Turma</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {SchoolShifts[cls.shift as keyof typeof SchoolShifts]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Disciplina */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Disciplina</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: pt }) : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={pt}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Aluno (apenas no modo individual) */}
            {viewMode === 'individual' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Aluno</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} - {student.studentNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Botão Salvar (apenas no modo registrar) */}
          {viewMode === 'register' && canRegister && (
            <div className="flex justify-end mt-4">
              <Button 
                onClick={saveAttendance} 
                disabled={saveAttendanceMutation.isPending || !selectedClass || !selectedSubject}
                className="bg-green-600 hover:bg-green-700"
              >
                {saveAttendanceMutation.isPending ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Presenças
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Presenças (Modo Registrar) */}
      {viewMode === 'register' && canRegister && selectedClass && selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Chamada - {format(selectedDate, "dd/MM/yyyy", { locale: pt })}</span>
              {selectedClassData && selectedSubjectData && (
                <div className="text-sm text-muted-foreground">
                  {selectedClassData.name} - {selectedSubjectData.name}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingClassAttendance ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Nome do Aluno</TableHead>
                    <TableHead className="text-center">Presente</TableHead>
                    <TableHead className="text-center">Ausente</TableHead>
                    <TableHead className="text-center">Justificado</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student) => {
                    const attendance = attendanceData[student.id] || { present: false, justified: false, note: '' };
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.studentNumber}</TableCell>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={attendance.present}
                            onCheckedChange={(checked) => 
                              handleAttendanceChange(student.id, 'present', !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={!attendance.present}
                            onCheckedChange={(checked) => 
                              handleAttendanceChange(student.id, 'present', !checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={attendance.justified}
                            disabled={attendance.present}
                            onCheckedChange={(checked) => 
                              handleAttendanceChange(student.id, 'justified', !!checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={attendance.note}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            placeholder="Observações..."
                            className="max-w-xs"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Relatório da Turma (Modo Relatório) */}
      {viewMode === 'report' && classAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Presenças - {classAttendance.class.name}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, "dd/MM/yyyy", { locale: pt })} - {classAttendance.subject?.name}
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumo */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{classAttendance.summary.totalStudents}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{classAttendance.summary.totalPresent}</div>
                <div className="text-sm text-muted-foreground">Presentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{classAttendance.summary.totalAbsent}</div>
                <div className="text-sm text-muted-foreground">Ausentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{classAttendance.summary.totalJustified}</div>
                <div className="text-sm text-muted-foreground">Justificados</div>
              </div>
            </div>

            {/* Lista detalhada */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classAttendance.attendances.map((attendance: any) => (
                  <TableRow key={attendance.studentId}>
                    <TableCell className="font-medium">{attendance.studentName}</TableCell>
                    <TableCell>
                      {getStatusBadge(attendance.present, attendance.justified)}
                    </TableCell>
                    <TableCell>{attendance.note || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Consulta Individual */}
      {viewMode === 'individual' && studentSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Frequência Individual - {studentSummary.student.name}</span>
              {getAttendanceIcon(studentSummary.attendancePercentage)}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Período: {format(startOfMonth(selectedDate), "MMMM yyyy", { locale: pt })}
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumo Geral */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{studentSummary.totalClasses}</div>
                <div className="text-sm text-muted-foreground">Total de Aulas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{studentSummary.totalPresent}</div>
                <div className="text-sm text-muted-foreground">Presentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{studentSummary.totalAbsent}</div>
                <div className="text-sm text-muted-foreground">Faltas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{studentSummary.totalJustified}</div>
                <div className="text-sm text-muted-foreground">Justificadas</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  studentSummary.attendancePercentage >= 75 ? "text-green-600" : "text-red-600"
                )}>
                  {studentSummary.attendancePercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Frequência</div>
              </div>
            </div>

            {/* Status de Frequência */}
            <div className="mb-6 p-4 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                {studentSummary.attendancePercentage >= 75 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {studentSummary.attendancePercentage >= 75 ? 'Frequência Adequada' : 'Frequência Insuficiente'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {studentSummary.attendancePercentage >= 75 
                  ? 'O aluno atende aos requisitos mínimos de frequência (75%) estabelecidos pela legislação angolana.'
                  : 'ATENÇÃO: O aluno não atende aos requisitos mínimos de frequência (75%). É necessário acompanhamento.'}
              </p>
            </div>

            {/* Frequência por Disciplina */}
            <div>
              <h4 className="font-semibold mb-3">Frequência por Disciplina</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-center">Aulas</TableHead>
                    <TableHead className="text-center">Presentes</TableHead>
                    <TableHead className="text-center">Frequência</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentSummary.bySubject.map((subject) => (
                    <TableRow key={subject.subjectId}>
                      <TableCell className="font-medium">{subject.subjectName}</TableCell>
                      <TableCell className="text-center">{subject.totalClasses}</TableCell>
                      <TableCell className="text-center">{subject.totalPresent}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "font-medium",
                          subject.attendancePercentage >= 75 ? "text-green-600" : "text-red-600"
                        )}>
                          {subject.attendancePercentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {subject.attendancePercentage >= 75 ? (
                          <Badge className="bg-green-100 text-green-800">Adequada</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Insuficiente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre Frequência Escolar Angola */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Frequência Escolar Angolano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Requisitos Legais:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="text-primary font-medium">75%</span> frequência mínima obrigatória</li>
                <li>• Faltas justificadas com documentação médica</li>
                <li>• Controle diário por disciplina</li>
                <li>• Relatórios mensais obrigatórios</li>
                <li>• Acompanhamento de alunos em risco</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Status de Frequência:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="text-green-600 font-medium">≥ 90%:</span> Excelente</li>
                <li>• <span className="text-green-600 font-medium">75-89%:</span> Adequada</li>
                <li>• <span className="text-yellow-600 font-medium">60-74%:</span> Em Risco</li>
                <li>• <span className="text-red-600 font-medium">< 60%:</span> Insuficiente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}