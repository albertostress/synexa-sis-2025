import React from 'react';
import { CalendarDemo } from '../components/ui/calendar-demo';
import { DashboardLayout } from '../components/DashboardLayout';

/**
 * Página de teste para o calendário melhorado
 * Acesso: http://localhost:3001/calendar-test
 */
export default function CalendarTest() {
  return (
    <DashboardLayout>
      <CalendarDemo />
    </DashboardLayout>
  );
}