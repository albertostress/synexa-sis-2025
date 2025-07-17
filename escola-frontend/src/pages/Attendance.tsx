
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, UserCheck, UserX, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'justified';
  notes?: string;
}

interface Student {
  id: string;
  name: string;
  number: string;
}

const mockClasses = [
  { id: '1', name: '9º A', subject: 'Matemática' },
  { id: '2', name: '9º B', subject: 'Português' },
  { id: '3', name: '8º A', subject: 'História' },
];

const mockStudents: Student[] = [
  { id: '1', name: 'Ana Silva', number: '001' },
  { id: '2', name: 'João Santos', number: '002' },
  { id: '3', name: 'Maria Costa', number: '003' },
  { id: '4', name: 'Pedro Oliveira', number: '004' },
];

const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Ana Silva',
    classId: '1',
    className: '9º A',
    date: '2024-01-22',
    status: 'present',
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'João Santos',
    classId: '1',
    className: '9º A',
    date: '2024-01-22',
    status: 'absent',
  },
];

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState<string>('1');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceData, setAttendanceData] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', selectedClass, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      console.log('Fetching attendance for:', { selectedClass, date: format(selectedDate, 'yyyy-MM-dd') });
      return Promise.resolve(
        mockAttendance.filter(record => 
          record.classId === selectedClass &&
          record.date === format(selectedDate, 'yyyy-MM-dd')
        )
      );
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: async () => {
      console.log('Fetching students for class:', selectedClass);
      return Promise.resolve(mockStudents);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Saving attendance:', data);
      return Promise.resolve(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({
        title: 'Sucesso',
        description: 'Presenças registradas com sucesso.',
      });
    },
  });

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = () => {
    const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
      studentId,
      classId: selectedClass,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status,
    }));
    
    saveMutation.mutate(attendanceRecords);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      justified: 'bg-blue-100 text-blue-800',
    };
    
    const labels = {
      present: 'Presente',
      absent: 'Ausente',
      late: 'Atrasado',
      justified: 'Justificado',
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getTodayStats = () => {
    const present = students.filter(s => attendanceData[s.id] === 'present').length;
    const absent = students.filter(s => attendanceData[s.id] === 'absent').length;
    const late = students.filter(s => attendanceData[s.id] === 'late').length;
    
    return { present, absent, late, total: students.length };
  };

  const stats = getTodayStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Presenças</h1>
          <p className="text-muted-foreground">Registre e acompanhe a frequência dos alunos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Turma</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {mockClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-64 justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={saveAttendance} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Presenças'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Chamada - {format(selectedDate, "dd/MM/yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Nome do Aluno</TableHead>
                <TableHead className="text-center">Presente</TableHead>
                <TableHead className="text-center">Ausente</TableHead>
                <TableHead className="text-center">Atrasado</TableHead>
                <TableHead className="text-center">Justificado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const currentStatus = attendanceData[student.id] || 'present';
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.number}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={currentStatus === 'present'}
                        onCheckedChange={(checked) => 
                          checked && handleAttendanceChange(student.id, 'present')
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={currentStatus === 'absent'}
                        onCheckedChange={(checked) => 
                          checked && handleAttendanceChange(student.id, 'absent')
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={currentStatus === 'late'}
                        onCheckedChange={(checked) => 
                          checked && handleAttendanceChange(student.id, 'late')
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={currentStatus === 'justified'}
                        onCheckedChange={(checked) => 
                          checked && handleAttendanceChange(student.id, 'justified')
                        }
                      />
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
