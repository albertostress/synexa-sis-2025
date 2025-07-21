import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Users, 
  MapPin,
  Clock,
  Search, 
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Download,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  CalendarDays,
  BarChart3,
  FileText,
  Mic,
  Bus,
  GraduationCap,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  eventsAPI,
  studentsAPI,
  classesAPI 
} from '@/lib/api';
import {
  Event,
  EventParticipation,
  CreateEventDto,
  UpdateEventDto,
  RegisterMultipleParticipationsDto,
  RegisterClassDto,
  EventFilters,
  ParticipationFilters,
  EventType,
  EventTypeLabels,
  EventTypeIcons,
  EventTypeColors,
  getEventStatus,
  EventStatusLabels,
  EventStatusColors,
  formatEventDate,
  formatEventTime,
  formatParticipantName,
  formatParticipantClass,
  canEditEvent,
  canDeleteEvent,
  generateEventDateTime,
  COMMON_EVENT_LOCATIONS,
  COMMON_EVENT_TIMES,
  EVENTS_CONFIG
} from '@/types/events';

// Schema de validação para novo evento
const eventSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(100, 'Título muito longo'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(1000, 'Descrição muito longa'),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  location: z.string().min(3, 'Local deve ter pelo menos 3 caracteres').max(200, 'Local muito longo'),
  type: z.enum(['PALESTRA', 'PASSEIO', 'REUNIAO', 'FORMATURA', 'OUTRO'] as const, {
    errorMap: () => ({ message: 'Tipo de evento é obrigatório' })
  })
});

// Schema de validação para participações
const participationSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Selecione pelo menos um aluno'),
  classId: z.string().optional(),
  registrationType: z.enum(['students', 'class']),
  notes: z.string().optional()
});

type EventFormData = z.infer<typeof eventSchema>;
type ParticipationFormData = z.infer<typeof participationSchema>;

