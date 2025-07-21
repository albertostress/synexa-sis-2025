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
  GraduationCap, 
  DollarSign, 
  Calendar,
  TrendingUp,
  TrendingDown,
  UserPlus,
  FileText,
  Activity,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Target,
  Award,
  CreditCard,
  UserCheck,
  School,
  Bus,
  BookMarked,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { analyticsAPI, financialAPI, attendanceAPI, communicationAPI, eventsAPI, libraryAPI } from '@/lib/api';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber,
  calculateGrowth,
  getTrendColor,
  getTrendIcon,
  MONTHS_PT
} from '@/types/analytics';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: () => void;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'document' | 'user' | 'payment' | 'event' | 'message' | 'enrollment';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'pending' | 'warning' | 'error';
}

export function AdminDashboardIntegrated() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Query para overview analytics
  const { 
    data: overviewData, 
    isLoading: overviewLoading, 
    error: overviewError,
    refetch: refetchOverview 
  } = useQuery({
    queryKey: ['dashboard', 'overview', selectedYear],
    queryFn: () => analyticsAPI.getOverview({ year: selectedYear }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para attendance analytics
  const { 
    data: attendanceData, 
    isLoading: attendanceLoading,
  } = useQuery({
    queryKey: ['dashboard', 'attendance', selectedYear],
    queryFn: () => analyticsAPI.getAttendanceAnalytics({ year: selectedYear }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para financial analytics
  const { 
    data: financeData, 
    isLoading: financeLoading,
  } = useQuery({
    queryKey: ['dashboard', 'finance', selectedYear],
    queryFn: () => analyticsAPI.getFinanceAnalytics({ year: selectedYear }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para grades analytics
  const { 
    data: gradesData, 
    isLoading: gradesLoading,
  } = useQuery({
    queryKey: ['dashboard', 'grades', selectedYear],
    queryFn: () => analyticsAPI.getGradesAnalytics({ year: selectedYear }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para próximos eventos
  const { 
    data: eventsData, 
    isLoading: eventsLoading,
  } = useQuery({
    queryKey: ['dashboard', 'events'],
    queryFn: () => eventsAPI.getEvents({ futureOnly: true, limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para mensagens não lidas
  const { 
    data: messagesData, 
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ['dashboard', 'messages'],
    queryFn: () => communicationAPI.getInbox({ unread: true, limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para atividades recentes (simulado por enquanto)
  const { data: recentActivities } = useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: async () => {
      // Simulação de atividades recentes
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'document',
          title: 'Boletim gerado',
          description: '15 boletins do 2º trimestre foram gerados',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          status: 'success'
        },
        {
          id: '2',
          type: 'enrollment',
          title: 'Nova matrícula',
          description: 'João Silva matriculado na 10ª Classe',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          status: 'success'
        },
        {
          id: '3',
          type: 'payment',
          title: 'Pagamento pendente',
          description: '12 faturas aguardando pagamento',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          status: 'warning'
        },
        {
          id: '4',
          type: 'event',
          title: 'Evento próximo',
          description: 'Reunião de pais em 3 dias',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
          status: 'pending'
        },
        {
          id: '5',
          type: 'message',
          title: 'Nova mensagem',
          description: 'Secretaria enviou comunicado importante',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
          status: 'pending'
        }
      ];
      return activities;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }, 5 * 60 * 1000); // 5 minutos

      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, queryClient]);

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'new-student',
      title: 'Novo Aluno',
      description: 'Matricular novo aluno',
      icon: UserPlus,
      action: () => navigate('/students?action=new'),
      color: 'bg-blue-500'
    },
    {
      id: 'generate-report',
      title: 'Gerar Relatório',
      description: 'Relatórios e análises',
      icon: FileText,
      action: () => navigate('/analytics'),
      color: 'bg-green-500'
    },
    {
      id: 'new-invoice',
      title: 'Nova Fatura',
      description: 'Criar fatura',
      icon: CreditCard,
      action: () => navigate('/financial?action=new'),
      color: 'bg-purple-500'
    },
    {
      id: 'send-message',
      title: 'Enviar Comunicado',
      description: 'Mensagem em massa',
      icon: MessageSquare,
      action: () => navigate('/communication?action=compose'),
      color: 'bg-orange-500'
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'user': return <UserPlus className="w-4 h-4" />;
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'enrollment': return <UserCheck className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Agora mesmo';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Há ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Há ${days}d`;
  };

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
              {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1 text-red-600" />}
              {trend === 'stable' && <Activity className="w-3 h-3 mr-1 text-gray-600" />}
              <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : ''}>
                {change}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const isLoading = overviewLoading || attendanceLoading || financeLoading || gradesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui está o resumo da sua escola.
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

          <Button onClick={() => navigate('/analytics')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics Completo
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {overviewError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados. Por favor, tente novamente.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => refetchOverview()}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Alunos"
          value={overviewData?.totalStudents || 0}
          icon={Users}
          trend="up"
          change="+5% este mês"
          loading={isLoading}
        />
        <KPICard
          title="Taxa de Frequência"
          value={formatPercentage(overviewData?.attendanceRate || 0)}
          icon={Calendar}
          trend={overviewData?.attendanceRate >= 85 ? "up" : "down"}
          change={`${overviewData?.attendanceRate >= 85 ? '+' : '-'}2% esta semana`}
          loading={isLoading}
        />
        <KPICard
          title="Taxa de Adimplência"
          value={formatPercentage(overviewData?.paymentRate || 0)}
          icon={DollarSign}
          trend={overviewData?.paymentRate >= 80 ? "up" : "down"}
          change={`${overviewData?.paymentRate >= 80 ? '+' : '-'}3% este mês`}
          loading={isLoading}
        />
        <KPICard
          title="Taxa de Aprovação"
          value={formatPercentage(gradesData?.approvalRate || 0)}
          icon={Award}
          trend={gradesData?.approvalRate >= 70 ? "up" : "down"}
          change="Último trimestre"
          loading={isLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse as funcionalidades mais utilizadas</CardDescription>
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

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Receita</CardTitle>
            <CardDescription>Evolução mensal da receita</CardDescription>
          </CardHeader>
          <CardContent>
            {financeLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : financeData && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={financeData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Enrollment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Turno</CardTitle>
            <CardDescription>Alunos matriculados por período</CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : overviewData && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={overviewData.enrollmentsByShift}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ label, percentage }) => `${label}: ${percentage}%`}
                    outerRadius={100}
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity and Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas ações no sistema</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/activities')}>
              Ver tudo
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities?.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${getStatusColor(activity.status)} bg-opacity-10`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximos Eventos</CardTitle>
              <CardDescription>Agenda da escola</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {eventsData?.events.slice(0, 3).map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.date).toLocaleDateString('pt-AO')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>Saúde do Sistema</CardTitle>
          <CardDescription>Indicadores de performance e alertas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Frequência Crítica</span>
                <Badge variant={attendanceData?.criticalAttendanceCount > 10 ? "destructive" : "default"}>
                  {attendanceData?.criticalAttendanceCount || 0} alunos
                </Badge>
              </div>
              <Progress value={100 - (attendanceData?.criticalAttendanceCount || 0)} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Faturas Pendentes</span>
                <Badge variant={financeData?.pendingInvoices > 20 ? "destructive" : "default"}>
                  {financeData?.pendingInvoices || 0}
                </Badge>
              </div>
              <Progress 
                value={100 - ((financeData?.pendingInvoices || 0) / 50 * 100)} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Mensagens Não Lidas</span>
                <Badge variant={messagesData?.pagination.total > 10 ? "destructive" : "default"}>
                  {messagesData?.pagination.total || 0}
                </Badge>
              </div>
              <Progress 
                value={100 - ((messagesData?.pagination.total || 0) / 20 * 100)} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Taxa de Sistema</span>
                <Badge variant="default" className="bg-green-500">
                  98.5% Online
                </Badge>
              </div>
              <Progress value={98.5} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}