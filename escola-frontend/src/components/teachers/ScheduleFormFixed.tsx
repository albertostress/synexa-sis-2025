import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { teachersAPI, subjectsAPI, schedulesAPI } from '@/lib/api';
import { 
  Schedule, 
  CreateScheduleDto, 
  Weekday, 
  WeekdayLabels, 
  Teacher,
  Subject 
} from '@/types/schedule';

interface ScheduleFormProps {
  schedule?: Schedule | null;
  teacherId?: string;
  teacherName?: string;
  onSubmit?: (data: CreateScheduleDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ScheduleFormFixed({ schedule, teacherId, teacherName, onSubmit, onCancel, isLoading: externalLoading }: ScheduleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateScheduleDto>({
    teacherId: schedule?.teacherId || teacherId || '',
    subjectId: schedule?.subjectId || '',
    weekday: schedule?.weekday || Weekday.SEGUNDA,
    startTime: schedule?.startTime || '',
    endTime: schedule?.endTime || ''
  });

  // Carregar professores do backend
  const { data: teachers, isLoading: loadingTeachers, error: teachersError } = useQuery({
    queryKey: ['teachers'],
    queryFn: async (): Promise<Teacher[]> => {
      try {
        const result = await teachersAPI.getAll();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching teachers:', error);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Carregar disciplinas do backend
  const { data: subjects, isLoading: loadingSubjects, error: subjectsError } = useQuery({
    queryKey: ['subjects'],
    queryFn: async (): Promise<Subject[]> => {
      try {
        const result = await subjectsAPI.getAll();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Garantir que sempre temos arrays válidos
  const safeTeachers = Array.isArray(teachers) ? teachers.filter(t => t && t.id && t.id.trim() !== '') : [];
  const safeSubjects = Array.isArray(subjects) ? subjects.filter(s => s && s.id && s.id.trim() !== '') : [];

  // Mutation para criar horário
  const createMutation = useMutation({
    mutationFn: (data: CreateScheduleDto) => schedulesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      onCancel();
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
    mutationFn: ({ id, data }: { id: string; data: CreateScheduleDto }) => 
      schedulesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      onCancel();
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

  const isSubmitting = createMutation.isPending || updateMutation.isPending || externalLoading;

  const validateTimes = (start: string, end: string): boolean => {
    if (!start || !end) return false;
    
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    
    return endMinutes > startMinutes;
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações obrigatórias
    if (!formData.teacherId) {
      toast({
        title: 'Erro',
        description: 'Selecione um professor',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.subjectId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma disciplina',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      toast({
        title: 'Erro',
        description: 'Preencha os horários de início e fim',
        variant: 'destructive'
      });
      return;
    }

    if (!validateTimes(formData.startTime, formData.endTime)) {
      toast({
        title: 'Erro',
        description: 'Horário de fim deve ser posterior ao horário de início',
        variant: 'destructive'
      });
      return;
    }

    // Se tem onSubmit externo (para compatibilidade), usa ele
    if (onSubmit) {
      onSubmit(formData);
    } else {
      // Senão, usa as mutations internas
      if (schedule) {
        updateMutation.mutate({ id: schedule.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    }
  };

  const handleChange = (field: keyof CreateScheduleDto, value: string | Weekday) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Renderização de emergência se houver erros
  if (teachersError || subjectsError) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-800">Erro ao carregar dados:</p>
        {teachersError && <p className="text-sm text-red-600">Professores: {String(teachersError)}</p>}
        {subjectsError && <p className="text-sm text-red-600">Disciplinas: {String(subjectsError)}</p>}
        <button
          onClick={onCancel}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Seleção de Professor */}
        {!teacherId && (
          <div className="col-span-2">
            <Label htmlFor="teacherId">Professor</Label>
            <Select 
              value={formData.teacherId} 
              onValueChange={(value) => handleChange('teacherId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar professor" />
              </SelectTrigger>
              <SelectContent>
                {loadingTeachers ? (
                  <SelectItem value="loading-teachers" disabled>Carregando professores...</SelectItem>
                ) : safeTeachers.length === 0 ? (
                  <SelectItem value="no-teachers" disabled>Nenhum professor encontrado</SelectItem>
                ) : (
                  safeTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.user?.name || 'Nome não disponível'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Info do professor quando teacherId é fornecido */}
        {teacherId && teacherName && (
          <div className="col-span-2 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Professor:</p>
            <p className="font-medium">{teacherName}</p>
          </div>
        )}

        {/* Seleção de Disciplina */}
        <div>
          <Label htmlFor="subjectId">Disciplina</Label>
          <Select 
            value={formData.subjectId} 
            onValueChange={(value) => handleChange('subjectId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar disciplina" />
            </SelectTrigger>
            <SelectContent>
              {loadingSubjects ? (
                <SelectItem value="loading-subjects" disabled>Carregando disciplinas...</SelectItem>
              ) : safeSubjects.length === 0 ? (
                <SelectItem value="no-subjects" disabled>Nenhuma disciplina encontrada</SelectItem>
              ) : (
                safeSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name || 'Nome não disponível'}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Dia da Semana */}
        <div>
          <Label htmlFor="weekday">Dia da Semana</Label>
          <Select 
            value={formData.weekday} 
            onValueChange={(value) => handleChange('weekday', value as Weekday)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar dia" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WeekdayLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Horário de Início */}
        <div>
          <Label htmlFor="startTime">Hora de Início</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            required
          />
        </div>

        {/* Horário de Fim */}
        <div>
          <Label htmlFor="endTime">Hora de Fim</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || loadingTeachers || loadingSubjects}
        >
          {isSubmitting ? 'Processando...' : schedule ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}