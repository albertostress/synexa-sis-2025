/**
 * Tipos para módulo Transport - Sistema de Transporte Escolar Angolano
 * Alinhado com backend NestJS + Prisma
 */

// Status das rotas de transporte
export type RouteStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

// Interface principal de rota de transporte
export interface TransportRoute {
  id: string;
  name: string;
  driverName: string;
  vehicle: string;
  departure: string; // HH:mm format
  returnTime: string; // HH:mm format
  stops: RouteStop[];
  createdAt: string;
  students?: StudentTransport[];
}

// Interface para paragem da rota
export interface RouteStop {
  name: string;
  order: number;
}

// Interface para atribuição de aluno ao transporte
export interface StudentTransport {
  id: string;
  studentId: string;
  routeId: string;
  stopName: string;
  notes?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
    schoolClass?: {
      id: string;
      name: string;
      academicYear: string;
    };
  };
  route?: TransportRoute;
}

// Interface para criar nova rota
export interface CreateRouteDto {
  name: string;
  driverName: string;
  vehicle: string;
  departure: string; // HH:mm
  returnTime: string; // HH:mm
  stops: RouteStop[];
}

// Interface para atualizar rota
export interface UpdateRouteDto {
  name?: string;
  driverName?: string;
  vehicle?: string;
  departure?: string;
  returnTime?: string;
  stops?: RouteStop[];
}

// Interface para atribuir aluno à rota
export interface AssignStudentDto {
  studentId: string;
  stopName: string;
  notes?: string;
}

// Interface para atribuir múltiplos alunos
export interface AssignMultipleStudentsDto {
  students: AssignStudentDto[];
}

// Interface para atualizar transporte do aluno
export interface UpdateStudentTransportDto {
  routeId?: string;
  stopName?: string;
  notes?: string;
}

// Interface para filtros de rotas
export interface RouteFilters {
  routeName?: string;
  driverName?: string;
  vehicle?: string;
  departure?: string;
  returnTime?: string;
  stopName?: string;
  page?: number;
  limit?: number;
}

// Interface para filtros de alunos no transporte
export interface StudentTransportFilters {
  studentName?: string;
  className?: string;
  routeName?: string;
  stopName?: string;
  page?: number;
  limit?: number;
}

