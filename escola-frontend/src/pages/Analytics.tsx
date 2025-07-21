
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, DonutChart, AreaChart, Area 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Download, TrendingUp, TrendingDown, Users, BookOpen, DollarSign, 
  Calendar, RefreshCw, Filter, AlertCircle, BarChart3, PieChart as PieChartIcon,
  Target, Award, Clock, ChevronUp, ChevronDown, Minus 
} from 'lucide-react';

import { analyticsAPI } from '@/lib/api';
import { 
  FilterAnalyticsDto, 
  OverviewResponse, 
  AttendanceAnalyticsResponse, 
  GradesAnalyticsResponse, 
  FinanceAnalyticsResponse, 
  MatriculationAnalyticsResponse,
  formatCurrency, 
  formatPercentage, 
  formatNumber,
  calculateGrowth,
  getTrendColor,
  getTrendIcon,
  metricsToChartData,
  ShiftLabels,
  PaymentStatusColors,
  MONTHS_PT
} from '@/types/analytics';

export default function Analytics() {
  const { user } = useAuth();

  // Verificar permissões: SECRETARIA não tem acesso ao Analytics
  if (user?.role === 'SECRETARIA') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Você não tem permissão para acessar o módulo de Analytics.
            </p>
            <p className="text-sm text-gray-500">
              Este módulo é restrito para roles ADMIN e DIRETOR.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estados para filtros
  const [filters, setFilters] = useState<FilterAnalyticsDto>({
    year: new Date().getFullYear(),
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const queryClient = useQueryClient();

  // Queries para cada seção de analytics
  const { 
    data: overviewData, 
    isLoading: overviewLoading, 
    error: overviewError,
    refetch: refetchOverview 
  } = useQuery({
    queryKey: ['analytics', 'overview', filters],
    queryFn: () => analyticsAPI.getOverview(filters),
    enabled: activeTab === 'overview',
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { 
    data: attendanceData, 
    isLoading: attendanceLoading, 
    error: attendanceError,
    refetch: refetchAttendance 
  } = useQuery({
    queryKey: ['analytics', 'attendance', filters],
    queryFn: () => analyticsAPI.getAttendanceAnalytics(filters),
    enabled: activeTab === 'attendance',
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: gradesData, 
    isLoading: gradesLoading, 
    error: gradesError,
    refetch: refetchGrades 
  } = useQuery({
    queryKey: ['analytics', 'grades', filters],
    queryFn: () => analyticsAPI.getGradesAnalytics(filters),
    enabled: activeTab === 'grades',
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: financeData, 
    isLoading: financeLoading, 
    error: financeError,
    refetch: refetchFinance 
  } = useQuery({
    queryKey: ['analytics', 'finance', filters],
    queryFn: () => analyticsAPI.getFinanceAnalytics(filters),
    enabled: activeTab === 'finance',
    staleTime: 5 * 60 * 1000,
  });

  const { 
    data: matriculationData, 
    isLoading: matriculationLoading, 
    error: matriculationError,
    refetch: refetchMatriculation 
  } = useQuery({
    queryKey: ['analytics', 'matriculation', filters],
    queryFn: () => analyticsAPI.getMatriculationAnalytics(filters),
    enabled: activeTab === 'matriculation',
    staleTime: 5 * 60 * 1000,
  });

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      }, 5 * 60 * 1000); // 5 minutos

      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, queryClient]);

  // Handlers para filtros
  const handleFilterChange = useCallback((key: keyof FilterAnalyticsDto, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ year: new Date().getFullYear() });
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);

  // Export handlers
  const handleExportReport = useCallback(async (type: 'overview' | 'attendance' | 'grades' | 'finance' | 'matriculation') => {
    try {
      switch (type) {
        case 'overview':
          await analyticsAPI.downloadOverviewReport(filters);
          break;
        case 'attendance':
          await analyticsAPI.downloadAttendanceReport(filters);
          break;
        case 'grades':
          await analyticsAPI.downloadGradesReport(filters);
          break;
        case 'finance':
          await analyticsAPI.downloadFinanceReport(filters);
          break;
        case 'matriculation':
          await analyticsAPI.downloadMatriculationReport(filters);
          break;
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  }, [filters]);

  // Componente para métricas KPI
  const KPICard = ({ title, value, change, trend, icon: Icon, color = 'blue' }: {
    title: string;
    value: string | number;
    change?: number;
    trend?: 'UP' | 'DOWN' | 'STABLE';
    icon: any;
    color?: string;
  }) => {
    const trendIcon = trend ? getTrendIcon(trend) : '';
    const trendColor = trend ? getTrendColor(trend) : '#6B7280';
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 text-muted-foreground`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && trend && (
            <p className="text-xs text-muted-foreground flex items-center">
              <span style={{ color: trendColor }}>{trendIcon}</span>
              <span className="ml-1" style={{ color: trendColor }}>
                {change > 0 ? '+' : ''}{formatPercentage(change)} em relação ao período anterior
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Componente para loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Componente para error
  const ErrorAlert = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{analyticsAPI.formatApiError(error)}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Avançados</h1>
          <p className="text-muted-foreground">Visão completa e métricas da escola em tempo real</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Filtros */}
          <Select 
            value={filters.year?.toString() || ''} 
            onValueChange={(value) => handleFilterChange('year', parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.shift || ''} 
            onValueChange={(value) => handleFilterChange('shift', value || undefined)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os turnos</SelectItem>
              {Object.entries(ShiftLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleResetFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Limpar
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>

          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs de navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Frequência
          </TabsTrigger>
          <TabsTrigger value="grades" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Notas
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="matriculation" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Matrículas
          </TabsTrigger>
        </TabsList>

        {/* TAB: VISÃO GERAL */}
        <TabsContent value="overview" className="space-y-6">
          {overviewError && <ErrorAlert error={overviewError} onRetry={refetchOverview} />}
          
          {overviewLoading ? <LoadingSkeleton /> : overviewData && (
            <>
              {/* KPIs principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  title="Total de Alunos"
                  value={overviewData.totalStudents}
                  icon={Users}
                />
                <KPICard
                  title="Total de Professores"
                  value={overviewData.totalTeachers}
                  icon={BookOpen}
                />
                <KPICard
                  title="Taxa de Frequência"
                  value={formatPercentage(overviewData.attendanceRate)}
                  icon={Calendar}
                />
                <KPICard
                  title="Taxa de Adimplência"
                  value={formatPercentage(overviewData.paymentRate)}
                  icon={DollarSign}
                />
              </div>

              {/* Gráficos principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Distribuição por Turno</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleExportReport('overview')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metricsToChartData(overviewData.enrollmentsByShift)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {overviewData.enrollmentsByShift.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumo da Escola</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total de Turmas</span>
                        <span className="text-lg font-bold">{overviewData.totalClasses}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total de Disciplinas</span>
                        <span className="text-lg font-bold">{overviewData.totalSubjects}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Taxa de Frequência Geral</span>
                        <Badge variant={overviewData.attendanceRate >= 80 ? 'default' : 'destructive'}>
                          {formatPercentage(overviewData.attendanceRate)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Taxa de Adimplência</span>
                        <Badge variant={overviewData.paymentRate >= 70 ? 'default' : 'destructive'}>
                          {formatPercentage(overviewData.paymentRate)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB: FREQUÊNCIA */}
        <TabsContent value="attendance" className="space-y-6">
          {attendanceError && <ErrorAlert error={attendanceError} onRetry={refetchAttendance} />}
          
          {attendanceLoading ? <LoadingSkeleton /> : attendanceData && (
            <>
              {/* KPIs de frequência */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  title="Taxa de Frequência Geral"
                  value={formatPercentage(attendanceData.overallAttendanceRate)}
                  icon={Calendar}
                />
                <KPICard
                  title="Faltas Justificadas"
                  value={attendanceData.absenceDistribution.justified}
                  icon={Clock}
                />
                <KPICard
                  title="Faltas Não Justificadas"
                  value={attendanceData.absenceDistribution.unjustified}
                  icon={AlertCircle}
                />
                <KPICard
                  title="Alunos Críticos (<75%)"
                  value={attendanceData.criticalAttendanceCount}
                  icon={TrendingDown}
                />
              </div>

              {/* Gráficos de frequência */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Ranking de Turmas por Frequência</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleExportReport('attendance')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={attendanceData.classesByAttendance.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatPercentage(Number(value)), 'Frequência']} />
                        <Bar dataKey="value" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tendência Mensal de Frequência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={attendanceData.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatPercentage(Number(value)), 'Frequência']} />
                        <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB: NOTAS */}
        <TabsContent value="grades" className="space-y-6">
          {gradesError && <ErrorAlert error={gradesError} onRetry={refetchGrades} />}
          
          {gradesLoading ? <LoadingSkeleton /> : gradesData && (
            <>
              {/* KPIs de notas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  title="Média Geral"
                  value={gradesData.overallAverage.toFixed(1)}
                  icon={Award}
                />
                <KPICard
                  title="Taxa de Aprovação"
                  value={formatPercentage(gradesData.approvalRate)}
                  icon={TrendingUp}
                />
                <KPICard
                  title="Alunos Aprovados"
                  value={gradesData.statusDistribution.approved}
                  icon={Users}
                />
                <KPICard
                  title="Alunos em Recuperação"
                  value={gradesData.statusDistribution.recovery}
                  icon={AlertCircle}
                />
              </div>

              {/* Gráficos de notas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Média por Disciplina</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleExportReport('grades')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={gradesData.averageBySubject}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis domain={[0, 20]} />
                        <Tooltip formatter={(value) => [Number(value).toFixed(1), 'Média']} />
                        <Bar dataKey="value" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top 5 Turmas por Desempenho</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {gradesData.topPerformingClasses.map((classItem, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <span className="font-medium">{classItem.label}</span>
                          </div>
                          <span className="text-lg font-bold">{Number(classItem.value).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB: FINANCEIRO */}
        <TabsContent value="finance" className="space-y-6">
          {financeError && <ErrorAlert error={financeError} onRetry={refetchFinance} />}
          
          {financeLoading ? <LoadingSkeleton /> : financeData && (
            <>
              {/* KPIs financeiros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  title="Total Faturado"
                  value={formatCurrency(financeData.totalBilled)}
                  icon={DollarSign}
                />
                <KPICard
                  title="Total Recebido"
                  value={formatCurrency(financeData.totalReceived)}
                  icon={TrendingUp}
                />
                <KPICard
                  title="Taxa de Inadimplência"
                  value={formatPercentage(financeData.defaultRate)}
                  icon={AlertCircle}
                />
                <KPICard
                  title="Faturas Pendentes"
                  value={financeData.pendingInvoices}
                  icon={Clock}
                />
              </div>

              {/* Gráficos financeiros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Receita Mensal</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleExportReport('finance')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={financeData.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Receita']} />
                        <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Status de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metricsToChartData(financeData.paymentStatusDistribution)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {financeData.paymentStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Projeção */}
              <Card>
                <CardHeader>
                  <CardTitle>Projeção Financeira</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 mb-2">Projeção para próximo mês:</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(financeData.nextMonthProjection)}
                    </p>
                    <p className="text-xs text-blue-600">
                      Baseado na média dos últimos 3 meses
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB: MATRÍCULAS */}
        <TabsContent value="matriculation" className="space-y-6">
          {matriculationError && <ErrorAlert error={matriculationError} onRetry={refetchMatriculation} />}
          
          {matriculationLoading ? <LoadingSkeleton /> : matriculationData && (
            <>
              {/* KPIs de matrículas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  title="Total de Matrículas"
                  value={matriculationData.totalEnrollments}
                  icon={Users}
                />
                <KPICard
                  title="Crescimento Anual"
                  value={formatPercentage(matriculationData.yearOverYearGrowth)}
                  icon={TrendingUp}
                />
                <KPICard
                  title="Taxa de Renovação"
                  value={formatPercentage(matriculationData.renewalRate)}
                  icon={Target}
                />
                <KPICard
                  title="Alunos Masculinos"
                  value={matriculationData.genderDistribution.male}
                  icon={Users}
                />
              </div>

              {/* Gráficos de matrículas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Crescimento Mensal</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleExportReport('matriculation')}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={matriculationData.monthlyGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Turmas por Alunos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={matriculationData.enrollmentsByClass.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#06B6D4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Distribuição de gênero */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Gênero</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">Masculino</p>
                      <p className="text-3xl font-bold text-blue-800">
                        {matriculationData.genderDistribution.male}
                      </p>
                      <p className="text-xs text-blue-500">
                        {formatPercentage((matriculationData.genderDistribution.male / matriculationData.totalEnrollments) * 100)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                      <p className="text-sm text-pink-600">Feminino</p>
                      <p className="text-3xl font-bold text-pink-800">
                        {matriculationData.genderDistribution.female}
                      </p>
                      <p className="text-xs text-pink-500">
                        {formatPercentage((matriculationData.genderDistribution.female / matriculationData.totalEnrollments) * 100)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
