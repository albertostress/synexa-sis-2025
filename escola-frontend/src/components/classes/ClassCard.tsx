import { MoreHorizontal, Users, Clock, Layers, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { memo } from "react";

type ClassCardProps = {
  turma: {
    id: string;
    name: string;
    classLevel?: string;
    cycle?: string;
    year: number;
    shift: "MORNING" | "AFTERNOON" | "EVENING";
    capacity: number;
    enrollmentsCount?: number;
    teachers?: Array<{ id: string; user?: { name: string } }>;
    _count?: { enrollments: number };
  };
  canManage: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

// Mapeamento de labels
const CLASS_LEVEL_LABELS: Record<string, string> = {
  CLASSE_1: "1.ª Classe",
  CLASSE_2: "2.ª Classe",
  CLASSE_3: "3.ª Classe",
  CLASSE_4: "4.ª Classe",
  CLASSE_5: "5.ª Classe",
  CLASSE_6: "6.ª Classe",
  CLASSE_7: "7.ª Classe",
  CLASSE_8: "8.ª Classe",
  CLASSE_9: "9.ª Classe",
  CLASSE_10: "10.ª Classe",
  CLASSE_11: "11.ª Classe",
  CLASSE_12: "12.ª Classe",
};

const CYCLE_LABELS: Record<string, string> = {
  INICIACAO: "Iniciação",
  PRIMARIO_1: "1.º Ciclo do Ensino Primário",
  PRIMARIO_2: "2.º Ciclo do Ensino Primário",
  SECUNDARIO_1: "1.º Ciclo do Ensino Secundário",
  SECUNDARIO_2: "2.º Ciclo do Ensino Secundário",
};

const SHIFT_LABELS: Record<string, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
};

const ClassCard = memo(function ClassCard({
  turma,
  canManage,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: ClassCardProps) {
  // Calcular ocupação
  const used = turma._count?.enrollments || turma.enrollmentsCount || 0;
  const total = turma.capacity;
  const percentage = Math.round((used / Math.max(total, 1)) * 100);
  
  // Cor do progresso baseada na ocupação
  const progressColor = percentage > 90 ? "bg-red-500" : percentage >= 71 ? "bg-amber-500" : "bg-blue-500";
  
  // Labels formatados
  const classLevelLabel = turma.classLevel ? CLASS_LEVEL_LABELS[turma.classLevel] || turma.classLevel : "";
  const cycleLabel = turma.cycle ? CYCLE_LABELS[turma.cycle] || turma.cycle : "";
  const shiftLabel = SHIFT_LABELS[turma.shift] || turma.shift;
  const schoolYear = `${turma.year}/${turma.year + 1}`;
  
  // Professores
  const teachers = turma.teachers || [];
  const teacherNames = teachers
    .map(t => t.user?.name)
    .filter(Boolean)
    .slice(0, 2);
  const extraTeachers = Math.max(teachers.length - 2, 0);

  return (
    <div className="group relative rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {classLevelLabel && `${classLevelLabel} · `}{turma.name}
          </h3>
          
          {/* Meta informações */}
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {cycleLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate">{cycleLabel}</span>
              </span>
            )}
            
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  turma.shift === "MORNING" && "bg-emerald-50 text-emerald-700",
                  turma.shift === "AFTERNOON" && "bg-sky-50 text-sky-700",
                  turma.shift === "EVENING" && "bg-indigo-50 text-indigo-700"
                )}
              >
                {shiftLabel}
              </span>
            </span>
            
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">{schoolYear}</span>
            </span>
          </div>
        </div>

        {/* Menu de ações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Mais ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onView(turma.id)}>
              Ver detalhes
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuItem onClick={() => onEdit(turma.id)}>
                  Editar turma
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(turma.id)}>
                  Duplicar turma
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(turma.id)}
                >
                  Apagar turma
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Footer com informações adicionais */}
      <div className="mt-4 space-y-3">
        {/* Professores */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span className="text-gray-600">Professores:</span>
          {teacherNames.length > 0 ? (
            <span className="font-medium text-gray-900">
              {teacherNames.join(", ")}
              {extraTeachers > 0 && (
                <span className="ml-1 text-gray-500">+{extraTeachers}</span>
              )}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>

        {/* Capacidade */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Capacidade</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium text-gray-900 cursor-help">
                    {used}/{total}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{percentage}% ocupado</p>
                  <p className="text-xs text-gray-400 mt-1">ID: {turma.id.slice(0, 8)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Progress 
            value={percentage} 
            className="h-2" 
            indicatorClassName={progressColor}
          />
        </div>
      </div>
    </div>
  );
});

export default ClassCard;