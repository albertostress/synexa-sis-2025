/**
 * Tipos para módulo Analytics - Sistema de Análise e Dashboards Escolares
 * Alinhado com backend NestJS + Prisma
 */

// Enums para filtros
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING';
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

// Interface base para métricas
export interface MetricItem {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

// Interface para filtros de analytics
export interface FilterAnalyticsDto {
  year?: number; // 2020-2030
  shift?: ShiftType;
  classId?: string; // UUID
  disciplineId?: string; // UUID  
  month?: number; // 1-12
}

// ================================
// OVERVIEW ANALYTICS
// ================================

export interface OverviewResponse {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  enrollmentsByShift: MetricItem[];
  attendanceRate: number;
  paymentRate: number;
}

// ================================
// ATTENDANCE ANALYTICS
// ================================

export interface AbsenceDistribution {
  justified: number;
  unjustified: number;
  total: number;
}

export interface AttendanceAnalyticsResponse {
  overallAttendanceRate: number;
  classesByAttendance: MetricItem[];
  absenceDistribution: AbsenceDistribution;
  monthlyTrend: MetricItem[];
  criticalAttendanceCount: number;
}

// ================================
// GRADES ANALYTICS
// ================================

export interface StatusDistribution {
  approved: number;
  failed: number;
  recovery: number;
}

export interface GradesAnalyticsResponse {
  overallAverage: number;
  averageBySubject: MetricItem[];
  statusDistribution: StatusDistribution;
  approvalRate: number;
  topPerformingClasses: MetricItem[];
}

// ================================
// FINANCE ANALYTICS
// ================================

export interface FinanceAnalyticsResponse {
  totalBilled: number;
  totalReceived: number;
  defaultRate: number;
  pendingInvoices: number;
  monthlyRevenue: MetricItem[];
  paymentStatusDistribution: MetricItem[];
  nextMonthProjection: number;
}

// ================================
// MATRICULATION ANALYTICS
// ================================

export interface GenderDistribution {
  male: number;
  female: number;
}

export interface MatriculationAnalyticsResponse {
  totalEnrollments: number;
  enrollmentsByShift: MetricItem[];
  enrollmentsByClass: MetricItem[];
  monthlyGrowth: MetricItem[];
  yearOverYearGrowth: number;
  renewalRate: number;
  genderDistribution: GenderDistribution;
}

// ================================
// EXTENDED INTERFACES
// ================================

// Interface para estatísticas combinadas
export interface SchoolStatistics {
  overview: OverviewResponse;
  attendance: AttendanceAnalyticsResponse;
  grades: GradesAnalyticsResponse;
  finance: FinanceAnalyticsResponse;
  matriculation: MatriculationAnalyticsResponse;
}

// Interface para período de análise
export interface AnalyticsPeriod {
  startDate: string;
  endDate: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}

// Interface para comparação temporal
export interface TemporalComparison {
  current: number;
  previous: number;
  growth: number;
  growthPercentage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

// Interface para ranking de turmas
export interface ClassRanking {
  classId: string;
  className: string;
  metric: number;
  rank: number;
  change: number; // Mudança desde último período
}

// Interface para ranking de disciplinas
export interface SubjectRanking {
  subjectId: string;
  subjectName: string;
  average: number;
  totalStudents: number;
  rank: number;
}

// Interface para dados de gráfico temporal
export interface TimeSeriesData {
  period: string; // YYYY-MM ou YYYY-MM-DD
  value: number;
  target?: number; // Meta para o período
  growth?: number; // Crescimento em relação ao período anterior
}

// Interface para distribuição demográfica
export interface DemographicBreakdown {
  category: string;
  count: number;
  percentage: number;
  color?: string;
}

// ================================
// DASHBOARD CONFIGURATION
// ================================

// Interface para configuração de dashboard
export interface DashboardConfig {
  refreshInterval: number; // Minutos
  autoRefresh: boolean;
  defaultPeriod: string;
  visibleWidgets: string[];
  userRole: string;
}

// Interface para widget de dashboard
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'METRIC' | 'CHART' | 'TABLE' | 'PROGRESS';
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  position: { x: number; y: number };
  config: Record<string, any>;
  requiredRole?: string[];
}

// Interface para alerta/notificação
export interface AnalyticsAlert {
  id: string;
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  title: string;
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
  acknowledged: boolean;
}

// ================================
// EXPORT/REPORTING
// ================================

// Interface para exportação de relatórios
export interface ReportExportRequest {
  type: 'overview' | 'attendance' | 'grades' | 'finance' | 'matriculation';
  format: 'PDF' | 'EXCEL' | 'CSV';
  period: AnalyticsPeriod;
  filters: FilterAnalyticsDto;
  includeCharts: boolean;
  language: 'pt' | 'en';
}

// Interface para dados de exportação
export interface ReportData {
  title: string;
  generatedAt: string;
  period: AnalyticsPeriod;
  data: Record<string, any>;
  charts?: ChartData[];
  summary: string;
}

// Interface para dados de gráfico
export interface ChartData {
  type: 'BAR' | 'LINE' | 'PIE' | 'DONUT' | 'AREA';
  title: string;
  data: any[];
  config: {
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    legend?: boolean;
  };
}

// ================================
// CACHE & PERFORMANCE
// ================================

// Interface para cache de analytics
export interface AnalyticsCache {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live em segundos
  hits: number;
}

// Interface para métricas de performance
export interface PerformanceMetrics {
  queryTime: number; // ms
  cacheHit: boolean;
  dataSize: number; // bytes
  endpoint: string;
  timestamp: number;
}

// ================================
// LABELS E CONFIGURAÇÕES
// ================================

// Labels para turnos em português
export const ShiftLabels: Record<ShiftType, string> = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  EVENING: 'Noite',
};

