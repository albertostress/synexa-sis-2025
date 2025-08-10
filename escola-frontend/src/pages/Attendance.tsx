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



  const stats = getAttendanceStats();
  const selectedClassData = classes.find(c => c.id === selectedClass);
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  const canRegister = hasRole('PROFESSOR') || hasRole('SECRETARIA') || hasRole('ADMIN');
  return (
    <div className="h-full flex flex-col">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Controle de Presenças</h1>
      </div>

      {/* Container principal com layout flexível */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Seção de Estatísticas Compacta */}
        {showStudentsList && (
          <div className="flex flex-wrap gap-2 bg-muted/30 p-2 rounded-md">
            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded border border-green-200">
              <UserCheck className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs text-green-800">Presentes:</span>
              <span className="text-xs font-bold text-green-700">{stats.present}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded border border-red-200">
              <UserX className="h-3.5 w-3.5 text-red-600" />
              <span className="text-xs text-red-800">Ausentes:</span>
              <span className="text-xs font-bold text-red-700">{stats.absent}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
              <span className="text-xs text-yellow-800">Justificados:</span>
              <span className="text-xs font-bold text-yellow-700">{stats.justified}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded border border-blue-200">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs text-blue-800">Taxa:</span>
              <span className="text-xs font-bold text-blue-700">{stats.attendanceRate}%</span>
            </div>
          </div>
        )}

        {/* Seção de Filtros */}
        <Card className="border border-border">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Filtros de Seleção
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* Tabela de Presenças com Scroll Interno */}
        {showStudentsList && canRegister && (
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="py-3 border-b">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Lista de Chamada - {format(selectedDate, "dd/MM/yyyy", { locale: pt })}</span>
                {selectedClassData && selectedSubjectData && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedClassData.name} - {selectedSubjectData.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              {loadingClassAttendance ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {/* Container com scroll interno */}
                  <div className="overflow-y-auto" style={{ maxHeight: '400px', minHeight: '300px', position: 'relative' }}>
                    <table className="w-full table-fixed text-sm">
                      <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b shadow-sm" style={{ position: 'sticky', top: '0' }}>
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-foreground w-1/3">
                            Nome do Aluno
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-foreground w-1/3">
                            Status de Presença
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground w-1/3">
                            Observação
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                      {students.map((student) => {
                        const record = attendanceRecords[student.id] || { status: 'AUSENTE' as AttendanceStatusType, note: '' };
                        
                        return (
                          <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-foreground">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Nº {student.studentNumber}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <RadioGroup 
                                value={record.status} 
                                onValueChange={(value: AttendanceStatusType) => handleStatusChange(student.id, value)}
                                className="flex items-center justify-center gap-3"
                              >
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem 
                                    value="PRESENTE" 
                                    id={`${student.id}-presente`} 
                                    className="text-green-600 border-green-600"
                                  />
                                  <label 
                                    htmlFor={`${student.id}-presente`} 
                                    className="text-sm text-green-700 cursor-pointer font-medium"
                                  >
                                    Presente
                                  </label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem 
                                    value="AUSENTE" 
                                    id={`${student.id}-ausente`} 
                                    className="text-red-600 border-red-600"
                                  />
                                  <label 
                                    htmlFor={`${student.id}-ausente`} 
                                    className="text-sm text-red-700 cursor-pointer font-medium"
                                  >
                                    Ausente
                                  </label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem 
                                    value="JUSTIFICADO" 
                                    id={`${student.id}-justificado`} 
                                    className="text-yellow-600 border-yellow-600"
                                  />
                                  <label 
                                    htmlFor={`${student.id}-justificado`} 
                                    className="text-sm text-yellow-700 cursor-pointer font-medium"
                                  >
                                    Justificado
                                  </label>
                                </div>
                              </RadioGroup>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={record.note || ''}
                                onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                placeholder="Observação opcional..."
                                className="text-sm h-8"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Botão Salvar Presenças fora da tabela */}
                <div className="p-3 border-t bg-muted/20">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Total: {students.length} alunos
                    </div>
                    <Button 
                      onClick={saveAttendance} 
                      disabled={saveAttendanceMutation.isPending || !selectedClass || !selectedSubject}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saveAttendanceMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="w-4 h-4 mr-2" />
                          Salvar Presenças
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}