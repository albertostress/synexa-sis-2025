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
  Bus,
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
  Route,
  BarChart3,
  FileText,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  transportAPI,
  studentsAPI 
} from '@/lib/api';
import {
  TransportRoute,
  StudentTransport,
  CreateRouteDto,
  UpdateRouteDto,
  AssignMultipleStudentsDto,
  RouteFilters,
  StudentTransportFilters,
  RouteStop,
  RouteStatusLabels,
  RouteStatusColors,
  calculateTripDuration,
  formatTime,
  validateTime,
  sortStopsByOrder,
  formatStudentName,
  formatStudentClass,
  SCHOOL_SCHEDULES,
  VEHICLE_TYPES,
  COMMON_STOPS_LUANDA,
  TRANSPORT_CONFIG
} from '@/types/transport';

// Schema de validação para nova rota
const routeSchema = z.object({
  name: z.string().min(2, 'Nome da rota deve ter pelo menos 2 caracteres'),
  driverName: z.string().min(2, 'Nome do motorista deve ter pelo menos 2 caracteres'),
  vehicle: z.string().min(2, 'Identificação do veículo é obrigatória'),
  departure: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário deve ser HH:mm'),
  returnTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de horário deve ser HH:mm'),
  stops: z.array(z.object({
    name: z.string().min(2, 'Nome da paragem é obrigatório'),
    order: z.number().min(1, 'Ordem deve ser maior que 0')
  })).min(1, 'Pelo menos uma paragem é obrigatória')
}).refine(data => data.departure < data.returnTime, {
  message: 'Horário de retorno deve ser posterior ao de saída',
  path: ['returnTime']
});

// Schema de validação para atribuir alunos
const assignStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Selecione pelo menos um aluno'),
  stopName: z.string().min(1, 'Selecione uma paragem'),
  notes: z.string().optional()
});

type RouteFormData = z.infer<typeof routeSchema>;
type AssignStudentsFormData = z.infer<typeof assignStudentsSchema>;

