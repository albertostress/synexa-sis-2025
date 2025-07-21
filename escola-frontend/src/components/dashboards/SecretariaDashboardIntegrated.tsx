import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  UserPlus,
  CreditCard,
  Clock,
  TrendingUp,
  Calendar,
  FileText,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  UserCheck,
  DollarSign,
  School,
  ArrowRight,
  Activity,
  CheckCircle,
  XCircle,
  BookOpen
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { analyticsAPI, financialAPI, enrollmentAPI, attendanceAPI } from '@/lib/api';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber,
  PaymentStatusColors,
  ShiftLabels
} from '@/types/analytics';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: () => void;
  color: string;
}

export function SecretariaDashboardIntegrated() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Query para matriculation analytics
  const { 
    data: matriculationData, 
    isLoading: matriculationLoading, 
    error: matriculationError,
    refetch: refetchMatriculation 
  } = useQuery({
    queryKey: ['secretaria', 'matriculation', selectedYear],
    queryFn: () => analyticsAPI.getMatriculationAnalytics({ year: selectedYear }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para attendance analytics
  const { 
    data: attendanceData, 
    isLoading: attendanceLoading,
  } = useQuery({
    queryKey: ['secretaria', 'attendance', selectedYear],
    queryFn: () => analyticsAPI.getAttendanceAnalytics({ year: selectedYear }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para financial analytics
  const { 
    data: financeData, 
    isLoading: financeLoading,
  } = useQuery({
    queryKey: ['secretaria', 'finance', selectedYear],
    queryFn: () => analyticsAPI.getFinanceAnalytics({ year: selectedYear }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para overview básico
  const { 
    data: overviewData, 
    isLoading: overviewLoading,
  } = useQuery({
    queryKey: ['secretaria', 'overview', selectedYear],
    queryFn: () => analyticsAPI.getOverview({ year: selectedYear }),
    staleTime: 5 * 60 * 1000,
  });

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['secretaria'] });
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, queryClient]);

  // Quick Actions para Secretaria
  const quickActions: QuickAction[] = [
    {
      id: 'new-enrollment',
      title: 'Nova Matrícula',
      description: 'Matricular novo aluno',
      icon: UserPlus,
      action: () => navigate('/enrollments?action=new'),
      color: 'bg-blue-500'
    },
    {
      id: 'process-payment',
      title: 'Processar Pagamento',
      description: 'Registrar pagamento',
      icon: CreditCard,
      action: () => navigate('/financial?action=payment'),
      color: 'bg-green-500'
    },
    {
      id: 'attendance-report',
      title: 'Relatório Frequência',
      description: 'Visualizar presenças',
      icon: Calendar,
      action: () => navigate('/attendance'),
      color: 'bg-purple-500'
    },
    {
      id: 'student-document',
      title: 'Emitir Documento',
      description: 'Gerar declaração',
      icon: FileText,
      action: () => navigate('/documents'),
      color: 'bg-orange-500'
    },
  ];

  const KPICard = ({ title, value, icon: Icon, trend, change, loading = false }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down' | 'stable';
    change?: string;
    loading?: boolean;
  }) => {
    if (loading) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change && trend && (
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1 text-green-600" />}
              {trend === 'down' && <Activity className="w-3 h-3 mr-1 text-red-600" />}
              <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : ''}>
                {change}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const isLoading = matriculationLoading || attendanceLoading || financeLoading || overviewLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Secretaria</h1>
          <p className="text-muted-foreground">
            Gestão de matrículas, pagamentos e documentação.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {matriculationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados. Por favor, tente novamente.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => refetchMatriculation()}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs específicos para Secretaria */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Matrículas"
          value={matriculationData?.totalEnrollments || 0}
          icon={Users}
          trend="up"
          change={`+${matriculationData?.yearOverYearGrowth || 0}% este ano`}
          loading={isLoading}
        />
        <KPICard
          title="Taxa de Renovação"
          value={formatPercentage(matriculationData?.renewalRate || 0)}
          icon={UserCheck}
          trend={matriculationData?.renewalRate >= 80 ? "up" : "down"}
          change="Período letivo"
          loading={isLoading}
        />
        <KPICard
          title="Taxa de Adimplência"
          value={formatPercentage(financeData?.totalReceived / financeData?.totalBilled * 100 || 0)}
          icon={CreditCard}
          trend={financeData && (financeData.totalReceived / financeData.totalBilled) >= 0.8 ? "up" : "down"}
          change={`${financeData?.pendingInvoices || 0} pendentes`}
          loading={isLoading}
        />
        <KPICard
          title="Frequência Média"
          value={formatPercentage(attendanceData?.overallAttendanceRate || 0)}
          icon={Calendar}
          trend={attendanceData?.overallAttendanceRate >= 85 ? "up" : "down"}
          change="Este mês"
          loading={isLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Funcionalidades mais utilizadas pela secretaria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto flex-col py-4 hover:shadow-md transition-all"
                onClick={action.action}
              >
                <div className={`${action.color} rounded-full p-3 mb-2`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">{action.title}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matriculation Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Matrículas</CardTitle>
            <CardDescription>Evolução mensal das matrículas</CardDescription>
          </CardHeader>
          <CardContent>
            {matriculationLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : matriculationData && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={matriculationData.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status de Pagamentos</CardTitle>
            <CardDescription>Distribuição atual dos pagamentos</CardDescription>
          </CardHeader>
          <CardContent>
            {financeLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : financeData && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={financeData.paymentStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ label, value }) => `${label}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {financeData.paymentStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollment by Shift */}
        <Card>
          <CardHeader>
            <CardTitle>Matrículas por Turno</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            {matriculationLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : matriculationData && (
              <div className="space-y-3">
                {matriculationData.enrollmentsByShift.map((shift, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{shift.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{shift.value}</span>
                      <Badge variant="outline">
                        {shift.percentage?.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Gênero</CardTitle>
            <CardDescription>Alunos matriculados</CardDescription>
          </CardHeader>
          <CardContent>
            {matriculationLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : matriculationData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">Masculino</p>
                    <p className="text-sm text-blue-600">
                      {formatPercentage((matriculationData.genderDistribution.male / matriculationData.totalEnrollments) * 100)}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-blue-900">
                    {matriculationData.genderDistribution.male}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                  <div>
                    <p className="font-medium text-pink-900">Feminino</p>
                    <p className="text-sm text-pink-600">
                      {formatPercentage((matriculationData.genderDistribution.female / matriculationData.totalEnrollments) * 100)}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-pink-900">
                    {matriculationData.genderDistribution.female}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Frequência</CardTitle>
            <CardDescription>Indicadores de presença</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : attendanceData && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa Geral</span>
                  <Badge variant={attendanceData.overallAttendanceRate >= 85 ? "default" : "destructive"}>
                    {formatPercentage(attendanceData.overallAttendanceRate)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Alunos Críticos</span>
                  <Badge variant={attendanceData.criticalAttendanceCount > 15 ? "destructive" : "default"}>
                    {attendanceData.criticalAttendanceCount}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Faltas Justificadas</span>
                  <span className="text-sm font-medium">
                    {attendanceData.absenceDistribution.justified}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Faltas Não Justificadas</span>
                  <span className="text-sm font-medium">
                    {attendanceData.absenceDistribution.unjustified}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>Indicadores de receita e pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          {financeLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : financeData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Total Faturado</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(financeData.totalBilled)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Total Recebido</p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatCurrency(financeData.totalReceived)}
                </p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-600">Faturas Pendentes</p>
                <p className="text-2xl font-bold text-amber-800">
                  {financeData.pendingInvoices}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600">Projeção</p>
                <p className="text-2xl font-bold text-purple-800">
                  {formatCurrency(financeData.nextMonthProjection)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Navegação Rápida</CardTitle>
          <CardDescription>Acesso direto às principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="ghost" 
              className="justify-start h-auto py-3"
              onClick={() => navigate('/students')}
            >
              <Users className="w-4 h-4 mr-2" />
              Alunos
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start h-auto py-3"
              onClick={() => navigate('/classes')}
            >
              <School className="w-4 h-4 mr-2" />
              Turmas
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start h-auto py-3"
              onClick={() => navigate('/enrollments')}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Matrículas
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start h-auto py-3"
              onClick={() => navigate('/financial')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Financeiro
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start h-auto py-3"
              onClick={() => navigate('/attendance')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Frequência
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start h-auto py-3"
              onClick={() => navigate('/documents')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Documentos
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start h-auto py-3"
              onClick={() => navigate('/communication')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Comunicação
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start h-auto py-3"
              onClick={() => navigate('/reports')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Relatórios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}