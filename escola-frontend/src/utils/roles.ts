/**
 * Utilitários para verificação de roles/permissões
 */

// Roles que podem ver KPIs financeiros
export const canSeeFinanceKPI = (role?: string): boolean => {
  return ['ADMIN', 'DIRETOR', 'FINANCEIRO'].includes(role ?? '');
};

// Roles que podem gerenciar finanças (criar faturas, marcar pagamentos)
export const canManageFinance = (role?: string): boolean => {
  return ['ADMIN', 'SECRETARIA', 'FINANCEIRO'].includes(role ?? '');
};

// Roles que podem ver relatórios financeiros
export const canSeeFinanceReports = (role?: string): boolean => {
  return ['ADMIN', 'DIRETOR', 'FINANCEIRO'].includes(role ?? '');
};

// Roles que podem exportar dados financeiros
export const canExportFinanceData = (role?: string): boolean => {
  return ['ADMIN', 'DIRETOR', 'FINANCEIRO'].includes(role ?? '');
};

// Roles que podem cancelar/deletar faturas
export const canDeleteInvoices = (role?: string): boolean => {
  return ['ADMIN', 'FINANCEIRO'].includes(role ?? '');
};