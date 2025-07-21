import { CalendarDemo } from '../components/ui/calendar-demo';

/**
 * Página de teste simples para o calendário melhorado
 * Acesso: http://localhost:3001/calendar-test-simple
 */
export default function CalendarTestSimple() {
  return (
    <div className="min-h-screen bg-background">
      <CalendarDemo />
    </div>
  );
}