
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Edit, Trash2, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ScheduleFormFixed } from './ScheduleFormFixed';
import { schedulesAPI } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { 
  Schedule, 
  CreateScheduleDto, 
  UpdateScheduleDto, 
  Weekday, 
  WeekdayLabels,
  ScheduleFilters
} from '@/types/schedule';

interface ScheduleManagementProps {
  teacherId?: string;
  teacherName?: string;
}

// Ordem dos dias da semana para organização
const weekdayOrder = [
  Weekday.SEGUNDA,
  Weekday.TERCA,
  Weekday.QUARTA,
  Weekday.QUINTA,
  Weekday.SEXTA,
  Weekday.SABADO
];

export function ScheduleManagement({ teacherId, teacherName }: ScheduleManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<Weekday | 'all'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Construir filtros para a query
  const filters: ScheduleFilters = {};
  if (teacherId) filters.teacherId = teacherId;
  if (selectedDay !== 'all') filters.weekday = selectedDay;

  // Carregar horários do backend
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules', filters],
    queryFn: () => schedulesAPI.getAll(filters)
  });

  // Mutation para criar horário
  const createMutation = useMutation({
    mutationFn: (data: CreateScheduleDto) => schedulesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Horário criado com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao criar horário:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar horário';
      
      if (error.response?.status === 409) {
        toast({
          title: 'Conflito de horário',
          description: 'Conflito de horário com outro agendamento',
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

  // Mutation para atualizar horário
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleDto }) => 
      schedulesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      toast({ 
        title: 'Sucesso!',
        description: 'Horário atualizado com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar horário:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar horário';
      
      if (error.response?.status === 409) {
        toast({
          title: 'Conflito de horário',
          description: 'Conflito de horário com outro agendamento',
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

  // Mutation para deletar horário
  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({ 
        title: 'Sucesso!',
        description: 'Horário removido com sucesso!' 
      });
    },
    onError: (error: any) => {
      console.error('Erro ao remover horário:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao remover horário';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  // Organizar horários por dia da semana e hora
  const sortedSchedules = [...schedules].sort((a, b) => {
    const aWeekdayIndex = weekdayOrder.indexOf(a.weekday);
    const bWeekdayIndex = weekdayOrder.indexOf(b.weekday);
    
    if (aWeekdayIndex !== bWeekdayIndex) {
      return aWeekdayIndex - bWeekdayIndex;
    }
    
    // Se for o mesmo dia, ordenar por hora
    return a.startTime.localeCompare(b.startTime);
  });

  const handleSubmit = (scheduleData: CreateScheduleDto) => {
    if (editingSchedule) {
      updateMutation.mutate({ 
        id: editingSchedule.id, 
        data: scheduleData 
      });
    } else {
      createMutation.mutate(scheduleData);
    }
  };

  const handleDelete = (schedule: Schedule) => {
    if (confirm(`Tem certeza que deseja remover o horário de ${schedule.subject.name} na ${WeekdayLabels[schedule.weekday]}?`)) {
      deleteMutation.mutate(schedule.id);
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
            <Button onClick={() => {
              console.log('Button clicked, opening dialog');
              setEditingSchedule(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Horário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Editar Horário' : 'Novo Horário'}
              </DialogTitle>
              <DialogDescription>
                {editingSchedule 
                  ? 'Modifique os dados do horário conforme necessário.'
                  : 'Preencha os dados para criar um novo horário de aula.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <ErrorBoundary>
                <ScheduleFormFixed
                  schedule={editingSchedule}
                  teacherId={teacherId}
                  teacherName={teacherName}
                  onCancel={() => {
                    console.log('Closing dialog');
                    setIsDialogOpen(false);
                  }}
                />
              </ErrorBoundary>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horários da Semana
              {schedules.length > 0 && (
                <Badge variant="secondary">{schedules.length} horário{schedules.length !== 1 ? 's' : ''}</Badge>
              )}
            </span>
            <div className="flex gap-2 items-center">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Button
                variant={selectedDay === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay('all')}
              >
                Todos
              </Button>
              {weekdayOrder.map((weekday) => (
                <Button
                  key={weekday}
                  variant={selectedDay === weekday ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDay(weekday)}
                >
                  {WeekdayLabels[weekday].substring(0, 3)}
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
                {!teacherId && <TableHead>Professor</TableHead>}
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={teacherId ? 4 : 5} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : sortedSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={teacherId ? 4 : 5} className="text-center py-8 text-muted-foreground">
                    {selectedDay === 'all' ? 'Nenhum horário encontrado' : `Nenhum horário encontrado para ${WeekdayLabels[selectedDay]}`}
                  </TableCell>
                </TableRow>
              ) : (
                sortedSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {WeekdayLabels[schedule.weekday]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{schedule.subject.name}</p>
                        {schedule.subject.description && (
                          <p className="text-sm text-muted-foreground">{schedule.subject.description}</p>
                        )}
                      </div>
                    </TableCell>
                    {!teacherId && (
                      <TableCell>
                        <div>
                          <p className="font-medium">{schedule.teacher.user.name}</p>
                          <p className="text-sm text-muted-foreground">{schedule.teacher.user.email}</p>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSchedule(schedule);
                            setIsDialogOpen(true);
                          }}
                          title="Editar horário"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule)}
                          disabled={deleteMutation.isPending}
                          title="Remover horário"
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
