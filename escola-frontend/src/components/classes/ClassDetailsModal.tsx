import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Clock, 
  Layers, 
  CalendarDays,
  BookOpen,
  GraduationCap,
  Activity
} from 'lucide-react';
import type { SchoolClassWithRelations } from '@/types/class';

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  turma: SchoolClassWithRelations | null;
}

const CLASS_LEVEL_LABELS: Record<string, string> = {
  CLASSE_1: '1.ª Classe',
  CLASSE_2: '2.ª Classe',
  CLASSE_3: '3.ª Classe',
  CLASSE_4: '4.ª Classe',
  CLASSE_5: '5.ª Classe',
  CLASSE_6: '6.ª Classe',
  CLASSE_7: '7.ª Classe',
  CLASSE_8: '8.ª Classe',
  CLASSE_9: '9.ª Classe',
  CLASSE_10: '10.ª Classe',
  CLASSE_11: '11.ª Classe',
  CLASSE_12: '12.ª Classe',
};

const CYCLE_LABELS: Record<string, string> = {
  INICIACAO: 'Iniciação',
  PRIMARIO_1: '1.º Ciclo do Ensino Primário',
  PRIMARIO_2: '2.º Ciclo do Ensino Primário',
  SECUNDARIO_1: '1.º Ciclo do Ensino Secundário',
  SECUNDARIO_2: '2.º Ciclo do Ensino Secundário',
};

const SHIFT_LABELS: Record<string, string> = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  EVENING: 'Noite',
};

export default function ClassDetailsModal({
  isOpen,
  onClose,
  turma,
}: ClassDetailsModalProps) {
  if (!turma) return null;

  const used = turma._count?.enrollments || turma.enrollmentsCount || 0;
  const total = turma.capacity;
  const percentage = Math.round((used / Math.max(total, 1)) * 100);
  const available = total - used;
  
  const progressColor = 
    percentage > 90 ? 'bg-red-500' : 
    percentage >= 71 ? 'bg-amber-500' : 
    'bg-blue-500';

  const classLevelLabel = turma.classLevel ? CLASS_LEVEL_LABELS[turma.classLevel] || turma.classLevel : '';
  const cycleLabel = turma.cycle ? CYCLE_LABELS[turma.cycle] || turma.cycle : '';
  const shiftLabel = SHIFT_LABELS[turma.shift] || turma.shift;
  const schoolYear = `${turma.year}/${turma.year + 1}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Detalhes da Turma
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre a turma {turma.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações Gerais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{turma.name}</span>
                </div>
                
                {classLevelLabel && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Classe:</span>
                    <span className="font-medium">{classLevelLabel}</span>
                  </div>
                )}
                
                {cycleLabel && (
                  <div className="flex items-center gap-2 text-sm">
                    <Layers className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Ciclo:</span>
                    <span className="font-medium">{cycleLabel}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Ano Letivo:</span>
                  <span className="font-medium">{schoolYear}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Turno:</span>
                  <Badge
                    variant={
                      turma.shift === 'MORNING' ? 'default' :
                      turma.shift === 'AFTERNOON' ? 'secondary' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    {shiftLabel}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className="text-xs">
                    Ativa
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Capacidade */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ocupação</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{used}</div>
                  <div className="text-xs text-gray-600">Matriculados</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{total}</div>
                  <div className="text-xs text-gray-600">Capacidade</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{available}</div>
                  <div className="text-xs text-gray-600">Vagas</div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de Ocupação</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" indicatorClassName={progressColor} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Professores */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Professores ({turma.teachers?.length || 0})
            </h3>
            {turma.teachers && turma.teachers.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {turma.teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium">
                      {teacher.user?.name || 'Nome não disponível'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum professor atribuído</p>
            )}
          </div>

          {/* Disciplinas */}
          {turma.subjects && turma.subjects.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Disciplinas ({turma.subjects.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {turma.subjects.map((subject: any) => (
                    <Badge key={subject.id} variant="secondary">
                      {subject.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Metadados */}
          <Separator />
          <div className="text-xs text-gray-500">
            <div className="flex justify-between">
              <span>ID: {turma.id}</span>
              <span>
                Criado em: {new Date(turma.createdAt || Date.now()).toLocaleDateString('pt-PT')}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}