
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ScheduleForm } from './ScheduleForm';

interface Schedule {
  id: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  class: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  academicYear: string;
}

interface ScheduleManagementProps {
  teacherId?: string;
  teacherName?: string;
}

const mockSchedules: Schedule[] = [
  {
    id: '1',
    teacherId: '1',
    teacherName: 'Prof. Maria Santos',
    subject: 'Matemática A',
    class: '10º A',
    dayOfWeek: 'Segunda-feira',
    startTime: '08:00',
    endTime: '09:30',
    room: 'Sala 201',
    academicYear: '2024/2025'
  },
  {
    id: '2',
    teacherId: '1',
    teacherName: 'Prof. Maria Santos',
    subject: 'Matemática B',
    class: '11º B',
    dayOfWeek: 'Terça-feira',
    startTime: '10:00',
    endTime: '11:30',
    room: 'Sala 201',
    academicYear: '2024/2025'
  }
];

const daysOfWeek = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'
];

export function ScheduleManagement({ teacherId, teacherName }: ScheduleManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = mockSchedules, isLoading } = useQuery({
    queryKey: ['teacher-schedules', teacherId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return teacherId 
        ? mockSchedules.filter(s => s.teacherId === teacherId)
        : mockSchedules;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newSchedule: Omit<Schedule, 'id'>) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...newSchedule, id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-schedules'] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      toast({ title: 'Horário criado com sucesso!' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedSchedule: Schedule) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return updatedSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-schedules'] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      toast({ title: 'Horário atualizado com sucesso!' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-schedules'] });
      toast({ title: 'Horário removido com sucesso!' });
    }
  });

  const filteredSchedules = selectedDay === 'all' 
    ? schedules 
    : schedules.filter(schedule => schedule.dayOfWeek === selectedDay);

  const handleSubmit = (scheduleData: Omit<Schedule, 'id'>) => {
    if (editingSchedule) {
      updateMutation.mutate({ ...editingSchedule, ...scheduleData });
    } else {
      createMutation.mutate(scheduleData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Horários</h2>
          <p className="text-muted-foreground">
            {teacherName ? `Horários de ${teacherName}` : 'Gestão de horários dos professores'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSchedule(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Horário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Editar Horário' : 'Novo Horário'}
              </DialogTitle>
            </DialogHeader>
            <ScheduleForm
              schedule={editingSchedule}
              teacherId={teacherId}
              teacherName={teacherName}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horários da Semana
            </span>
            <div className="flex gap-2">
              <Button
                variant={selectedDay === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay('all')}
              >
                Todos
              </Button>
              {daysOfWeek.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDay(day)}
                >
                  {day.substring(0, 3)}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dia da Semana</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Sala</TableHead>
                {!teacherId && <TableHead>Professor</TableHead>}
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={teacherId ? 6 : 7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={teacherId ? 6 : 7} className="text-center py-8 text-muted-foreground">
                    Nenhum horário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <Badge variant="outline">{schedule.dayOfWeek}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{schedule.subject}</TableCell>
                    <TableCell>{schedule.class}</TableCell>
                    <TableCell>{schedule.room}</TableCell>
                    {!teacherId && <TableCell>{schedule.teacherName}</TableCell>}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(schedule.id)}
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
