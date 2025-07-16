import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Search, 
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import { api } from '@/lib/api';

interface Subject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  teachers: Teacher[];
}

interface Teacher {
  id: string;
  userId: string;
  bio?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Componente KPI Card
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

// Componente PageHeader
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

// Componente SubjectActions
function SubjectActions({ subject, onEdit, onDelete }) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(subject);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(subject);
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
            aria-label={`Editar ${subject.name}`}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar Disciplina</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDelete}
            className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/20"
            aria-label={`Remover ${subject.name}`}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Remover Disciplina</TooltipContent>
      </Tooltip>
    </div>
  );
}

export default function SubjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Delete dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacherIds: [] as string[]
  });

  useEffect(() => {
    if (!['ADMIN', 'SECRETARIA', 'PROFESSOR'].includes(user?.role || '')) {
      navigate('/unauthorized');
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load subjects based on role
      const subjectsEndpoint = user?.role === 'PROFESSOR' ? '/subjects/my-subjects' : '/subjects';
      const [subjectsResponse, teachersResponse] = await Promise.all([
        api.get(subjectsEndpoint),
        api.get('/teachers')
      ]);
      
      setSubjects(subjectsResponse.data);
      setTeachers(teachersResponse.data);
    } catch (err: any) {
      setError('Erro ao carregar dados');
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtros e estatísticas
  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjects, searchTerm]);

  const stats = useMemo(() => {
    const totalSubjects = subjects.length;
    const involvedTeachers = new Set(subjects.flatMap(s => s.teachers?.map(t => t.id) || [])).size;
    
    return {
      totalSubjects,
      involvedTeachers
    };
  }, [subjects]);

  // Form handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setCreateError('Nome da disciplina é obrigatório');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        teacherIds: formData.teacherIds
      };

      if (editingSubject) {
        await api.patch(`/subjects/${editingSubject.id}`, payload);
      } else {
        await api.post('/subjects', payload);
      }
      
      // Reload data and close dialog
      await loadData();
      handleCloseDialog();
      
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Erro ao salvar disciplina');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      teacherIds: subject.teachers?.map(t => t.id) || []
    });
    setShowCreateDialog(true);
  };

  const handleDeleteSubject = (subject: Subject) => {
    setSubjectToDelete(subject);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    
    try {
      await api.delete(`/subjects/${subjectToDelete.id}`);
      
      // Update local state
      setSubjects(prev => prev.filter(s => s.id !== subjectToDelete.id));
      
      // Close dialog
      setShowDeleteDialog(false);
      setSubjectToDelete(null);
      
    } catch (error) {
      console.error('Erro ao remover disciplina:', error);
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      teacherIds: []
    });
    setCreateError(null);
  };

  const canManageSubjects = ['ADMIN', 'SECRETARIA'].includes(user?.role || '');

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Gestão de Disciplinas" 
          subtitle="Gerencie as disciplinas oferecidas na escola"
        />
        
        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[...Array(2)].map((_, i) => (
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
          title="Gestão de Disciplinas" 
          subtitle="Gerencie as disciplinas oferecidas na escola"
        />
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              onClick={loadData} 
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
        title="Gestão de Disciplinas" 
        subtitle="Gerencie as disciplinas oferecidas na escola"
      >
        {canManageSubjects && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setEditingSubject(null)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Disciplina
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Editar Disciplina' : 'Criar Nova Disciplina'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {createError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {createError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Disciplina *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Matemática"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da disciplina..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Professores Atribuídos</Label>
                  <Select 
                    value={""} 
                    onValueChange={(value) => {
                      if (value && !formData.teacherIds.includes(value)) {
                        setFormData(prev => ({ 
                          ...prev, 
                          teacherIds: [...prev.teacherIds, value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar professor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers
                        .filter(teacher => !formData.teacherIds.includes(teacher.id))
                        .map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.user.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Selected teachers */}
                  {formData.teacherIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.teacherIds.map((teacherId) => {
                        const teacher = teachers.find(t => t.id === teacherId);
                        if (!teacher) return null;
                        
                        return (
                          <Badge 
                            key={teacherId}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                teacherIds: prev.teacherIds.filter(id => id !== teacherId)
                              }));
                            }}
                          >
                            {teacher.user.name} ×
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={createLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createLoading ? 'Salvando...' : (editingSubject ? 'Atualizar' : 'Criar Disciplina')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Total de Disciplinas"
          value={stats.totalSubjects}
          icon={BookOpen}
          description="Disciplinas cadastradas"
        />
        <KpiCard
          title="Professores Envolvidos"
          value={stats.involvedTeachers}
          icon={Users}
          description="Professores atribuídos"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar disciplinas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Disciplinas */}
      <Card>
        <CardContent className="p-0">
          {filteredSubjects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Nenhuma disciplina encontrada</p>
              <p className="text-sm">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Nenhuma disciplina cadastrada no sistema'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="font-semibold">Nome da Disciplina</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">Professores</TableHead>
                    {canManageSubjects && (
                      <TableHead className="font-semibold text-right">Ações</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {subject.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {subject.description || 'Sem descrição'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {subject.teachers?.slice(0, 3).map((teacher, index) => (
                            <Badge 
                              key={index}
                              variant="secondary" 
                              className="text-xs"
                            >
                              {teacher.user.name}
                            </Badge>
                          ))}
                          {subject.teachers && subject.teachers.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{subject.teachers.length - 3}
                            </Badge>
                          )}
                          {(!subject.teachers || subject.teachers.length === 0) && (
                            <span className="text-xs text-gray-500">Nenhum professor</span>
                          )}
                        </div>
                      </TableCell>
                      {canManageSubjects && (
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <SubjectActions
                              subject={subject}
                              onEdit={handleEditSubject}
                              onDelete={handleDeleteSubject}
                            />
                          </TooltipProvider>
                        </TableCell>
                      )}
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
        Mostrando {filteredSubjects.length} de {subjects.length} disciplinas
      </div>

      {/* AlertDialog para confirmação de remoção */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Disciplina</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a disciplina{' '}
              <strong>{subjectToDelete?.name}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
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