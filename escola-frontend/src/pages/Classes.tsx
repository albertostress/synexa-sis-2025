import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { classesAPI } from '@/lib/api';
import ClassCard from '@/components/classes/ClassCard';
import { ClassesToolbar } from '@/components/classes/ClassesToolbar';
import ClassDialog from '@/components/classes/ClassDialog';
import ClassDetailsModal from '@/components/classes/ClassDetailsModal';
import { cn } from '@/lib/utils';
import type { SchoolClassWithRelations } from '@/types/class';

// Hook de permissões (simplificado)
function usePermissions() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user?.role || '';
  
  return {
    role,
    canCreate: ['ADMIN', 'DIRETOR', 'SECRETARIA'].includes(role),
    canManage: ['ADMIN', 'DIRETOR', 'SECRETARIA'].includes(role),
  };
}

export default function Classes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canManage } = usePermissions();

  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClassWithRelations | null>(null);
  const [viewingClass, setViewingClass] = useState<SchoolClassWithRelations | null>(null);
  const [filters, setFilters] = useState({
    classLevel: undefined as string | undefined,
    cycle: undefined as string | undefined,
    shift: undefined as string | undefined,
    year: undefined as number | undefined,
  });

  // Carregar turmas
  const { 
    data: classes = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['classes'],
    queryFn: classesAPI.getAll,
    staleTime: 30000,
  });

  // Filtrar turmas
  const filteredClasses = useMemo(() => {
    let result = [...classes];

    // Busca por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(turma => 
        turma.name.toLowerCase().includes(query) ||
        turma.classLevel?.toLowerCase().includes(query) ||
        turma.cycle?.toLowerCase().includes(query)
      );
    }

    // Filtros específicos
    if (filters.classLevel) {
      result = result.filter(t => t.classLevel === filters.classLevel);
    }
    if (filters.cycle) {
      result = result.filter(t => t.cycle === filters.cycle);
    }
    if (filters.shift) {
      result = result.filter(t => t.shift === filters.shift);
    }
    if (filters.year) {
      result = result.filter(t => t.year === filters.year);
    }

    return result;
  }, [classes, searchQuery, filters]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: classesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Turma criada',
        description: 'A turma foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar turma',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar a turma.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      classesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setEditingClass(null);
      toast({
        title: 'Turma atualizada',
        description: 'A turma foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar turma',
        description: error.response?.data?.message || 'Ocorreu um erro ao atualizar a turma.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast({
        title: 'Turma apagada',
        description: 'A turma foi apagada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao apagar turma',
        description: error.response?.data?.message || 'Ocorreu um erro ao apagar a turma.',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleView = useCallback((id: string) => {
    const turma = classes.find(c => c.id === id);
    if (turma) {
      setViewingClass(turma);
    }
  }, [classes]);

  const handleEdit = useCallback((id: string) => {
    const turma = classes.find(c => c.id === id);
    if (turma) {
      setEditingClass(turma);
    }
  }, [classes]);

  const handleDuplicate = useCallback((id: string) => {
    const turma = classes.find(c => c.id === id);
    if (turma) {
      const duplicateData = {
        name: `${turma.name} (Cópia)`,
        classLevel: turma.classLevel,
        cycle: turma.cycle,
        year: turma.year,
        shift: turma.shift,
        capacity: turma.capacity,
      };
      createMutation.mutate(duplicateData as any);
    }
  }, [classes, createMutation]);

  const handleDelete = useCallback((id: string) => {
    if (confirm('Tem certeza que deseja apagar esta turma?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  // Estados de carregamento
  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar turmas. Por favor, tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] -mx-6 -my-8">
      {/* Toolbar fixa no topo */}
      <div className="flex-shrink-0">
        <ClassesToolbar
          canCreate={canCreate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateClick={() => setIsCreateDialogOpen(true)}
          totalCount={classes.length}
          filteredCount={filteredClasses.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Área scrollável para as turmas */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <p className="text-lg font-medium text-gray-900">
              {searchQuery || Object.values(filters).some(v => v)
                ? 'Nenhuma turma encontrada'
                : 'Ainda não há turmas cadastradas'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || Object.values(filters).some(v => v)
                ? 'Tente ajustar os filtros ou a busca'
                : canCreate 
                  ? 'Clique em "Nova Turma" para criar a primeira turma'
                  : 'Entre em contato com a administração para criar turmas'}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-4 pt-4',
              viewMode === 'grid'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            )}
          >
            {filteredClasses.map((turma) => (
              <ClassCard
                key={turma.id}
                turma={turma}
                canManage={canManage}
                onView={handleView}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog de criação/edição */}
      {(isCreateDialogOpen || editingClass) && (
        <ClassDialog
          isOpen={isCreateDialogOpen || !!editingClass}
          onClose={() => {
            setIsCreateDialogOpen(false);
            setEditingClass(null);
          }}
          onSave={(data) => {
            if (editingClass) {
              updateMutation.mutate({ id: editingClass.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          classData={editingClass}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Modal de detalhes */}
      <ClassDetailsModal
        isOpen={!!viewingClass}
        onClose={() => setViewingClass(null)}
        turma={viewingClass}
      />
    </div>
  );
}