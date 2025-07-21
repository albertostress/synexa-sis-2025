import { useState } from 'react';
import { Calendar } from './calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';

/**
 * 🗓️ Calendar Demo Component
 * 
 * Demonstra as funcionalidades do calendário melhorado:
 * - Navegação rápida por ano e mês com dropdowns
 * - Calendário tradicional (apenas setas)
 * - Comparação side-by-side
 */
export function CalendarDemo() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateEnhanced, setSelectedDateEnhanced] = useState<Date | undefined>(new Date());

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🗓️ Calendário Melhorado</h1>
        <p className="text-muted-foreground">
          Navegação rápida de ano e mês para formulários escolares
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendário Tradicional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📅 Calendário Tradicional
            </CardTitle>
            <CardDescription>
              Navegação apenas com setas (comportamento padrão)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) =>
                date > new Date() || date < new Date('1990-01-01')
              }
              className="rounded-md border shadow"
            />
            <div className="text-sm text-muted-foreground">
              Data selecionada: {selectedDate ? selectedDate.toLocaleDateString('pt-BR') : 'Nenhuma'}
            </div>
          </CardContent>
        </Card>

        {/* Calendário Melhorado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Calendário Melhorado
            </CardTitle>
            <CardDescription>
              Com dropdowns de ano e mês para navegação rápida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDateEnhanced}
              onSelect={setSelectedDateEnhanced}
              disabled={(date) =>
                date > new Date() || date < new Date('1990-01-01')
              }
              enableQuickNavigation={true}
              fromYear={1990}
              toYear={2030}
              className="rounded-md border shadow"
            />
            <div className="text-sm text-muted-foreground">
              Data selecionada: {selectedDateEnhanced ? selectedDateEnhanced.toLocaleDateString('pt-BR') : 'Nenhuma'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funcionalidades */}
      <Card>
        <CardHeader>
          <CardTitle>✨ Funcionalidades do Calendário Melhorado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Adicionado</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Dropdown de seleção de mês (Janeiro - Dezembro)</li>
                <li>• Dropdown de seleção de ano (1990 - 2030)</li>
                <li>• Navegação rápida sem cliques múltiplos</li>
                <li>• Meses em português (Angola)</li>
                <li>• Responsivo e acessível</li>
                <li>• Compatível com react-day-picker v8</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">🔄 Mantido</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Seleção de dias por clique</li>
                <li>• Validação de datas (min/max)</li>
                <li>• Estilos shadcn/ui consistentes</li>
                <li>• Suporte a todas as props originais</li>
                <li>• Modo opt-in (enableQuickNavigation)</li>
                <li>• Comportamento padrão preservado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Como Usar */}
      <Card>
        <CardHeader>
          <CardTitle>📖 Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Calendário padrão (comportamento atual):</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
/>`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. Calendário com navegação rápida:</h4>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  enableQuickNavigation={true}
  fromYear={1990}
  toYear={2030}
/>`}
              </pre>
            </div>

            <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> Use <code>enableQuickNavigation={`{true}`}</code> em formulários onde 
                o utilizador precisa selecionar datas de nascimento ou datas históricas que podem estar 
                anos no passado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testee */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste Rápido</CardTitle>
          <CardDescription>
            Experimente selecionar datas nos anos 1990, 2000, 2010, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedDateEnhanced(new Date('1995-06-15'))}
            >
              Jun 1995
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedDateEnhanced(new Date('2000-01-01'))}
            >
              Jan 2000
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedDateEnhanced(new Date('2010-12-25'))}
            >
              Dez 2010
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedDateEnhanced(new Date())}
            >
              Hoje
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}