import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Search, Filter, Plus, LayoutGrid, List } from "lucide-react";
import { useState } from "react";

type ClassesToolbarProps = {
  canCreate: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  totalCount: number;
  filteredCount: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  filters: {
    classLevel?: string;
    cycle?: string;
    shift?: string;
    year?: number;
  };
  onFiltersChange: (filters: any) => void;
};

const CLASS_LEVELS = [
  { value: "CLASSE_1", label: "1.ª Classe" },
  { value: "CLASSE_2", label: "2.ª Classe" },
  { value: "CLASSE_3", label: "3.ª Classe" },
  { value: "CLASSE_4", label: "4.ª Classe" },
  { value: "CLASSE_5", label: "5.ª Classe" },
  { value: "CLASSE_6", label: "6.ª Classe" },
  { value: "CLASSE_7", label: "7.ª Classe" },
  { value: "CLASSE_8", label: "8.ª Classe" },
  { value: "CLASSE_9", label: "9.ª Classe" },
  { value: "CLASSE_10", label: "10.ª Classe" },
  { value: "CLASSE_11", label: "11.ª Classe" },
  { value: "CLASSE_12", label: "12.ª Classe" },
];

const CYCLES = [
  { value: "INICIACAO", label: "Iniciação" },
  { value: "PRIMARIO_1", label: "1.º Ciclo do Ensino Primário" },
  { value: "PRIMARIO_2", label: "2.º Ciclo do Ensino Primário" },
  { value: "SECUNDARIO_1", label: "1.º Ciclo do Ensino Secundário" },
  { value: "SECUNDARIO_2", label: "2.º Ciclo do Ensino Secundário" },
];

const SHIFTS = [
  { value: "MORNING", label: "Manhã" },
  { value: "AFTERNOON", label: "Tarde" },
  { value: "EVENING", label: "Noite" },
];

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: year, label: `${year}/${year + 1}` };
});

export function ClassesToolbar({
  canCreate,
  searchQuery,
  onSearchChange,
  onCreateClick,
  totalCount,
  filteredCount,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
}: ClassesToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  
  const hasActiveFilters = Object.values(filters).some(v => v);
  const isFiltered = filteredCount < totalCount;

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters = { classLevel: undefined, cycle: undefined, shift: undefined, year: undefined };
    setTempFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Lado esquerdo - Busca e Filtros */}
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar turmas..."
                className="pl-9"
                aria-label="Buscar turmas por nome ou classe"
              />
            </div>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="default"
                  className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}
                  aria-label="Abrir filtros"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                      {Object.values(filters).filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtrar Turmas</SheetTitle>
                  <SheetDescription>
                    Refine sua busca usando os filtros abaixo
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter-class">Classe</Label>
                    <Select
                      value={tempFilters.classLevel}
                      onValueChange={(value) => 
                        setTempFilters({ ...tempFilters, classLevel: value || undefined })
                      }
                    >
                      <SelectTrigger id="filter-class">
                        <SelectValue placeholder="Todas as classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as classes</SelectItem>
                        {CLASS_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-cycle">Ciclo</Label>
                    <Select
                      value={tempFilters.cycle}
                      onValueChange={(value) => 
                        setTempFilters({ ...tempFilters, cycle: value || undefined })
                      }
                    >
                      <SelectTrigger id="filter-cycle">
                        <SelectValue placeholder="Todos os ciclos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os ciclos</SelectItem>
                        {CYCLES.map(cycle => (
                          <SelectItem key={cycle.value} value={cycle.value}>
                            {cycle.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-shift">Turno</Label>
                    <Select
                      value={tempFilters.shift}
                      onValueChange={(value) => 
                        setTempFilters({ ...tempFilters, shift: value || undefined })
                      }
                    >
                      <SelectTrigger id="filter-shift">
                        <SelectValue placeholder="Todos os turnos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os turnos</SelectItem>
                        {SHIFTS.map(shift => (
                          <SelectItem key={shift.value} value={shift.value}>
                            {shift.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-year">Ano Letivo</Label>
                    <Select
                      value={tempFilters.year?.toString()}
                      onValueChange={(value) => 
                        setTempFilters({ ...tempFilters, year: value ? parseInt(value) : undefined })
                      }
                    >
                      <SelectTrigger id="filter-year">
                        <SelectValue placeholder="Todos os anos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os anos</SelectItem>
                        {YEARS.map(year => (
                          <SelectItem key={year.value} value={year.value.toString()}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleClearFilters}
                    >
                      Limpar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleApplyFilters}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Lado direito - Contador, View Mode e Criar */}
          <div className="flex items-center gap-3">
            {/* Contador */}
            <span className="text-sm text-gray-600">
              {isFiltered ? (
                <>
                  <span className="font-medium">{filteredCount}</span> de{" "}
                  <span className="font-medium">{totalCount}</span> turmas
                </>
              ) : (
                <>
                  <span className="font-medium">{totalCount}</span> turmas
                </>
              )}
            </span>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center rounded-lg border bg-gray-50 p-0.5">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => onViewModeChange("grid")}
                aria-label="Vista em grade"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => onViewModeChange("list")}
                aria-label="Vista em lista"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Botão Criar */}
            {canCreate && (
              <Button
                onClick={onCreateClick}
                size="default"
                className="shadow-sm"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Nova Turma</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}