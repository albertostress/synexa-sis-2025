
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface ScheduleFormProps {
  schedule?: Schedule | null;
  teacherId?: string;
  teacherName?: string;
  onSubmit: (data: Omit<Schedule, 'id'>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const daysOfWeek = [
  'Segunda-feira',
  'Terça-feira', 
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira'
];

const subjects = [
  'Matemática A',
  'Matemática B',
  'Português',
  'História',
  'Geografia',
  'Física',
  'Química',
  'Biologia',
  'Inglês',
  'Francês',
  'Educação Física',
  'Filosofia',
  'TIC'
];

const classes = [
  '7ª Classe',
  '8ª Classe',
  '9ª Classe',
  '10º A', '10º B', '10º C',
  '11º A', '11º B', '11º C',
  '12º A', '12º B', '12º C',
  '13º A', '13º B', '13º C'
];

const rooms = [
  'Sala 101', 'Sala 102', 'Sala 103',
  'Sala 201', 'Sala 202', 'Sala 203',
  'Sala 301', 'Sala 302', 'Sala 303',
  'Lab. Física', 'Lab. Química', 'Lab. Informática',
  'Biblioteca', 'Auditório', 'Ginásio'
];

export function ScheduleForm({ schedule, teacherId, teacherName, onSubmit, onCancel, isLoading }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    teacherId: schedule?.teacherId || teacherId || '',
    teacherName: schedule?.teacherName || teacherName || '',
    subject: schedule?.subject || '',
    class: schedule?.class || '',
    dayOfWeek: schedule?.dayOfWeek || '',
    startTime: schedule?.startTime || '',
    endTime: schedule?.endTime || '',
    room: schedule?.room || '',
    academicYear: schedule?.academicYear || '2024/2025'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {!teacherId && (
          <>
            <div>
              <Label htmlFor="teacherId">ID do Professor</Label>
              <Input
                id="teacherId"
                value={formData.teacherId}
                onChange={(e) => handleChange('teacherId', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="teacherName">Nome do Professor</Label>
              <Input
                id="teacherName"
                value={formData.teacherName}
                onChange={(e) => handleChange('teacherName', e.target.value)}
                required
              />
            </div>
          </>
        )}
        
        <div>
          <Label htmlFor="subject">Disciplina</Label>
          <Select value={formData.subject} onValueChange={(value) => handleChange('subject', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar disciplina" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="class">Turma</Label>
          <Select value={formData.class} onValueChange={(value) => handleChange('class', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar turma" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dayOfWeek">Dia da Semana</Label>
          <Select value={formData.dayOfWeek} onValueChange={(value) => handleChange('dayOfWeek', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar dia" />
            </SelectTrigger>
            <SelectContent>
              {daysOfWeek.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        <div>
          <Label htmlFor="room">Sala</Label>
          <Select value={formData.room} onValueChange={(value) => handleChange('room', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar sala" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room} value={room}>
                  {room}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="academicYear">Ano Letivo</Label>
          <Input
            id="academicYear"
            value={formData.academicYear}
            onChange={(e) => handleChange('academicYear', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {schedule ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