// Cores para turnos
export const ShiftColors: Record<ShiftType, string> = {
  MORNING: '#4F46E5', // Indigo
  AFTERNOON: '#059669', // Emerald
  EVENING: '#DC2626', // Red
};

// Labels para status de pagamento
export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Em Atraso',
  CANCELLED: 'Cancelado',
};

// Cores para status de pagamento
export const PaymentStatusColors: Record<PaymentStatus, string> = {
  PENDING: '#F59E0B', // Amber
  PAID: '#10B981', // Emerald
  OVERDUE: '#EF4444', // Red
  CANCELLED: '#6B7280', // Gray
};

// Meses em português
export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

// ================================
// HELPER FUNCTIONS
// ================================

// Helper para formatar valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper para formatar percentual
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Helper para formatar números grandes
export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Helper para calcular crescimento
export const calculateGrowth = (current: number, previous: number): TemporalComparison => {
  const growth = current - previous;
  const growthPercentage = previous === 0 ? 0 : (growth / previous) * 100;
  
  let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
  if (Math.abs(growthPercentage) >= 1) {
    trend = growthPercentage > 0 ? 'UP' : 'DOWN';
  }

  return {
    current,
    previous,
    growth,
    growthPercentage,
    trend,
  };
};

// Helper para obter cor da tendência
export const getTrendColor = (trend: 'UP' | 'DOWN' | 'STABLE'): string => {
  switch (trend) {
    case 'UP': return '#10B981'; // Green
    case 'DOWN': return '#EF4444'; // Red
    case 'STABLE': return '#6B7280'; // Gray
  }
};

// Helper para obter ícone da tendência
export const getTrendIcon = (trend: 'UP' | 'DOWN' | 'STABLE'): string => {
  switch (trend) {
    case 'UP': return '↗️';
    case 'DOWN': return '↘️';
    case 'STABLE': return '➡️';
  }
};

// Helper para validar filtros
export const validateFilters = (filters: FilterAnalyticsDto): string[] => {
  const errors: string[] = [];

  if (filters.year && (filters.year < 2020 || filters.year > 2030)) {
    errors.push('Ano deve estar entre 2020 e 2030');
  }

  if (filters.month && (filters.month < 1 || filters.month > 12)) {
    errors.push('Mês deve estar entre 1 e 12');
  }

  if (filters.classId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.classId)) {
    errors.push('ID da turma deve ser um UUID válido');
  }

  if (filters.disciplineId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.disciplineId)) {
    errors.push('ID da disciplina deve ser um UUID válido');
  }

  return errors;
};

// Helper para gerar cores do gráfico
export const generateChartColors = (count: number): string[] => {
  const baseColors = [
    '#4F46E5', '#059669', '#DC2626', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#10B981', '#F97316', '#EC4899', '#84CC16'
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
};

// Helper para converter MetricItem para dados de gráfico
export const metricsToChartData = (metrics: MetricItem[]): any[] => {
  return metrics.map(metric => ({
    name: metric.label,
    value: metric.value,
    fill: metric.color || '#4F46E5',
    percentage: metric.percentage,
  }));
};

// Helper para agrupar dados por período
export const groupByPeriod = (data: any[], dateField: string, period: 'month' | 'week' | 'day'): Record<string, any[]> => {
  return data.reduce((acc, item) => {
    const date = new Date(item[dateField]);
    let key: string;
    
    switch (period) {
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'week':
        const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
        key = startOfWeek.toISOString().split('T')[0];
        break;
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
    }
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    
    return acc;
  }, {} as Record<string, any[]>);
};

// Helper para calcular taxa de crescimento Year-over-Year
export const calculateYoYGrowth = (currentYearData: number[], previousYearData: number[]): number => {
  const currentTotal = currentYearData.reduce((sum, val) => sum + val, 0);
  const previousTotal = previousYearData.reduce((sum, val) => sum + val, 0);
  
  if (previousTotal === 0) return 0;
  return ((currentTotal - previousTotal) / previousTotal) * 100;
};

// Configurações padrão do sistema
export const ANALYTICS_CONFIG = {
  cacheTimeout: 10 * 60 * 1000, // 10 minutos
  refreshInterval: 5 * 60 * 1000, // 5 minutos
  maxChartDataPoints: 50,
  defaultYear: new Date().getFullYear(),
  supportedExportFormats: ['PDF', 'EXCEL', 'CSV'] as const,
  criticalAttendanceThreshold: 75, // Porcentagem
  criticalGradeThreshold: 10, // Nota mínima
  excellentGradeThreshold: 16, // Nota excelente
} as const;