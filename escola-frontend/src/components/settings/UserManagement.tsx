import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Key, 
  UserX, 
  Mail, 
  Eye, 
  EyeOff,
  Users,
  Shield,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usersAPI } from '@/lib/api';
import { UserRole } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const userSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'DIRETOR', 'SECRETARIA', 'PROFESSOR', 'ADMINISTRATIVO'], {
    required_error: 'Selecione um papel',
  }),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const editUserSchema = userSchema.extend({
  password: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

interface UserManagementProps {
  className?: string;
}

const getRoleBadge = (role: UserRole) => {
  const roleConfig = {
    ADMIN: { label: 'Administrador', color: 'bg-red-100 text-red-800 border-red-200', icon: Shield },
    DIRETOR: { label: 'Diretor', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Users },
    SECRETARIA: { label: 'Secretária', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: User },
    PROFESSOR: { label: 'Professor', color: 'bg-green-100 text-green-800 border-green-200', icon: User },
    ADMINISTRATIVO: { label: 'Administrativo', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: User },
  };
  
  const config = roleConfig[role] || roleConfig.SECRETARIA;
  const Icon = config.icon;
  
  return (
    <Badge className={config.color} variant="outline">
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

export function UserManagement({ className }: UserManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ============= FILTER STATES =============
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Create User Form
  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'SECRETARIA',
      password: '',
    },
  });

  // Edit User Form
  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'SECRETARIA',
      password: '',
    },
  });

  // ============= QUERIES =============
  const { 
    data: users = [], 
    isLoading: usersLoading,
    error: usersError 
  } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ============= MUTATIONS =============
  const createUserMutation = useMutation({
    mutationFn: (userData: UserFormData) => usersAPI.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Utilizador criado!',
        description: 'O novo utilizador foi criado com sucesso.',
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      console.error('API Error:', error.response?.data);
      
      // Melhor tratamento de erro
      let errorMessage = 'Erro interno do servidor';
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        } else {
          errorMessage = error.response.data.message;
        }
      }
      
      toast({
        title: 'Erro ao criar utilizador',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: EditUserFormData }) => 
      usersAPI.update(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Utilizador atualizado!',
        description: 'Os dados do utilizador foram atualizados com sucesso.',
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar utilizador',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Utilizador removido',
        description: 'O utilizador foi removido do sistema.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover utilizador',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // ============= FILTER LOGIC =============
  const filteredUsers = users.filter((user: User) => {
    // Search filter (name or email)
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    // Status filter (todos ativos por enquanto)
    const matchesStatus = statusFilter === 'all' || statusFilter === 'active';

    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const userDate = new Date(user.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = userDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchesDate = userDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          matchesDate = userDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesRole && matchesStatus && matchesDate;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || roleFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all';

  // ============= HANDLERS =============
  const handleCreateUser = (data: UserFormData) => {
    // Log para debug
    console.log('Creating user with data:', data);
    createUserMutation.mutate(data);
  };

  const handleEditUser = (data: EditUserFormData) => {
    if (!editingUser) return;
    
    // Remove password if empty
    const updateData = { ...data };
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }
    
    updateUserMutation.mutate({
      id: editingUser.id,
      userData: updateData,
    });
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleResetPassword = async (user: User) => {
    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      await usersAPI.update(user.id, { password: tempPassword });
      
      toast({
        title: 'Senha redefinida!',
        description: `Nova senha temporária: ${tempPassword}`,
        duration: 10000,
      });
      
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error: any) {
      toast({
        title: 'Erro ao redefinir senha',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    }
  };

  // Removido handleToggleActive temporariamente

  const handleSendCredentials = async (user: User) => {
    try {
      // Simulate sending credentials via email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Credenciais enviadas!',
        description: `As credenciais foram enviadas para ${user.email}`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar credenciais',
        description: 'Não foi possível enviar as credenciais por email.',
        variant: 'destructive',
      });
    }
  };

  if (usersLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (usersError) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center p-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar utilizadores</h3>
            <p className="text-muted-foreground">
              Ocorreu um erro ao carregar a lista de utilizadores.
            </p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
              className="mt-4"
              variant="outline"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Gestão de Utilizadores
              </CardTitle>
              <CardDescription>
Gerir utilizadores do sistema (Admin, Diretor, Secretaria, Professor, Administrativo)
              </CardDescription>
            </div>
            <div className="sticky top-0 z-10">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Utilizador
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Utilizador</DialogTitle>
                  <DialogDescription>
                    Adicione um novo utilizador administrativo ao sistema
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do utilizador" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@escola.ao" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Função</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a função" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">👑 Administrador</SelectItem>
                                <SelectItem value="DIRETOR">📋 Diretor</SelectItem>
                                <SelectItem value="SECRETARIA">📝 Secretária</SelectItem>
                                <SelectItem value="PROFESSOR">🎓 Professor</SelectItem>
                                <SelectItem value="ADMINISTRATIVO">💼 Administrativo</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Temporária</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Digite a senha temporária"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? 'Criando...' : 'Criar Utilizador'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Advanced Filters */}
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avançados
              </h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar Filtros
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar utilizador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Funções</SelectItem>
                  <SelectItem value="ADMIN">👑 Administrador</SelectItem>
                  <SelectItem value="DIRETOR">📋 Diretor</SelectItem>
                  <SelectItem value="SECRETARIA">📝 Secretária</SelectItem>
                  <SelectItem value="PROFESSOR">🎓 Professor</SelectItem>
                  <SelectItem value="ADMINISTRATIVO">💼 Administrativo</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  <SelectItem value="active">✅ Ativo</SelectItem>
                  <SelectItem value="inactive">❌ Inativo</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Períodos</SelectItem>
                  <SelectItem value="today">📅 Hoje</SelectItem>
                  <SelectItem value="week">🗓️ Esta Semana</SelectItem>
                  <SelectItem value="month">📆 Este Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {filteredUsers.length} de {users.length} utilizadores
              </span>
              {hasActiveFilters && (
                <span className="text-primary font-medium">
                  Filtros aplicados
                </span>
              )}
            </div>
          </div>

          {/* Users Table with Internal Scroll */}
          <div className="rounded-md border">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 border-b">
                  <TableRow>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Função</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Criado em</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8">
                        <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                          {hasActiveFilters ? (
                            <>
                              <Search className="h-12 w-12 opacity-50" />
                              <p className="text-lg font-medium">Nenhum utilizador encontrado</p>
                              <p className="text-sm">Ajuste os filtros ou limpe-os para ver todos os utilizadores</p>
                            </>
                          ) : (
                            <>
                              <Users className="h-12 w-12 opacity-50" />
                              <p className="text-lg font-medium">Nenhum utilizador encontrado</p>
                              <p className="text-sm">Crie o primeiro utilizador administrativo</p>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            {user.lastLogin && (
                              <div className="text-xs text-muted-foreground">
                                Último login: {format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm', { locale: pt })}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                          variant="outline"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: pt })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar dados
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                              <Key className="mr-2 h-4 w-4" />
                              Redefinir senha
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleSendCredentials(user)}>
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar credenciais
                            </DropdownMenuItem>
                            
                            {currentUser?.role === 'ADMIN' && user.id !== currentUser.id && (
                              <>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <UserX className="mr-2 h-4 w-4" />
                                      Remover utilizador
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remover utilizador</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja remover o utilizador <strong>{user.name}</strong>? 
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUserMutation.mutate(user.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Sim, remover
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Utilizador</DialogTitle>
            <DialogDescription>
              Altere os dados do utilizador {editingUser?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do utilizador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@escola.ao" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">👑 Administrador</SelectItem>
                          <SelectItem value="DIRETOR">📋 Diretor</SelectItem>
                          <SelectItem value="SECRETARIA">📝 Secretária</SelectItem>
                          <SelectItem value="PROFESSOR">🎓 Professor</SelectItem>
                          <SelectItem value="ADMINISTRATIVO">💼 Administrativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha (opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Deixe vazio para manter a atual"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}