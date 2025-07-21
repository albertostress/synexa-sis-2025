import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Type, Minus, Plus, RotateCcw } from 'lucide-react';
import { useFontSize } from '@/hooks/useFontSize';

interface FontSizeControlProps {
  showLabel?: boolean;
  variant?: 'default' | 'icon' | 'compact';
  className?: string;
}

export function FontSizeControl({ 
  showLabel = false, 
  variant = 'default',
  className = '' 
}: FontSizeControlProps) {
  const { 
    currentConfig, 
    fontSizeOptions, 
    setFontSize, 
    increaseFontSize, 
    decreaseFontSize, 
    resetFontSize,
    canIncrease,
    canDecrease 
  } = useFontSize();

  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'icon') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={className} title="Ajustar tamanho da fonte">
            <Type className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center justify-between">
            Tamanho da Fonte
            <Badge variant="secondary" className="text-xs">
              {Math.round(currentConfig.multiplier * 100)}%
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Quick controls */}
          <div className="flex items-center justify-center gap-1 p-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={decreaseFontSize}
              disabled={!canDecrease}
              title="Diminuir (Ctrl+-)"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={resetFontSize}
              title="Padrão (Ctrl+0)"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={increaseFontSize}
              disabled={!canIncrease}
              title="Aumentar (Ctrl++)"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Font size options */}
          {fontSizeOptions.map((option) => (
            <DropdownMenuItem
              key={option.scale}
              onClick={() => setFontSize(option.scale)}
              className={`flex items-center justify-between cursor-pointer ${
                currentConfig.scale === option.scale ? 'bg-accent' : ''
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
              {currentConfig.scale === option.scale && (
                <Badge variant="default" className="text-xs">Atual</Badge>
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <div className="p-2 text-xs text-muted-foreground">
            Dica: Use Ctrl+/Cmd+ para aumentar e Ctrl+/Cmd- para diminuir
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={decreaseFontSize}
          disabled={!canDecrease}
          title="Diminuir fonte"
        >
          <span className="text-sm">A</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={increaseFontSize}
          disabled={!canIncrease}
          title="Aumentar fonte"
        >
          <span className="text-base font-bold">A</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium">Fonte:</span>
      )}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={decreaseFontSize}
          disabled={!canDecrease}
          className="px-2"
        >
          <Minus className="h-3 w-3 mr-1" />
          <span className="text-sm">A</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[100px]">
              {currentConfig.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {Math.round(currentConfig.multiplier * 100)}%
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuLabel>Escolher Tamanho</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {fontSizeOptions.map((option) => (
              <DropdownMenuItem
                key={option.scale}
                onClick={() => setFontSize(option.scale)}
                className={currentConfig.scale === option.scale ? 'bg-accent' : ''}
              >
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(option.multiplier * 100)}%
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="outline"
          size="sm"
          onClick={increaseFontSize}
          disabled={!canIncrease}
          className="px-2"
        >
          <span className="text-base font-bold">A</span>
          <Plus className="h-3 w-3 ml-1" />
        </Button>
      </div>
      
      {currentConfig.scale !== 'default' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFontSize}
          title="Voltar ao padrão"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Componente de demonstração para mostrar como o texto aparece
export function FontSizeDemo() {
  const { currentConfig } = useFontSize();
  
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Demonstração de Tamanho de Fonte</h3>
        <Badge variant="outline">
          {currentConfig.label} ({Math.round(currentConfig.multiplier * 100)}%)
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold">Título Principal (3xl)</h1>
          <p className="text-muted-foreground">Este é um título principal do sistema</p>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold">Subtítulo (xl)</h2>
          <p className="text-base">
            Este é um parágrafo normal com texto base. O sistema aplicará a escala 
            selecionada a todos os elementos de texto automaticamente.
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium">Seção (lg)</h3>
          <p className="text-sm text-muted-foreground">
            Texto menor usado para descrições e informações secundárias.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm">Botão Pequeno</Button>
          <Button>Botão Normal</Button>
          <Button size="lg">Botão Grande</Button>
        </div>
      </div>
    </div>
  );
}