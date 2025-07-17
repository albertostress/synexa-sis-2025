
import { useState } from 'react';
import { Plus, Search, Bus, MapPin, Users, Clock, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Route {
  id: string;
  name: string;
  driver: string;
  vehicle: string;
  capacity: number;
  currentStudents: number;
  status: 'active' | 'inactive' | 'maintenance';
  departureTime: string;
  stops: string[];
}

const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'Rota Norte',
    driver: 'João Silva',
    vehicle: 'Autocarro 001',
    capacity: 45,
    currentStudents: 38,
    status: 'active',
    departureTime: '07:30',
    stops: ['Praça Central', 'Bairro Novo', 'Escola']
  },
  {
    id: '2',
    name: 'Rota Sul',
    driver: 'Maria Santos',
    vehicle: 'Autocarro 002',
    capacity: 40,
    currentStudents: 35,
    status: 'active',
    departureTime: '08:00',
    stops: ['Terminal', 'Centro Comercial', 'Escola']
  }
];

export default function Transport() {
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [newRoute, setNewRoute] = useState<Partial<Route>>({
    name: '',
    driver: '',
    vehicle: '',
    capacity: 0,
    currentStudents: 0,
    status: 'active',
    departureTime: '',
    stops: []
  });
  const { toast } = useToast();

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddRoute = () => {
    if (!newRoute.name || !newRoute.driver || !newRoute.vehicle) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const route: Route = {
      id: Date.now().toString(),
      name: newRoute.name!,
      driver: newRoute.driver!,
      vehicle: newRoute.vehicle!,
      capacity: newRoute.capacity || 0,
      currentStudents: newRoute.currentStudents || 0,
      status: newRoute.status as 'active' | 'inactive' | 'maintenance' || 'active',
      departureTime: newRoute.departureTime || '',
      stops: newRoute.stops || []
    };

    setRoutes([...routes, route]);
    setNewRoute({
      name: '',
      driver: '',
      vehicle: '',
      capacity: 0,
      currentStudents: 0,
      status: 'active',
      departureTime: '',
      stops: []
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Rota adicionada com sucesso!"
    });
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setNewRoute(route);
  };

  const handleUpdateRoute = () => {
    if (!editingRoute) return;

    setRoutes(routes.map(route => 
      route.id === editingRoute.id 
        ? { ...route, ...newRoute }
        : route
    ));
    
    setEditingRoute(null);
    setNewRoute({
      name: '',
      driver: '',
      vehicle: '',
      capacity: 0,
      currentStudents: 0,
      status: 'active',
      departureTime: '',
      stops: []
    });
    
    toast({
      title: "Sucesso",
      description: "Rota atualizada com sucesso!"
    });
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter(route => route.id !== id));
    toast({
      title: "Sucesso",
      description: "Rota removida com sucesso!"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">Manutenção</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOccupancyColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transporte</h1>
          <p className="text-muted-foreground">Gestão de rotas e transporte escolar</p>
        </div>
        <Dialog open={isAddDialogOpen || !!editingRoute} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingRoute(null);
            setNewRoute({
              name: '',
              driver: '',
              vehicle: '',
              capacity: 0,
              currentStudents: 0,
              status: 'active',
              departureTime: '',
              stops: []
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Rota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRoute ? 'Editar Rota' : 'Nova Rota'}</DialogTitle>
              <DialogDescription>
                {editingRoute 
                  ? 'Modifique as informações da rota de transporte conforme necessário.'
                  : 'Preencha os campos para criar uma nova rota de transporte no sistema.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Rota *</Label>
                <Input
                  id="name"
                  value={newRoute.name || ''}
                  onChange={(e) => setNewRoute({...newRoute, name: e.target.value})}
                  placeholder="Digite o nome da rota"
                />
              </div>
              <div>
                <Label htmlFor="driver">Motorista *</Label>
                <Input
                  id="driver"
                  value={newRoute.driver || ''}
                  onChange={(e) => setNewRoute({...newRoute, driver: e.target.value})}
                  placeholder="Digite o nome do motorista"
                />
              </div>
              <div>
                <Label htmlFor="vehicle">Veículo *</Label>
                <Input
                  id="vehicle"
                  value={newRoute.vehicle || ''}
                  onChange={(e) => setNewRoute({...newRoute, vehicle: e.target.value})}
                  placeholder="Digite a identificação do veículo"
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newRoute.capacity || ''}
                  onChange={(e) => setNewRoute({...newRoute, capacity: parseInt(e.target.value) || 0})}
                  placeholder="Número de lugares"
                />
              </div>
              <div>
                <Label htmlFor="departureTime">Horário de Partida</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={newRoute.departureTime || ''}
                  onChange={(e) => setNewRoute({...newRoute, departureTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newRoute.status || 'active'} 
                  onValueChange={(value) => setNewRoute({...newRoute, status: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingRoute ? handleUpdateRoute : handleAddRoute}
                  className="flex-1"
                >
                  {editingRoute ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingRoute(null);
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
            <CardTitle className="text-sm font-medium">Total de Rotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rotas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {routes.filter(r => r.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estudantes Transportados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routes.reduce((acc, route) => acc + route.currentStudents, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Capacidade Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routes.reduce((acc, route) => acc + route.capacity, 0)}
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
                  placeholder="Pesquisar por nome, motorista ou veículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rotas de Transporte</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Ocupação</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoutes.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">{route.name}</TableCell>
                  <TableCell>{route.driver}</TableCell>
                  <TableCell>{route.vehicle}</TableCell>
                  <TableCell>
                    <span className={getOccupancyColor(route.currentStudents, route.capacity)}>
                      {route.currentStudents}/{route.capacity}
                    </span>
                  </TableCell>
                  <TableCell>{route.departureTime}</TableCell>
                  <TableCell>{getStatusBadge(route.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRoute(route)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRoute(route.id)}
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
