/**
 * Dashboard Metrics Responses - Classes de resposta para métricas
 * Estruturas padronizadas para dashboards
 */
import { ApiProperty } from '@nestjs/swagger';

// Estrutura base para métricas
export class MetricItem {
  @ApiProperty({
    description: 'Rótulo descritivo da métrica',
    example: 'Alunos Ativos',
  })
  label: string;

  @ApiProperty({
    description: 'Valor numérico da métrica',
    example: 250,
  })
  value: number;

  @ApiProperty({
    description: 'Cor opcional para visualização',
    example: '#4F46E5',
    required: false,
  })
  color?: string;

  @ApiProperty({
    description: 'Percentual opcional',
    example: 75.5,
    required: false,
  })
  percentage?: number;
}

// Resposta do overview geral
export class OverviewResponse {
  @ApiProperty({
    description: 'Total de alunos ativos',
    example: 250,
  })
  totalStudents: number;

  @ApiProperty({
    description: 'Total de professores',
    example: 25,
  })
  totalTeachers: number;

  @ApiProperty({
    description: 'Total de turmas',
    example: 12,
  })
  totalClasses: number;

  @ApiProperty({
    description: 'Total de disciplinas',
    example: 8,
  })
  totalSubjects: number;

  @ApiProperty({
    description: 'Matrículas por turno',
    type: [MetricItem],
    isArray: true,
  })
  enrollmentsByShift: MetricItem[];

  @ApiProperty({
    description: 'Taxa de frequência geral',
    example: 87.5,
  })
  attendanceRate: number;

  @ApiProperty({
    description: 'Taxa de adimplência',
    example: 82.3,
  })
  paymentRate: number;
}

// Resposta de análise de presença
export class AttendanceAnalyticsResponse {
  @ApiProperty({
    description: 'Média de frequência geral',
    example: 87.5,
  })
  overallAttendanceRate: number;

  @ApiProperty({
    description: 'Ranking de turmas por assiduidade',
    type: [MetricItem],
    isArray: true,
  })
  classesByAttendance: MetricItem[];

  @ApiProperty({
    description: 'Distribuição de faltas',
    type: 'object',
    properties: {
      justified: { type: 'number', example: 120 },
      unjustified: { type: 'number', example: 80 },
      total: { type: 'number', example: 200 },
    },
  })
  absenceDistribution: {
    justified: number;
    unjustified: number;
    total: number;
  };

  @ApiProperty({
    description: 'Tendência de frequência por mês',
    type: [MetricItem],
    isArray: true,
  })
  monthlyTrend: MetricItem[];

  @ApiProperty({
    description: 'Alunos com frequência crítica (<75%)',
    example: 15,
  })
  criticalAttendanceCount: number;
}

// Resposta de análise de notas
export class GradesAnalyticsResponse {
  @ApiProperty({
    description: 'Média global de notas',
    example: 7.2,
  })
  overallAverage: number;

  @ApiProperty({
    description: 'Média por disciplina',
    type: [MetricItem],
    isArray: true,
  })
  averageBySubject: MetricItem[];

  @ApiProperty({
    description: 'Distribuição por status final',
    type: 'object',
    properties: {
      approved: { type: 'number', example: 180 },
      failed: { type: 'number', example: 45 },
      recovery: { type: 'number', example: 25 },
    },
  })
  statusDistribution: {
    approved: number;
    failed: number;
    recovery: number;
  };

  @ApiProperty({
    description: 'Taxa de aprovação geral',
    example: 72.0,
  })
  approvalRate: number;

  @ApiProperty({
    description: 'Top 5 melhores médias por turma',
    type: [MetricItem],
    isArray: true,
  })
  topPerformingClasses: MetricItem[];
}

// Resposta de análise financeira
export class FinanceAnalyticsResponse {
  @ApiProperty({
    description: 'Valor total faturado',
    example: 250000.00,
  })
  totalBilled: number;

  @ApiProperty({
    description: 'Valor total recebido',
    example: 205000.00,
  })
  totalReceived: number;

  @ApiProperty({
    description: 'Taxa de inadimplência',
    example: 18.0,
  })
  defaultRate: number;

  @ApiProperty({
    description: 'Total de faturas pendentes',
    example: 67,
  })
  pendingInvoices: number;

  @ApiProperty({
    description: 'Receita por mês',
    type: [MetricItem],
    isArray: true,
  })
  monthlyRevenue: MetricItem[];

  @ApiProperty({
    description: 'Distribuição por status de pagamento',
    type: [MetricItem],
    isArray: true,
  })
  paymentStatusDistribution: MetricItem[];

  @ApiProperty({
    description: 'Previsão de receita próximo mês',
    example: 220000.00,
  })
  nextMonthProjection: number;
}

// Resposta de análise de matrículas
export class MatriculationAnalyticsResponse {
  @ApiProperty({
    description: 'Total de matrículas no ano atual',
    example: 250,
  })
  totalEnrollments: number;

  @ApiProperty({
    description: 'Matrículas por turno',
    type: [MetricItem],
    isArray: true,
  })
  enrollmentsByShift: MetricItem[];

  @ApiProperty({
    description: 'Matrículas por turma',
    type: [MetricItem],
    isArray: true,
  })
  enrollmentsByClass: MetricItem[];

  @ApiProperty({
    description: 'Crescimento mensal',
    type: [MetricItem],
    isArray: true,
  })
  monthlyGrowth: MetricItem[];

  @ApiProperty({
    description: 'Taxa de crescimento YoY',
    example: 15.5,
  })
  yearOverYearGrowth: number;

  @ApiProperty({
    description: 'Taxa de renovação de matrículas',
    example: 85.0,
  })
  renewalRate: number;

  @ApiProperty({
    description: 'Distribuição por sexo',
    type: 'object',
    properties: {
      male: { type: 'number', example: 130 },
      female: { type: 'number', example: 120 },
    },
  })
  genderDistribution: {
    male: number;
    female: number;
  };
}