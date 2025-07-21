/**
 * Tipos para módulo Events - Sistema de Eventos Escolares Angolanos
 * Alinhado com backend NestJS + Prisma
 */

// Tipos de eventos escolares
export type EventType = 'PALESTRA' | 'PASSEIO' | 'REUNIAO' | 'FORMATURA' | 'OUTRO';

// Status de eventos
export type EventStatus = 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

// Interface principal do evento
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  location: string;
  type: EventType;
  createdAt: string;
  updatedAt: string;
  participants?: EventParticipation[];
  totalParticipants?: number;
  totalPresent?: number;
}

// Interface de participação no evento
export interface EventParticipation {
  id: string;
  eventId: string;
  studentId: string;
  presence: boolean;
  note?: string;
  createdAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
    schoolClass?: {
      id: string;
      name: string;
      academicYear: string;
    };
  };
  event?: Event;
}

// Interface para criar novo evento
export interface CreateEventDto {
  title: string;
  description: string;
  date: string; // ISO string
  location: string;
  type: EventType;
}

// Interface para atualizar evento
export interface UpdateEventDto {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  type?: EventType;
}

// Interface para registrar participação
export interface RegisterParticipationDto {
  studentId: string;
  note?: string;
}

// Interface para registrar múltiplas participações
export interface RegisterMultipleParticipationsDto {
  studentIds: string[];
  note?: string;
}

// Interface para registrar turma inteira
export interface RegisterClassDto {
  classId: string;
  note?: string;
}

// Interface para atualizar participação
export interface UpdateParticipationDto {
  presence?: boolean;
  note?: string;
}

// Interface para atualizar presença em lote
export interface BatchUpdatePresenceDto {
  participations: Array<{
    participationId: string;
    presence: boolean;
  }>;
}

// Interface para filtros de eventos
export interface EventFilters {
  title?: string;
  type?: EventType;
  location?: string;
  startDate?: string;
  endDate?: string;
  futureOnly?: boolean;
  pastOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'title' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// Interface para filtros de participações
export interface ParticipationFilters {
  eventId?: string;
  studentId?: string;
  presence?: boolean;
  page?: number;
  limit?: number;
}

// Interface para lista paginada de eventos
export interface EventListResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Interface para lista paginada de participações
export interface ParticipationListResponse {
  participants: EventParticipation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: {
    totalParticipants: number;
    totalPresent: number;
    totalAbsent: number;
  };
}

// Interface para detalhes do evento
export interface EventDetails extends Event {
  totalParticipants: number;
  totalPresent: number;
  participants: EventParticipation[];
}

// Interface para estatísticas de eventos
export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalParticipations: number;
  averageAttendance: number;
  mostPopularEvent?: {
    event: Event;
    participantCount: number;
  };
  eventsByType: Array<{
    type: EventType;
    count: number;
  }>;
  monthlyEvents: Array<{
    month: string;
    count: number;
  }>;
}

// Interface para histórico de eventos do aluno
export interface StudentEventHistory {
  student: {
    id: string;
    name: string;
    studentNumber: string;
    className?: string;
  };
  summary: {
    totalEvents: number;
    attended: number;
    missed: number;
    attendanceRate: number;
  };
  events: EventParticipation[];
}

// Labels traduzidos para português angolano
export const EventTypeLabels: Record<EventType, string> = {
  PALESTRA: 'Palestra',
  PASSEIO: 'Passeio Escolar',
  REUNIAO: 'Reunião',
  FORMATURA: 'Formatura',
  OUTRO: 'Outro',
};

// Ícones para tipos de eventos
export const EventTypeIcons: Record<EventType, string> = {
  PALESTRA: '🎓',
  PASSEIO: '🚌',
  REUNIAO: '👥',
  FORMATURA: '🎓',
  OUTRO: '📅',
};