export default function Transport() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados da interface
  const [activeTab, setActiveTab] = useState('routes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [isNewRouteOpen, setIsNewRouteOpen] = useState(false);
  const [isAssignStudentsOpen, setIsAssignStudentsOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [routePage, setRoutePage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [newStops, setNewStops] = useState<RouteStop[]>([{ name: '', order: 1 }]);

  // Formulários
  const routeForm = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: '',
      driverName: '',
      vehicle: '',
      departure: '07:30',
      returnTime: '17:30',
      stops: [{ name: '', order: 1 }]
    }
  });

  const assignForm = useForm<AssignStudentsFormData>({
    resolver: zodResolver(assignStudentsSchema),
    defaultValues: {
      studentIds: [],
      stopName: '',
      notes: ''
    }
  });

  // Verificações de permissão
  const canManageTransport = transportAPI.canManageTransport(user?.role || '');
  const canViewTransport = transportAPI.canViewTransport(user?.role || '');
  const canAssignStudents = transportAPI.canAssignStudents(user?.role || '');

  // Queries - Rotas
  const { data: routesData, isLoading: loadingRoutes } = useQuery({
    queryKey: ['transport-routes', searchTerm, filterDriver, filterVehicle, routePage],
    queryFn: () => {
      const filters: RouteFilters = {
        page: routePage,
        limit: 10
      };
      
      if (searchTerm) filters.routeName = searchTerm;
      if (filterDriver) filters.driverName = filterDriver;
      if (filterVehicle) filters.vehicle = filterVehicle;
      
      return transportAPI.getRoutes(filters);
    },
    enabled: canViewTransport,
  });

  // Queries - Alunos no transporte
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['transport-students', searchTerm, studentPage],
    queryFn: () => {
      const filters: StudentTransportFilters = {
        page: studentPage,
        limit: 10
      };
      
      if (searchTerm) filters.studentName = searchTerm;
      
      return transportAPI.getStudentsWithTransport(filters);
    },
    enabled: canViewTransport,
  });

  // Query - Estatísticas
  const { data: statsData } = useQuery({
    queryKey: ['transport-stats'],
    queryFn: () => transportAPI.getTransportStats(),
    enabled: canViewTransport,
  });

  // Query - Lista de alunos disponíveis
  const { data: availableStudents } = useQuery({
    queryKey: ['available-students'],
    queryFn: () => studentsAPI.getAll(),
    enabled: canAssignStudents && isAssignStudentsOpen,
  });

  // Mutations
  const createRouteMutation = useMutation({
    mutationFn: (data: CreateRouteDto) => transportAPI.createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      queryClient.invalidateQueries({ queryKey: ['transport-stats'] });
      toast({
        title: "Sucesso",
        description: "Rota criada com sucesso!",
      });
      setIsNewRouteOpen(false);
      routeForm.reset();
      setNewStops([{ name: '', order: 1 }]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar rota",
        variant: "destructive",
      });
    },
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRouteDto }) => 
      transportAPI.updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      toast({
        title: "Sucesso",
        description: "Rota atualizada com sucesso!",
      });
      setEditingRoute(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atualizar rota",
        variant: "destructive",
      });
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: (routeId: string) => transportAPI.deleteRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      queryClient.invalidateQueries({ queryKey: ['transport-stats'] });
      toast({
        title: "Sucesso",
        description: "Rota eliminada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao eliminar rota",
        variant: "destructive",
      });
    },
  });

  const assignStudentsMutation = useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: AssignMultipleStudentsDto }) => 
      transportAPI.assignStudentsToRoute(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      queryClient.invalidateQueries({ queryKey: ['transport-students'] });
      queryClient.invalidateQueries({ queryKey: ['transport-stats'] });
      toast({
        title: "Sucesso",
        description: "Alunos atribuídos com sucesso!",
      });
      setIsAssignStudentsOpen(false);
      assignForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao atribuir alunos",
        variant: "destructive",
      });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => transportAPI.removeStudentFromTransport(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-routes'] });
      queryClient.invalidateQueries({ queryKey: ['transport-students'] });
      queryClient.invalidateQueries({ queryKey: ['transport-stats'] });
      toast({
        title: "Sucesso",
        description: "Aluno removido do transporte com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao remover aluno",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleSubmitRoute = (data: RouteFormData) => {
    const errors = transportAPI.validateRouteData(data);
    if (errors.length > 0) {
      toast({
        title: "Erro de Validação",
        description: errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    const createData: CreateRouteDto = {
      name: data.name,
      driverName: data.driverName,
      vehicle: data.vehicle,
      departure: data.departure,
      returnTime: data.returnTime,
      stops: data.stops.map((stop, index) => ({
        name: stop.name,
        order: index + 1
      }))
    };

    createRouteMutation.mutate(createData);
  };

  const handleAssignStudents = (data: AssignStudentsFormData) => {
    if (!selectedRoute) return;

    const assignData: AssignMultipleStudentsDto = {
      students: data.studentIds.map(studentId => ({
        studentId,
        stopName: data.stopName,
        notes: data.notes
      }))
    };

    assignStudentsMutation.mutate({
      routeId: selectedRoute.id,
      data: assignData
    });
  };

  const handleDeleteRoute = (routeId: string) => {
    if (confirm('Tem certeza que deseja eliminar esta rota?')) {
      deleteRouteMutation.mutate(routeId);
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    if (confirm('Tem certeza que deseja remover este aluno do transporte?')) {
      removeStudentMutation.mutate(studentId);
    }
  };

  const addStop = () => {
    const newOrder = Math.max(...newStops.map(s => s.order), 0) + 1;
    setNewStops([...newStops, { name: '', order: newOrder }]);
  };

  const removeStop = (index: number) => {
    if (newStops.length > 1) {
      const updated = newStops.filter((_, i) => i !== index);
      setNewStops(updated.map((stop, i) => ({ ...stop, order: i + 1 })));
    }
  };

  // Dados calculados
  const currentRoutes = routesData?.data || [];
  const currentStudents = studentsData?.data || [];
  const routesPagination = routesData?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };
  const studentsPagination = studentsData?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };

  // KPIs
  const totalRoutes = statsData?.totalRoutes || 0;
  const activeRoutes = statsData?.activeRoutes || 0;
  const totalStudentsInTransport = statsData?.totalStudents || 0;
  const averageUtilization = statsData ? Math.round(statsData.totalStudents / statsData.totalRoutes) : 0;

  // Verificação de acesso
  if (!canViewTransport) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
          <p className="text-gray-600">Não tem permissão para ver o módulo de transporte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transporte Escolar</h1>
          <p className="text-gray-600">Sistema de gestão de transporte escolar angolano</p>
        </div>
        
        {canManageTransport && (
          <div className="flex gap-2">
            <Dialog open={isNewRouteOpen} onOpenChange={setIsNewRouteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Rota
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Rota de Transporte</DialogTitle>
                </DialogHeader>
                
                <Form {...routeForm}>
                  <form onSubmit={routeForm.handleSubmit(handleSubmitRoute)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={routeForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Rota</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Rota Centro-Escola" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={routeForm.control}
                        name="driverName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Motorista</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: João Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={routeForm.control}
                        name="vehicle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Veículo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Autocarro 001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={routeForm.control}
                        name="departure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horário de Saída</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar horário" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SCHOOL_SCHEDULES.filter(s => s.label.includes('Saída')).map((schedule) => (
                                  <SelectItem key={schedule.time} value={schedule.time}>
                                    {schedule.time} - {schedule.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={routeForm.control}
                        name="returnTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horário de Retorno</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar horário" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SCHOOL_SCHEDULES.filter(s => s.label.includes('Retorno')).map((schedule) => (
                                  <SelectItem key={schedule.time} value={schedule.time}>
                                    {schedule.time} - {schedule.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Paragens */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <FormLabel>Paragens da Rota (em ordem)</FormLabel>
                        <Button type="button" onClick={addStop} variant="outline" size="sm">
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar Paragem
                        </Button>
                      </div>
                      
                      {newStops.map((stop, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Input
                              placeholder={`Paragem ${index + 1}`}
                              value={stop.name}
                              onChange={(e) => {
                                const updated = [...newStops];
                                updated[index] = { ...stop, name: e.target.value };
                                setNewStops(updated);
                                routeForm.setValue('stops', updated);
                              }}
                            />
                          </div>
                          <Select 
                            value={stop.name} 
                            onValueChange={(value) => {
                              const updated = [...newStops];
                              updated[index] = { ...stop, name: value };
                              setNewStops(updated);
                              routeForm.setValue('stops', updated);
                            }}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Paragem comum" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_STOPS_LUANDA.map((commonStop) => (
                                <SelectItem key={commonStop} value={commonStop}>
                                  {commonStop}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {newStops.length > 1 && (
                            <Button 
                              type="button" 
                              onClick={() => removeStop(index)} 
                              variant="outline" 
                              size="sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsNewRouteOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createRouteMutation.isPending}
                      >
                        {createRouteMutation.isPending ? (
                          <>Criando...</>
                        ) : (
                          <>
                            <Bus className="w-4 h-4 mr-2" />
                            Criar Rota
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
              <Route className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Total de Rotas</p>
                <div className="text-2xl font-bold text-blue-600">{totalRoutes}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Rotas Ativas</p>
                <div className="text-2xl font-bold text-green-600">{activeRoutes}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-purple-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Alunos no Transporte</p>
                <div className="text-2xl font-bold text-purple-600">{totalStudentsInTransport}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-600">Média por Rota</p>
                <div className="text-2xl font-bold text-orange-600">{averageUtilization}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="routes">
            <Bus className="w-4 h-4 mr-2" />
            Rotas
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="w-4 h-4 mr-2" />
            Alunos no Transporte
          </TabsTrigger>
        </TabsList>

        {/* Tab: Rotas */}
        <TabsContent value="routes" className="space-y-4">
          {/* Filtros de Rotas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nome da rota..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Filtrar por motorista"
                    value={filterDriver}
                    onChange={(e) => setFilterDriver(e.target.value)}
                    className="w-48"
                  />
                  <Input
                    placeholder="Filtrar por veículo"
                    value={filterVehicle}
                    onChange={(e) => setFilterVehicle(e.target.value)}
                    className="w-48"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Rotas */}
          <Card>
            <CardHeader>
              <CardTitle>Rotas de Transporte ({routesPagination.total})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRoutes ? (
                <div className="text-center py-8">Carregando rotas...</div>
              ) : currentRoutes.length === 0 ? (
                <div className="text-center py-8">
                  <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Nenhuma rota encontrada</p>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterDriver || filterVehicle
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando a primeira rota de transporte'
                    }
                  </p>
                  {canManageTransport && (
                    <Button onClick={() => setIsNewRouteOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Rota
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rota</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Horários</TableHead>
                        <TableHead>Paragens</TableHead>
                        <TableHead>Alunos</TableHead>
                        <TableHead>Utilização</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRoutes.map((route) => {
                        const utilization = transportAPI.getRouteUtilization(route);
                        const studentCount = route.students?.length || 0;
                        const sortedStops = sortStopsByOrder(route.stops);
                        
                        return (
                          <TableRow key={route.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{route.name}</div>
                                <div className="text-sm text-gray-500">
                                  {calculateTripDuration(route.departure, route.returnTime)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{route.driverName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{route.vehicle}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatTime(route.departure)} - {formatTime(route.returnTime)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {sortedStops.length} paragem{sortedStops.length !== 1 ? 's' : ''}
                              </div>
                              <div className="text-xs text-gray-500">
                                {sortedStops.slice(0, 2).map(stop => stop.name).join(', ')}
                                {sortedStops.length > 2 && '...'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {studentCount}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={utilization.color}>
                                {utilization.percentage}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRoute(route)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                {canAssignStudents && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRoute(route);
                                      setIsAssignStudentsOpen(true);
                                    }}
                                  >
                                    <UserPlus className="w-3 h-3" />
                                  </Button>
                                )}
                                {canManageTransport && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingRoute(route)}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRoute(route.id)}
                                      disabled={studentCount > 0}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
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
                      Mostrando {routesPagination.page * routesPagination.limit - routesPagination.limit + 1} a{' '}
                      {Math.min(routesPagination.page * routesPagination.limit, routesPagination.total)} de{' '}
                      {routesPagination.total} rotas
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRoutePage(Math.max(1, routePage - 1))}
                        disabled={routePage === 1}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRoutePage(Math.min(routesPagination.pages, routePage + 1))}
                        disabled={routePage === routesPagination.pages}
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

        {/* Tab: Alunos no Transporte */}
        <TabsContent value="students" className="space-y-4">
          {/* Filtros de Alunos */}
          <Card>
            <CardContent className="p-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar aluno por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Alunos */}
          <Card>
            <CardHeader>
              <CardTitle>Alunos no Transporte ({studentsPagination.total})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="text-center py-8">Carregando alunos...</div>
              ) : currentStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Nenhum aluno no transporte</p>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'Nenhum aluno encontrado com esse nome'
                      : 'Ainda não há alunos atribuídos ao transporte'
                    }
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead>Rota</TableHead>
                        <TableHead>Paragem</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead>Horários</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentStudents.map((studentTransport) => (
                        <TableRow key={studentTransport.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{formatStudentName(studentTransport)}</div>
                              <div className="text-sm text-gray-500">
                                #{studentTransport.student?.studentNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatStudentClass(studentTransport)}
                            </Badge>
                          </TableCell>
                          <TableCell>{studentTransport.route?.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {studentTransport.stopName}
                            </div>
                          </TableCell>
                          <TableCell>{studentTransport.route?.driverName}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {studentTransport.route ? 
                                transportAPI.formatTripTime(
                                  studentTransport.route.departure, 
                                  studentTransport.route.returnTime
                                ) : 'N/A'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            {canAssignStudents && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveStudent(studentTransport.studentId)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Paginação de Alunos */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Mostrando {studentsPagination.page * studentsPagination.limit - studentsPagination.limit + 1} a{' '}
                      {Math.min(studentsPagination.page * studentsPagination.limit, studentsPagination.total)} de{' '}
                      {studentsPagination.total} alunos
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStudentPage(Math.max(1, studentPage - 1))}
                        disabled={studentPage === 1}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStudentPage(Math.min(studentsPagination.pages, studentPage + 1))}
                        disabled={studentPage === studentsPagination.pages}
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
      </Tabs>

      {/* Dialog: Atribuir Alunos à Rota */}
      {canAssignStudents && (
        <Dialog open={isAssignStudentsOpen} onOpenChange={setIsAssignStudentsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Atribuir Alunos à Rota: {selectedRoute?.name}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...assignForm}>
              <form onSubmit={assignForm.handleSubmit(handleAssignStudents)} className="space-y-4">
                <FormField
                  control={assignForm.control}
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

                <FormField
                  control={assignForm.control}
                  name="stopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paragem</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar paragem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedRoute && sortStopsByOrder(selectedRoute.stops).map((stop) => (
                            <SelectItem key={stop.name} value={stop.name}>
                              {stop.order}. {stop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={assignForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Necessidades especiais, observações..." 
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
                    onClick={() => setIsAssignStudentsOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={assignStudentsMutation.isPending}
                  >
                    {assignStudentsMutation.isPending ? (
                      <>Atribuindo...</>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Atribuir Alunos
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