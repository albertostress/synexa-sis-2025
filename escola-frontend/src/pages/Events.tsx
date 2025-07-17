
import { useState } from 'react';
import { Plus, Search, Calendar, MapPin, Users, Clock, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'academic' | 'cultural' | 'sports' | 'meeting' | 'celebration';
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  organizer: string;
  participants: number;
  maxParticipants?: number;
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Feira de Ciências',
    description: 'Exposição de projetos científicos dos alunos',
    date: '2024-02-15',
    time: '14:00',
    location: 'Auditório Principal',
    type: 'academic',
    status: 'planned',
    organizer: 'Prof. Maria Silva',
    participants: 150,
    maxParticipants: 200
  },
  {
    id: '2',
    title: 'Reunião de Pais',
    description: 'Reunião trimestral com os encarregados de educação',
    date: '2024-02-20',
    time: '18:00',
    location: 'Sala de Conferências',
    type: 'meeting',
    status: 'planned',
    organizer: 'Direção',
    participants: 85,
    maxParticipants: 100
  }
];

export default function Events() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'academic',
    status: 'planned',
    organizer: '',
    participants: 0,
    maxParticipants: undefined
  });
  const { toast } = useToast();

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const event: Event = {
      id: Date.now().toString(),
      title: newEvent.title!,
      description: newEvent.description || '',
      date: newEvent.date!,
      time: newEvent.time!,
      location: newEvent.location!,
      type: newEvent.type as any || 'academic',
      status: newEvent.status as any || 'planned',
      organizer: newEvent.organizer || '',
      participants: newEvent.participants || 0,
      maxParticipants: newEvent.maxParticipants
    };

    setEvents([...events, event]);
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      type: 'academic',
      status: 'planned',
      organizer: '',
      participants: 0,
      maxParticipants: undefined
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Evento adicionado com sucesso!"
    });
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent(event);
  };

  const handleUpdateEvent = () => {
    if (!editingEvent) return;

    setEvents(events.map(event => 
      event.id === editingEvent.id 
        ? { ...event, ...newEvent }
        : event
    ));
    
    setEditingEvent(null);
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      type: 'academic',
      status: 'planned',
      organizer: '',
      participants: 0,
      maxParticipants: undefined
    });
    
    toast({
      title: "Sucesso",
      description: "Evento atualizado com sucesso!"
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
    toast({
      title: "Sucesso",
      description: "Evento removido com sucesso!"
    });
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      academic: 'Académico',
      cultural: 'Cultural',
      sports: 'Desporto',
      meeting: 'Reunião',
      celebration: 'Celebração'
    };
    return <Badge variant="secondary">{typeLabels[type as keyof typeof typeLabels] || type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline">Planeado</Badge>;
      case 'ongoing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Em Curso</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="text-muted-foreground">Gestão de eventos escolares</p>
        </div>
        <Dialog open={isAddDialogOpen || !!editingEvent} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingEvent(null);
            setNewEvent({
              title: '',
              description: '',
              date: '',
              time: '',
              location: '',
              type: 'academic',
              status: 'planned',
              organizer: '',
              participants: 0,
              maxParticipants: undefined
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Digite o título do evento"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newEvent.description || ''}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Digite a descrição do evento"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date || ''}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newEvent.time || ''}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Local *</Label>
                <Input
                  id="location"
                  value={newEvent.location || ''}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="Digite o local do evento"
                />
              </div>
              <div>
                <Label htmlFor="organizer">Organizador</Label>
                <Input
                  id="organizer"
                  value={newEvent.organizer || ''}
                  onChange={(e) => setNewEvent({...newEvent, organizer: e.target.value})}
                  placeholder="Digite o nome do organizador"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select 
                    value={newEvent.type || 'academic'} 
                    onValueChange={(value) => setNewEvent({...newEvent, type: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Académico</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="sports">Desporto</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="celebration">Celebração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newEvent.status || 'planned'} 
                    onValueChange={(value) => setNewEvent({...newEvent, status: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planeado</SelectItem>
                      <SelectItem value="ongoing">Em Curso</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="maxParticipants">Capacidade Máxima</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={newEvent.maxParticipants || ''}
                  onChange={(e) => setNewEvent({...newEvent, maxParticipants: parseInt(e.target.value) || undefined})}
                  placeholder="Número máximo de participantes"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
                  className="flex-1"
                >
                  {editingEvent ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingEvent(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Eventos Planeados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.status === 'planned').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'ongoing').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.reduce((acc, event) => acc + event.participants, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por título, descrição ou organizador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="academic">Académico</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="sports">Desporto</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="celebration">Celebração</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="planned">Planeado</SelectItem>
                <SelectItem value="ongoing">Em Curso</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Organizador</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(event.date).toLocaleDateString('pt-PT')}</div>
                      <div className="text-muted-foreground">{event.time}</div>
                    </div>
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{getTypeBadge(event.type)}</TableCell>
                  <TableCell>{getStatusBadge(event.status)}</TableCell>
                  <TableCell>{event.organizer}</TableCell>
                  <TableCell>
                    {event.participants}
                    {event.maxParticipants && `/${event.maxParticipants}`}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