// Interface para lista paginada de rotas
export interface RouteListResponse {
  data: TransportRoute[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface para lista paginada de alunos no transporte
export interface StudentTransportListResponse {
  data: StudentTransport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface para estatísticas do transporte
export interface TransportStats {
  totalRoutes: number;
  activeRoutes: number;
  totalStudents: number;
  totalStops: number;
  averageStudentsPerRoute: number;
  mostPopularRoute?: {
    route: TransportRoute;
    studentCount: number;
  };
  utilization: {
    routeId: string;
    routeName: string;
    studentCount: number;
    stopCount: number;
  }[];
}

// Labels traduzidos para português angolano
export const RouteStatusLabels: Record<RouteStatus, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  MAINTENANCE: 'Manutenção',
};

// Cores para badges de status
export const RouteStatusColors: Record<RouteStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

// Horários típicos para escolas angolanas
export const SCHOOL_SCHEDULES = [
  { label: 'Manhã - Saída', time: '07:00' },
  { label: 'Manhã - Saída', time: '07:30' },
  { label: 'Manhã - Saída', time: '08:00' },
  { label: 'Tarde - Retorno', time: '12:00' },
  { label: 'Tarde - Retorno', time: '12:30' },
  { label: 'Tarde - Retorno', time: '13:00' },
  { label: 'Tarde - Saída', time: '13:30' },
  { label: 'Tarde - Saída', time: '14:00' },
  { label: 'Tarde - Retorno', time: '17:00' },
  { label: 'Tarde - Retorno', time: '17:30' },
  { label: 'Tarde - Retorno', time: '18:00' },
] as const;

// Tipos de veículos comuns em Angola
export const VEHICLE_TYPES = [
  'Autocarro Escolar',
  'Minibus',
  'Van Escolar',
  'Hiace',
  'Coaster',
  'Outros',
] as const;

// Paragens comuns em Luanda (exemplo)
export const COMMON_STOPS_LUANDA = [
  'Praça da Independência',
  'Marginal de Luanda',
  'Bairro Maianga',
  'Bairro Rangel',
  'Bairro Ingombota',
  'Cidadela',
  'Mutamba',
  'Alvalade',
  'Maculusso',
  'Talatona',
  'Benfica',
  'Camama',
  'Viana',
  'Cacuaco',
  'Belas',
] as const;

// Helper para validar horário
export const validateTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Helper para formatar horário
export const formatTime = (time: string): string => {
  if (!validateTime(time)) return time;
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

// Helper para calcular duração da viagem
export const calculateTripDuration = (departure: string, returnTime: string): string => {
  if (!validateTime(departure) || !validateTime(returnTime)) return 'N/A';
  
  const [depHours, depMinutes] = departure.split(':').map(Number);
  const [retHours, retMinutes] = returnTime.split(':').map(Number);
  
  const depTotal = depHours * 60 + depMinutes;
  const retTotal = retHours * 60 + retMinutes;
  
  const diffMinutes = retTotal - depTotal;
  if (diffMinutes <= 0) return 'N/A';
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours === 0) return `${minutes}min`;
  return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
};

// Helper para validar ordem das paragens
export const validateStopsOrder = (stops: RouteStop[]): boolean => {
  const orders = stops.map(stop => stop.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) return false;
  }
  return true;
};

// Helper para ordenar paragens
export const sortStopsByOrder = (stops: RouteStop[]): RouteStop[] => {
  return [...stops].sort((a, b) => a.order - b.order);
};

// Helper para formatar nome do aluno
export const formatStudentName = (studentTransport: StudentTransport): string => {
  if (studentTransport.student) {
    return `${studentTransport.student.firstName} ${studentTransport.student.lastName}`;
  }
  return 'Aluno Desconhecido';
};

// Helper para formatar identificador do aluno
export const formatStudentIdentifier = (studentTransport: StudentTransport): string => {
  if (studentTransport.student) {
    return studentTransport.student.studentNumber;
  }
  return '';
};

// Helper para formatar turma do aluno
export const formatStudentClass = (studentTransport: StudentTransport): string => {
  if (studentTransport.student?.schoolClass) {
    return `${studentTransport.student.schoolClass.name} (${studentTransport.student.schoolClass.academicYear})`;
  }
  return 'Sem Turma';
};

// Helper para calcular capacidade da rota
export const calculateRouteUtilization = (route: TransportRoute, maxCapacity: number = 50): {
  percentage: number;
  status: 'low' | 'medium' | 'high' | 'full';
  color: string;
} => {
  const studentCount = route.students?.length || 0;
  const percentage = Math.round((studentCount / maxCapacity) * 100);
  
  let status: 'low' | 'medium' | 'high' | 'full';
  let color: string;
  
  if (percentage >= 100) {
    status = 'full';
    color = 'bg-red-100 text-red-800 border-red-200';
  } else if (percentage >= 80) {
    status = 'high';
    color = 'bg-orange-100 text-orange-800 border-orange-200';
  } else if (percentage >= 50) {
    status = 'medium';
    color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else {
    status = 'low';
    color = 'bg-green-100 text-green-800 border-green-200';
  }
  
  return { percentage, status, color };
};

// Helper para verificar conflitos de horário
export const hasTimeConflict = (departure1: string, return1: string, departure2: string, return2: string): boolean => {
  if (!validateTime(departure1) || !validateTime(return1) || !validateTime(departure2) || !validateTime(return2)) {
    return false;
  }
  
  const dep1 = departure1.split(':').map(Number);
  const ret1 = return1.split(':').map(Number);
  const dep2 = departure2.split(':').map(Number);
  const ret2 = return2.split(':').map(Number);
  
  const start1 = dep1[0] * 60 + dep1[1];
  const end1 = ret1[0] * 60 + ret1[1];
  const start2 = dep2[0] * 60 + dep2[1];
  const end2 = ret2[0] * 60 + ret2[1];
  
  return (start1 < end2 && end1 > start2);
};

// Configurações do sistema de transporte
export const TRANSPORT_CONFIG = {
  defaultCapacity: 50,
  maxStopsPerRoute: 10,
  minTripDurationMinutes: 30,
  maxTripDurationHours: 8,
  workingHoursStart: '06:00',
  workingHoursEnd: '20:00',
} as const;

// Interface para configurações personalizáveis
export interface TransportSettings {
  defaultCapacity: number;
  maxStopsPerRoute: number;
  requireStudentNotes: boolean;
  allowMultipleRoutes: boolean;
  enableRouteOptimization: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  minTripDurationMinutes: number;
  maxTripDurationHours: number;
}

// Interface para relatório de transporte
export interface TransportReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRoutes: number;
    activeRoutes: number;
    totalStudents: number;
    averageUtilization: number;
  };
  routeDetails: Array<{
    route: TransportRoute;
    studentCount: number;
    utilization: number;
    efficiency: 'excellent' | 'good' | 'average' | 'poor';
  }>;
  recommendations: string[];
}

// Meses do ano em português
export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

// Helper para obter nome do mês
export const getMonthName = (month: number): string => {
  return MONTHS_PT[month - 1] || '';
};

// Dias da semana em português
export const WEEKDAYS_PT = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
] as const;

// Helper para obter nome do dia da semana
export const getWeekdayName = (day: number): string => {
  return WEEKDAYS_PT[day] || '';
};