export default function EventsAngolan() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados da interface
  const [activeTab, setActiveTab] = useState('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all'); // upcoming, past, all
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isParticipationsOpen, setIsParticipationsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventPage, setEventPage] = useState(1);
  const [participantPage, setParticipantPage] = useState(1);

  // Formulários
  const eventForm = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '14:00',
      location: '',
      type: 'OUTRO'
    }
  });

  const participationForm = useForm<ParticipationFormData>({
    resolver: zodResolver(participationSchema),
    defaultValues: {
      studentIds: [],
      classId: '',
      registrationType: 'students',
      notes: ''
    }
  });

  // Verificações de permissão
  const canManageEvents = eventsAPI.canManageEvents(user?.role || '');
  const canViewEvents = eventsAPI.canViewEvents(user?.role || '');
  const canManageParticipations = eventsAPI.canManageParticipations(user?.role || '');
  const canMarkPresence = eventsAPI.canMarkPresence(user?.role || '');

  // Queries - Eventos
  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events', searchTerm, typeFilter, timeFilter, eventPage],
    queryFn: () => {
      const filters: EventFilters = {
        page: eventPage,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'asc'
      };
      
      if (searchTerm) filters.title = searchTerm;
      if (typeFilter !== 'all') filters.type = typeFilter as EventType;
      if (timeFilter === 'upcoming') filters.futureOnly = true;
      if (timeFilter === 'past') filters.pastOnly = true;
      
      return eventsAPI.getEvents(filters);
    },
    enabled: canViewEvents,
  });

  // Query - Participantes do evento selecionado
  const { data: participantsData, isLoading: loadingParticipants } = useQuery({
    queryKey: ['event-participants', selectedEvent?.id, participantPage],
    queryFn: () => {
      if (!selectedEvent) return null;
      
      const filters: ParticipationFilters = {
        page: participantPage,
        limit: 20
      };
      
      return eventsAPI.getEventParticipants(selectedEvent.id, filters);
    },
    enabled: !!selectedEvent && canViewEvents,
  });

  // Query - Estatísticas
  const { data: statsData } = useQuery({
    queryKey: ['events-stats'],
    queryFn: () => eventsAPI.getEventStats(),
    enabled: canViewEvents,
  });

  // Query - Lista de alunos disponíveis
  const { data: availableStudents } = useQuery({
    queryKey: ['available-students'],
    queryFn: () => studentsAPI.getAll(),
    enabled: canManageParticipations && isParticipationsOpen,
  });

  // Query - Lista de turmas disponíveis
  const { data: availableClasses } = useQuery({
    queryKey: ['available-classes'],
    queryFn: () => classesAPI.getAll(),
    enabled: canManageParticipations && isParticipationsOpen,
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: (data: CreateEventDto) => eventsAPI.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events-stats'] });
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!",
      });
      setIsNewEventOpen(false);
      eventForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar evento",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventDto }) => 
      eventsAPI.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso!",
      });
      setEditingEvent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atualizar evento",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => eventsAPI.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events-stats'] });
      toast({
        title: "Sucesso",
        description: "Evento eliminado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao eliminar evento",
        variant: "destructive",
      });
    },
  });

  const registerParticipationsMutation = useMutation({
    mutationFn: ({ eventId, data, type }: { 
      eventId: string; 
      data: RegisterMultipleParticipationsDto | RegisterClassDto;
      type: 'students' | 'class';
    }) => {
      if (type === 'class') {
        return eventsAPI.registerClassParticipation(eventId, data as RegisterClassDto);
      } else {
        return eventsAPI.registerMultipleParticipations(eventId, data as RegisterMultipleParticipationsDto);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-participants'] });
      queryClient.invalidateQueries({ queryKey: ['events-stats'] });
      toast({
        title: "Sucesso",
        description: "Participações registradas com sucesso!",
      });
      setIsParticipationsOpen(false);
      participationForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao registrar participações",
        variant: "destructive",
      });
    },
  });

  const removeParticipationMutation = useMutation({
    mutationFn: (participationId: string) => eventsAPI.removeParticipation(participationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event-participants'] });
      queryClient.invalidateQueries({ queryKey: ['events-stats'] });
      toast({
        title: "Sucesso",
        description: "Participação removida com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao remover participação",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleSubmitEvent = (data: EventFormData) => {
    const errors = eventsAPI.validateEventData({
      ...data,
      date: generateEventDateTime(data.date, data.time)
    });
    
    if (errors.length > 0) {
      toast({
        title: "Erro de Validação",
        description: errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    const createData: CreateEventDto = {
      title: data.title,
      description: data.description,
      date: generateEventDateTime(data.date, data.time),
      location: data.location,
      type: data.type
    };

    createEventMutation.mutate(createData);
  };

  const handleRegisterParticipations = (data: ParticipationFormData) => {
    if (!selectedEvent) return;

    if (data.registrationType === 'class' && data.classId) {
      const classData: RegisterClassDto = {
        classId: data.classId,
        note: data.notes
      };
      
      registerParticipationsMutation.mutate({
        eventId: selectedEvent.id,
        data: classData,
        type: 'class'
      });
    } else if (data.registrationType === 'students' && data.studentIds.length > 0) {
      const studentsData: RegisterMultipleParticipationsDto = {
        studentIds: data.studentIds,
        note: data.notes
      };
      
      registerParticipationsMutation.mutate({
        eventId: selectedEvent.id,
        data: studentsData,
        type: 'students'
      });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Tem certeza que deseja eliminar este evento?')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleRemoveParticipation = (participationId: string) => {
    if (confirm('Tem certeza que deseja remover esta participação?')) {
      removeParticipationMutation.mutate(participationId);
    }
  };

  // Dados calculados
  const currentEvents = eventsData?.events || [];
  const currentParticipants = participantsData?.participants || [];
  const eventsPagination = eventsData?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };
  const participantsPagination = participantsData?.pagination || { total: 0, page: 1, limit: 20, pages: 1 };
  const participantsStats = participantsData?.stats;

  // KPIs
  const totalEvents = statsData?.totalEvents || 0;
  const upcomingEvents = statsData?.upcomingEvents || 0;
  const completedEvents = statsData?.completedEvents || 0;
  const totalParticipations = statsData?.totalParticipations || 0;

  // Verificação de acesso
  if (!canViewEvents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
          <p className="text-gray-600">Não tem permissão para ver o módulo de eventos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Eventos Escolares</h1>
          <p className="text-gray-600">Sistema de gestão de eventos escolares angolanos</p>
        </div>
        
        {canManageEvents && (
          <div className="flex gap-2">
            <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                </DialogHeader>
                
                <Form {...eventForm}>
                  <form onSubmit={eventForm.handleSubmit(handleSubmitEvent)} className="space-y-4">
                    <FormField
                      control={eventForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título do Evento</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Feira de Ciências 2025" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={eventForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o evento, seus objetivos e atividades..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={eventForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Evento</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(EventTypeLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {EventTypeIcons[value as EventType]} {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={eventForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Local</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar local" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMMON_EVENT_LOCATIONS.map((location) => (
                                  <SelectItem key={location} value={location}>
                                    {location}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={eventForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={eventForm.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hora</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar hora" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMMON_EVENT_TIMES.map((time) => (
                                  <SelectItem key={time.value} value={time.value}>
                                    {time.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsNewEventOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createEventMutation.isPending}
                      >
                        {createEventMutation.isPending ? (
                          <>Criando...</>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 mr-2" />
                            Criar Evento
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
                <div className="text-2xl font-bold text-blue-600">{totalEvents}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Próximos</p>
                <div className="text-2xl font-bold text-orange-600">{upcomingEvents}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Realizados</p>
                <div className="text-2xl font-bold text-green-600">{completedEvents}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-purple-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Participações</p>
                <div className="text-2xl font-bold text-purple-600">{totalParticipations}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">
            <Calendar className="w-4 h-4 mr-2" />
            Eventos
          </TabsTrigger>
          {selectedEvent && (
            <TabsTrigger value="participants">
              <Users className="w-4 h-4 mr-2" />
              Participantes ({selectedEvent.totalParticipants || 0})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Eventos */}
        <TabsContent value="events" className="space-y-4">
          {/* Filtros de Eventos */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por título do evento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {Object.entries(EventTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {EventTypeIcons[value as EventType]} {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Períodos</SelectItem>
                      <SelectItem value="upcoming">Próximos</SelectItem>
                      <SelectItem value="past">Passados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Eventos */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos ({eventsPagination.total})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="text-center py-8">Carregando eventos...</div>
              ) : currentEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Nenhum evento encontrado</p>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || typeFilter !== 'all' || timeFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando o primeiro evento escolar'
                    }
                  </p>
                  {canManageEvents && (
                    <Button onClick={() => setIsNewEventOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Evento
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data e Hora</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Participantes</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentEvents.map((event) => {
                        const status = getEventStatus(event.date);
                        const canEdit = canEditEvent(event.date);
                        const canDelete = canDeleteEvent(event);
                        
                        return (
                          <TableRow key={event.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{event.title}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">
                                  {event.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={EventTypeColors[event.type]}>
                                {EventTypeIcons[event.type]} {EventTypeLabels[event.type]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {formatEventDate(event.date)}
                                </div>
                                <div className="text-gray-500">
                                  {formatEventTime(event.date)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {event.location}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={EventStatusColors[status]}>
                                {EventStatusLabels[status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {event.totalParticipants || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setActiveTab('participants');
                                  }}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                {canManageParticipations && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setIsParticipationsOpen(true);
                                    }}
                                  >
                                    <UserPlus className="w-3 h-3" />
                                  </Button>
                                )}
                                {canManageEvents && canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingEvent(event)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                                {canManageEvents && canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEvent(event.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Paginação */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Mostrando {eventsPagination.page * eventsPagination.limit - eventsPagination.limit + 1} a{' '}
                      {Math.min(eventsPagination.page * eventsPagination.limit, eventsPagination.total)} de{' '}
                      {eventsPagination.total} eventos
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventPage(Math.max(1, eventPage - 1))}
                        disabled={eventPage === 1}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventPage(Math.min(eventsPagination.pages, eventPage + 1))}
                        disabled={eventPage === eventsPagination.pages}
                      >
                        Próximo
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Participantes */}
        {selectedEvent && (
          <TabsContent value="participants" className="space-y-4">
            {/* Info do Evento */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{selectedEvent.title}</h3>
                    <p className="text-sm text-gray-600">{selectedEvent.location} • {formatEventDate(selectedEvent.date)}</p>
                  </div>
                  {participantsStats && (
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{participantsStats.totalParticipants}</div>
                        <div className="text-gray-600">Inscritos</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{participantsStats.totalPresent}</div>
                        <div className="text-gray-600">Presentes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{participantsStats.totalAbsent}</div>
                        <div className="text-gray-600">Ausentes</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Participantes */}
            <Card>
              <CardHeader>
                <CardTitle>Participantes ({participantsPagination.total})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingParticipants ? (
                  <div className="text-center py-8">Carregando participantes...</div>
                ) : currentParticipants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Nenhum participante inscrito</p>
                    <p className="text-gray-600">Este evento ainda não possui participantes.</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Participante</TableHead>
                          <TableHead>Turma</TableHead>
                          <TableHead>Presença</TableHead>
                          <TableHead>Observações</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentParticipants.map((participation) => (
                          <TableRow key={participation.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{formatParticipantName(participation)}</div>
                                <div className="text-sm text-gray-500">
                                  #{participation.student?.studentNumber}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {formatParticipantClass(participation)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={participation.presence 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-red-100 text-red-800 border-red-200'
                                }
                              >
                                {participation.presence ? 'Presente' : 'Ausente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {participation.note || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {canManageParticipations && canEditEvent(selectedEvent.date) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveParticipation(participation.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Paginação de Participantes */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {participantsPagination.page * participantsPagination.limit - participantsPagination.limit + 1} a{' '}
                        {Math.min(participantsPagination.page * participantsPagination.limit, participantsPagination.total)} de{' '}
                        {participantsPagination.total} participantes
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setParticipantPage(Math.max(1, participantPage - 1))}
                          disabled={participantPage === 1}
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setParticipantPage(Math.min(participantsPagination.pages, participantPage + 1))}
                          disabled={participantPage === participantsPagination.pages}
                        >
                          Próximo
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog: Registrar Participações */}
      {canManageParticipations && (
        <Dialog open={isParticipationsOpen} onOpenChange={setIsParticipationsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Registrar Participações: {selectedEvent?.title}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...participationForm}>
              <form onSubmit={participationForm.handleSubmit(handleRegisterParticipations)} className="space-y-4">
                <FormField
                  control={participationForm.control}
                  name="registrationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Registro</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Como deseja registrar?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="students">Alunos Individuais</SelectItem>
                          <SelectItem value="class">Turma Completa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {participationForm.watch('registrationType') === 'class' && (
                  <FormField
                    control={participationForm.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turma</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar turma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(availableClasses || []).map((schoolClass: any) => (
                              <SelectItem key={schoolClass.id} value={schoolClass.id}>
                                {schoolClass.name} ({schoolClass.academicYear})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {participationForm.watch('registrationType') === 'students' && (
                  <FormField
                    control={participationForm.control}
                    name="studentIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alunos (múltipla seleção)</FormLabel>
                        <FormControl>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar alunos..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(availableStudents || []).map((student: any) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.firstName} {student.lastName} - #{student.studentNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={participationForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Necessidades especiais, notas sobre participação..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsParticipationsOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={registerParticipationsMutation.isPending}
                  >
                    {registerParticipationsMutation.isPending ? (
                      <>Registrando...</>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Registrar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}