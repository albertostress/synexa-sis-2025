import { useEffect, useState, useMemo } from 'react';
import { getAllTeachers, Teacher, deleteTeacher, createTeacher, TeacherPayload } from '@/services/teacherService';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  TrendingUp, 
  Search, 
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react';

// Componente KPI Card interno
function KpiCard({ title, value, icon: Icon, description, className = "" }) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente PageHeader interno
function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

// Componente TeacherActions dinâmico
function TeacherActions({ teacher, onEdit, onDelete, showDelete = false }) {
  const navigate = useNavigate();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(teacher);
    } else {
      navigate(`/admin/professores/${teacher.id}/editar`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(teacher);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleEdit}
            className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={`Editar ${teacher.user.name}`}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar Professor</TooltipContent>
      </Tooltip>

      {showDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDelete}
              className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/20"
              aria-label={`Remover ${teacher.user.name}`}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remover Professor</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export default function TeachersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState({
    userId: '',
    biography: '',
    specialization: '',
    qualification: '',
    phone: '',
    experience: '',
    email: '',
    fullName: ''
  });

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/unauthorized');
      return;
    }

    getAllTeachers()
      .then(setTeachers)
      .catch(() => setError('Erro ao carregar professores'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  // Filtros e estatísticas
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const matchesSearch = teacher.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           teacher.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && teacher.active) ||
                           (statusFilter === 'inactive' && !teacher.active);
      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter(t => t.active).length;
    const allSubjects = new Set(teachers.flatMap(t => t.disciplinas || []));
    const avgExperience = teachers.length > 0 ? 
      Math.round(teachers.reduce((acc, t) => acc + (t.experiencia || 0), 0) / teachers.length) : 0;
    
    return {
      total,
      active,
      subjects: allSubjects.size,
      avgExperience
    };
  }, [teachers]);

  // Funções de callback para as ações dos professores
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.userId.trim() || !createFormData.fullName.trim() || !createFormData.email.trim()) {
      setCreateError('Campos obrigatórios: ID do Usuário, Nome Completo e Email');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload = {
        userId: createFormData.userId,
        biography: createFormData.biography || undefined,
        specialization: createFormData.specialization || undefined,
        qualification: createFormData.qualification || undefined,
        phone: createFormData.phone || undefined,
        experience: createFormData.experience ? parseInt(createFormData.experience) : undefined,
        email: createFormData.email,
        fullName: createFormData.fullName
      };

      const newTeacher = await createTeacher(payload);
      
      // Atualizar lista local
      setTeachers(prev => [...prev, newTeacher]);
      
      // Fechar dialog e limpar formulário
      setShowCreateDialog(false);
      setCreateFormData({
        userId: '',
        biography: '',
        specialization: '',
        qualification: '',
        phone: '',
        experience: '',
        email: '',
        fullName: ''
      });
      
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Erro ao criar professor');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    console.log('Editar professor:', teacher.user.name);
    // Navegar para página de edição será implementado pelo TeacherActions
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    
    try {
      await deleteTeacher(teacherToDelete.id);
      
      // Atualizar lista local removendo o professor
      setTeachers(prev => prev.filter(t => t.id !== teacherToDelete.id));
      
      // Fechar dialog
      setShowDeleteDialog(false);
      setTeacherToDelete(null);
      
      console.log('Professor removido com sucesso:', teacherToDelete.user.name);
    } catch (error) {
      console.error('Erro ao remover professor:', error);
      // Aqui poderia ser implementado um toast de erro
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setTeacherToDelete(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTeacher(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Gestão de Professores" 
          subtitle="Gerencie o corpo docente da escola"
        />
        
        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Gestão de Professores" 
          subtitle="Gerencie o corpo docente da escola"
        />
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader 
        title="Gestão de Professores" 
        subtitle="Gerencie o corpo docente da escola"
      >
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Professor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {createError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={createFormData.fullName}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nome completo do professor"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">ID do Usuário *</Label>
                  <Input
                    id="userId"
                    value={createFormData.userId}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="ID do usuário no sistema"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(+244) 999 999 999"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Especialização</Label>
                  <Input
                    id="specialization"
                    value={createFormData.specialization}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="Área de especialização"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualificação</Label>
                  <Input
                    id="qualification"
                    value={createFormData.qualification}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="Nível de qualificação"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="experience">Experiência (anos)</Label>
                <Input
                  id="experience"
                  type="number"
                  value={createFormData.experience}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="Anos de experiência"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="biography">Biografia</Label>
                <Textarea
                  id="biography"
                  value={createFormData.biography}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, biography: e.target.value }))}
                  placeholder="Descrição sobre o professor, formação, experiência..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={createLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createLoading ? 'Criando...' : 'Criar Professor'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total de Professores"
          value={stats.total}
          icon={Users}
          description="Professores cadastrados"
        />
        <KpiCard
          title="Professores Ativos"
          value={stats.active}
          icon={UserCheck}
          description="Atualmente lecionando"
        />
        <KpiCard
          title="Disciplinas"
          value={stats.subjects}
          icon={BookOpen}
          description="Disciplinas cobertas"
        />
        <KpiCard
          title="Experiência Média"
          value={`${stats.avgExperience} anos`}
          icon={TrendingUp}
          description="Experiência do corpo docente"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar professores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Professores */}
      <Card>
        <CardContent className="p-0">
          {filteredTeachers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Nenhum professor encontrado</p>
              <p className="text-sm">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Nenhum professor cadastrado no sistema'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="font-semibold">Professor</TableHead>
                    <TableHead className="font-semibold">Disciplinas</TableHead>
                    <TableHead className="font-semibold">Experiência</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {teacher.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {teacher.user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {teacher.user.email}
                            </p>
                            <Badge 
                              variant="outline" 
                              className="mt-1 text-xs"
                            >
                              {teacher.tipo || 'Efetivo'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {teacher.disciplinas?.slice(0, 3).map((disciplina, index) => (
                            <Badge 
                              key={index}
                              variant="secondary" 
                              className="text-xs"
                            >
                              {disciplina}
                            </Badge>
                          ))}
                          {teacher.disciplinas && teacher.disciplinas.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{teacher.disciplinas.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {teacher.experiencia || 0} anos
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={teacher.active ? 'default' : 'secondary'}
                          className={teacher.active 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }
                        >
                          {teacher.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <TeacherActions
                            teacher={teacher}
                            onEdit={handleEditTeacher}
                            onDelete={handleDeleteTeacher}
                            showDelete={true} // Habilitado para funcionalidade completa
                          />
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rodapé com informações */}
      <div className="text-center text-sm text-gray-500">
        Mostrando {filteredTeachers.length} de {teachers.length} professores
      </div>

      {/* AlertDialog para confirmação de remoção */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Professor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o professor{' '}
              <strong>{teacherToDelete?.user.name}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}