// Cores para badges de tipos de eventos
export const EventTypeColors: Record<EventType, string> = {
  PALESTRA: 'bg-blue-100 text-blue-800 border-blue-200',
  PASSEIO: 'bg-green-100 text-green-800 border-green-200',
  REUNIAO: 'bg-purple-100 text-purple-800 border-purple-200',
  FORMATURA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OUTRO: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Labels para status de eventos (calculado pelo frontend)
export const EventStatusLabels = {
  UPCOMING: 'Próximo',
  TODAY: 'Hoje',
  ONGOING: 'Em Andamento',
  COMPLETED: 'Concluído',
  PAST: 'Passado',
} as const;

// Cores para badges de status
export const EventStatusColors = {
  UPCOMING: 'bg-blue-100 text-blue-800 border-blue-200',
  TODAY: 'bg-orange-100 text-orange-800 border-orange-200',
  ONGOING: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  PAST: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

// Locais comuns para eventos em escolas angolanas
export const COMMON_EVENT_LOCATIONS = [
  'Auditório Principal',
  'Sala de Conferências',
  'Pátio da Escola',
  'Quadra de Esportes',
  'Biblioteca',
  'Laboratório de Ciências',
  'Sala de Aula Magna',
  'Refeitório',
  'Sala de Professores',
  'Área Externa',
  'Campo de Futebol',
  'Teatro da Escola',
  'Sala de Artes',
  'Laboratório de Informática',
  'Externo - Local a definir',
] as const;

// Horários típicos para eventos escolares
export const COMMON_EVENT_TIMES = [
  { label: 'Manhã - 08:00', value: '08:00' },
  { label: 'Manhã - 09:00', value: '09:00' },
  { label: 'Manhã - 10:00', value: '10:00' },
  { label: 'Manhã - 11:00', value: '11:00' },
  { label: 'Tarde - 14:00', value: '14:00' },
  { label: 'Tarde - 15:00', value: '15:00' },
  { label: 'Tarde - 16:00', value: '16:00' },
  { label: 'Tarde - 17:00', value: '17:00' },
  { label: 'Noite - 18:00', value: '18:00' },
  { label: 'Noite - 19:00', value: '19:00' },
] as const;

// Helper para determinar status do evento baseado na data
export const getEventStatus = (eventDate: string): keyof typeof EventStatusLabels => {
  const event = new Date(eventDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(event.getFullYear(), event.getMonth(), event.getDate());
  
  const diffTime = eventDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) return 'UPCOMING';
  if (diffDays === 0) {
    // Verifica se está em andamento (assumindo 2h de duração)
    const eventTime = event.getTime();
    const currentTime = now.getTime();
    const twoHours = 2 * 60 * 60 * 1000;
    
    if (currentTime >= eventTime && currentTime <= eventTime + twoHours) {
      return 'ONGOING';
    }
    if (currentTime < eventTime) return 'TODAY';
    return 'COMPLETED';
  }
  return 'PAST';
};

// Helper para formatar data do evento
export const formatEventDate = (date: string): string => {
  const eventDate = new Date(date);
  return eventDate.toLocaleDateString('pt-AO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper para formatar hora do evento
export const formatEventTime = (date: string): string => {
  const eventDate = new Date(date);
  return eventDate.toLocaleTimeString('pt-AO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper para formatar nome do participante
export const formatParticipantName = (participation: EventParticipation): string => {
  if (participation.student) {
    return `${participation.student.firstName} ${participation.student.lastName}`;
  }
  return 'Participante Desconhecido';
};

// Helper para formatar turma do participante
export const formatParticipantClass = (participation: EventParticipation): string => {
  if (participation.student?.schoolClass) {
    return `${participation.student.schoolClass.name} (${participation.student.schoolClass.academicYear})`;
  }
  return 'Sem Turma';
};

// Helper para calcular taxa de presença
export const calculateAttendanceRate = (participants: EventParticipation[]): number => {
  if (participants.length === 0) return 0;
  const present = participants.filter(p => p.presence).length;
  return Math.round((present / participants.length) * 100);
};

// Helper para verificar se evento pode ser editado
export const canEditEvent = (eventDate: string): boolean => {
  const event = new Date(eventDate);
  const now = new Date();
  return event > now; // Só pode editar eventos futuros
};

// Helper para verificar se evento pode ser deletado
export const canDeleteEvent = (event: Event): boolean => {
  const eventDate = new Date(event.date);
  const now = new Date();
  const hasParticipants = (event.totalParticipants || 0) > 0;
  
  // Não pode deletar se já passou ou tem participantes
  return eventDate > now && !hasParticipants;
};

// Helper para verificar se participação pode ser removida
export const canRemoveParticipation = (eventDate: string): boolean => {
  const event = new Date(eventDate);
  const now = new Date();
  return event > now; // Só pode remover de eventos futuros
};

// Helper para validar data do evento
export const validateEventDate = (date: string): string[] => {
  const errors: string[] = [];
  const eventDate = new Date(date);
  const now = new Date();
  
  if (isNaN(eventDate.getTime())) {
    errors.push('Data deve ser uma data válida');
  }
  
  if (eventDate <= now) {
    errors.push('Data deve ser no futuro');
  }
  
  // Verifica se não é muito longe no futuro (1 ano)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (eventDate > oneYearFromNow) {
    errors.push('Data não pode ser superior a 1 ano no futuro');
  }
  
  return errors;
};

// Helper para gerar horário completo do evento
export const generateEventDateTime = (date: string, time: string): string => {
  const [hours, minutes] = time.split(':');
  const eventDate = new Date(date);
  eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return eventDate.toISOString();
};

// Configurações do sistema de eventos
export const EVENTS_CONFIG = {
  maxTitleLength: 100,
  minTitleLength: 3,
  maxDescriptionLength: 1000,
  minDescriptionLength: 10,
  maxLocationLength: 200,
  minLocationLength: 3,
  defaultEventDuration: 2, // horas
  maxFutureMonths: 12,
  reminderDaysBefore: 3,
} as const;

// Interface para configurações personalizáveis
export interface EventsSettings {
  allowPastEvents: boolean;
  requireApproval: boolean;
  maxParticipants: number;
  enableReminders: boolean;
  reminderDaysBefore: number;
  allowSelfRegistration: boolean;
  enableWaitingList: boolean;
  defaultEventDuration: number;
}

// Interface para relatório de eventos
export interface EventReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalEvents: number;
    completedEvents: number;
    totalParticipations: number;
    averageAttendance: number;
  };
  eventsByType: Array<{
    type: EventType;
    count: number;
    attendance: number;
  }>;
  topEvents: Array<{
    event: Event;
    participantCount: number;
    attendanceRate: number;
  }>;
  trends: {
    monthlyGrowth: number;
    attendanceImprovement: number;
  };
}

// Interface para notificação de evento
export interface EventNotification {
  id: string;
  eventId: string;
  userId: string;
  userType: 'STUDENT' | 'TEACHER' | 'PARENT';
  type: 'REMINDER' | 'CANCELLATION' | 'UPDATE' | 'INVITATION';
  message: string;
  sent: boolean;
  scheduledFor: string;
  createdAt: string;
}

// Meses do ano em português
export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

// Helper para obter nome do mês
export const getMonthName = (month: number): string => {
  return MONTHS_PT[month - 1] || '';
};

// Dias da semana em português
export const WEEKDAYS_PT = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
  'Quinta-feira', 'Sexta-feira', 'Sábado'
] as const;

// Helper para obter nome do dia da semana
export const getWeekdayName = (day: number): string => {
  return WEEKDAYS_PT[day] || '';
};

// Helper para calcular próximos eventos
export const getUpcomingEvents = (events: Event[], days: number = 7): Event[] => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return events
    .filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= futureDate;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Helper para agrupar eventos por mês
export const groupEventsByMonth = (events: Event[]): Record<string, Event[]> => {
  return events.reduce((acc, event) => {
    const eventDate = new Date(event.date);
    const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth() + 1}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(event);
    
    return acc;
  }, {} as Record<string, Event[]>);
};