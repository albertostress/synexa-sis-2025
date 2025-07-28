import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  UserCheck, 
  UserX, 
  Users, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
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

// Tipos para o módulo redesenhado
type AttendanceStatusType = 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO';

interface StudentAttendanceRecord {
  studentId: string;
  status: AttendanceStatusType;
  note?: string;
}

export default function Attendance() {
  const { user, hasRole } = useAuth();
  const [selectedClassSubject, setSelectedClassSubject] = useState<string>(''); // "classId_subjectId"
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<{[key: string]: StudentAttendanceRecord}>({});
  const [showStudentsList, setShowStudentsList] = useState(false);
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

  // Buscar alunos apenas se turma+disciplina estiver selecionada
  const selectedClass = selectedClassSubject ? selectedClassSubject.split('_')[0] : '';
  const selectedSubject = selectedClassSubject ? selectedClassSubject.split('_')[1] : '';
  
  const { data: students = [] } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: () => studentsAPI.getAll(),
    enabled: !!selectedClass && !!selectedSubject,
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

  // Buscar estatísticas gerais de frequência por aluno (mock por agora)
  const { data: studentStats = [] } = useQuery({
    queryKey: ['student-attendance-stats', selectedClass],
    queryFn: async () => {
      // Mock de dados de frequência por aluno
      return students.map(student => ({
        studentId: student.id,
        attendancePercentage: Math.floor(Math.random() * 40) + 60 // 60-100%
      }));
    },
    enabled: !!selectedClass && !!selectedSubject && students.length > 0,
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

  // Atualizar attendanceRecords quando classAttendance mudar
  useEffect(() => {
    if (classAttendance?.attendances) {
      const initialData: {[key: string]: StudentAttendanceRecord} = {};
      
      classAttendance.attendances.forEach((attendance: any) => {
        let status: AttendanceStatusType = 'AUSENTE';
        if (attendance.present) status = 'PRESENTE';
        else if (attendance.justified) status = 'JUSTIFICADO';
        
        initialData[attendance.studentId] = {
          studentId: attendance.studentId,
          status,
          note: attendance.note || '',
        };
      });
      
      setAttendanceRecords(initialData);
    }
  }, [classAttendance]);

  // Mostrar lista quando turma+disciplina+data estiverem selecionados
  useEffect(() => {
    setShowStudentsList(!!selectedClassSubject && !!selectedDate);
  }, [selectedClassSubject, selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatusType) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        status,
        note: prev[studentId]?.note || '',
      }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        status: prev[studentId]?.status || 'AUSENTE',
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

    const attendances = students.map(student => ({
      studentId: student.id,
      present: attendanceRecords[student.id]?.status === 'PRESENTE',
      justified: attendanceRecords[student.id]?.status === 'JUSTIFICADO',
      note: attendanceRecords[student.id]?.note || undefined,
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
    const present = students.filter(s => attendanceRecords[s.id]?.status === 'PRESENTE').length;
    const absent = students.filter(s => attendanceRecords[s.id]?.status === 'AUSENTE').length;
    const justified = students.filter(s => attendanceRecords[s.id]?.status === 'JUSTIFICADO').length;
    
    return { 
      total: students.length, 
      present, 
      absent, 
      justified,
      attendanceRate: students.length > 0 ? Math.round((present / students.length) * 100) : 0
    };
  };

  // Opções combinadas de turma + disciplina
  const classSubjectOptions = useMemo(() => {
    const options: { value: string; label: string; shift: string }[] = [];
    
    classes.forEach(cls => {
      subjects.forEach(subject => {
        options.push({
          value: `${cls.id}_${subject.id}`,
          label: `${cls.name} - ${subject.name}`,
          shift: SchoolShifts[cls.shift as keyof typeof SchoolShifts] || cls.shift
        });
      });
    });
    
    return options;
  }, [classes, subjects]);

  // Estatísticas gerais da turma
  const overallStats = useMemo(() => {
    if (!studentStats.length) return { excellent: 0, adequate: 0, risk: 0, insufficient: 0 };
    
    const stats = { excellent: 0, adequate: 0, risk: 0, insufficient: 0 };
    
    studentStats.forEach(stat => {
      if (stat.attendancePercentage >= 90) stats.excellent++;
      else if (stat.attendancePercentage >= 75) stats.adequate++;
      else if (stat.attendancePercentage >= 60) stats.risk++;
      else stats.insufficient++;
    });
    
    return stats;
  }, [studentStats]);

  const getFrequencyBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    } else if (percentage >= 75) {
      return <Badge className="bg-blue-100 text-blue-800">Adequada</Badge>;
    } else if (percentage >= 60) {
      return <Badge className="bg-orange-100 text-orange-800">Em Risco</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Insuficiente</Badge>;
    }
  };

  const getFrequencyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const stats = getAttendanceStats();
  const selectedClassData = classes.find(c => c.id === selectedClass);
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  const canRegister = hasRole('PROFESSOR') || hasRole('SECRETARIA') || hasRole('ADMIN');
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controle de Presenças</h1>
        </div>
      </div>

      {/* Seção de Estatísticas */}
      {showStudentsList && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Presentes</CardTitle>
              <UserCheck className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.present}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Ausentes</CardTitle>
              <UserX className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Justificados</CardTitle>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{stats.justified}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Taxa Atual</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.attendanceRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* Seção de Filtros */}
      <Card className="border-2 border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Filtros de Seleção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Turma e Disciplina Combinado */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Turma e Disciplina
              </label>
              <Select value={selectedClassSubject} onValueChange={setSelectedClassSubject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione turma e disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {classSubjectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">({option.shift})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data da Aula</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
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
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Presenças */}
      {showStudentsList && canRegister && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Chamada - {format(selectedDate, "dd/MM/yyyy", { locale: pt })}</span>
              {selectedClassData && selectedSubjectData && (
                <Badge variant="secondary" className="text-sm">
                  {selectedClassData.name} - {selectedSubjectData.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingClassAttendance ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Nome do Aluno</TableHead>
                      <TableHead className="text-center font-semibold w-48">Status de Presença</TableHead>
                      <TableHead className="text-center font-semibold w-32">Frequência</TableHead>
                      <TableHead className="font-semibold w-64">Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const record = attendanceRecords[student.id] || { status: 'AUSENTE' as AttendanceStatusType, note: '' };
                      const studentStat = studentStats.find(s => s.studentId === student.id);
                      const attendancePercentage = studentStat?.attendancePercentage || 0;
                      
                      return (
                        <TableRow key={student.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">{student.firstName} {student.lastName}</div>
                              <div className="text-xs text-muted-foreground">Nº {student.studentNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <RadioGroup 
                              value={record.status} 
                              onValueChange={(value: AttendanceStatusType) => handleStatusChange(student.id, value)}
                              className="flex items-center justify-center space-x-4"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="PRESENTE" id={`${student.id}-presente`} className="text-green-600" />
                                <label htmlFor={`${student.id}-presente`} className="text-sm text-green-700">Presente</label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="AUSENTE" id={`${student.id}-ausente`} className="text-red-600" />
                                <label htmlFor={`${student.id}-ausente`} className="text-sm text-red-700">Ausente</label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="JUSTIFICADO" id={`${student.id}-justificado`} className="text-yellow-600" />
                                <label htmlFor={`${student.id}-justificado`} className="text-sm text-yellow-700">Justificado</label>
                              </div>
                            </RadioGroup>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <div className={cn("font-bold text-sm", getFrequencyColor(attendancePercentage))}>
                                {attendancePercentage}%
                              </div>
                              {getFrequencyBadge(attendancePercentage)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={record.note || ''}
                              onChange={(e) => handleNoteChange(student.id, e.target.value)}
                              placeholder="Observação opcional..."
                              className="text-sm"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botão Salvar Presenças fixo */}
      {showStudentsList && canRegister && (
        <div className="sticky bottom-4 flex justify-end">
          <Button 
            onClick={saveAttendance} 
            disabled={saveAttendanceMutation.isPending || !selectedClass || !selectedSubject}
            size="lg"
            className="bg-green-600 hover:bg-green-700 shadow-lg"
          >
            {saveAttendanceMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-5 h-5 mr-2" />
                Salvar Presenças
              </>
            )}
          </Button>
        </div>
      )}

      {/* Painel Inferior - Estatísticas da Turma */}
      {showStudentsList && studentStats.length > 0 && (
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Frequência Global da Turma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Barra de Progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Taxa de Frequência Geral</span>
                  <span className="text-primary font-bold">{Math.round((overallStats.excellent + overallStats.adequate) / studentStats.length * 100)}%</span>
                </div>
                <Progress 
                  value={(overallStats.excellent + overallStats.adequate) / studentStats.length * 100} 
                  className="h-3"
                />
              </div>
              
              {/* Legenda das Faixas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Excelente (&gt; 90%): <strong>{overallStats.excellent}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Adequada (75-89%): <strong>{overallStats.adequate}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Em Risco (60-74%): <strong>{overallStats.risk}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Insuficiente (&lt; 60%): <strong>{overallStats.insufficient}</strong></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}