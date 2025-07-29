import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  UserCheck,
  UserX,
  FileText,
  UserPlus,
  CreditCard,
  MessageSquare,
  CalendarPlus,
  Activity,
  ArrowRight,
  Clock,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Calendar,
  ScrollText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// APIs integradas com backend real
import { analyticsAPI } from '@/lib/api';
import { formatPercentage } from '@/types/analytics';
import type { OverviewResponse, AttendanceAnalyticsResponse, FinanceAnalyticsResponse } from '@/types/analytics';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: () => void;
  color: string;
}


export function AdminDashboardIntegrated() {
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Estados para dados reais do backend
  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceAnalyticsResponse | null>(null);
  const [financeData, setFinanceData] = useState<FinanceAnalyticsResponse | null>(null);
  
  // Estados de loading
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(true);
  
  // Estados de erro
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [financeError, setFinanceError] = useState<string | null>(null);

  // Função para buscar dados do overview
  const fetchOverviewData = async () => {
    try {
      setOverviewLoading(true);
      setOverviewError(null);
      const data = await analyticsAPI.getOverview();
      setOverviewData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do overview:', error);
      setOverviewError('Erro ao carregar dados gerais');
    } finally {
      setOverviewLoading(false);
    }
  };

  // Função para buscar dados de presenças
  const fetchAttendanceData = async () => {
    try {
      setAttendanceLoading(true);
      setAttendanceError(null);
      const data = await analyticsAPI.getAttendanceAnalytics();
      setAttendanceData(data);
    } catch (error) {
      console.error('Erro ao carregar dados de presenças:', error);
      setAttendanceError('Erro ao carregar dados de presenças');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Função para buscar dados financeiros
  const fetchFinanceData = async () => {
    try {
      setFinanceLoading(true);
      setFinanceError(null);
      const data = await analyticsAPI.getFinanceAnalytics();
      setFinanceData(data);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      setFinanceError('Erro ao carregar dados financeiros');
    } finally {
      setFinanceLoading(false);
    }
  };

  // Função para recarregar todos os dados
  const refetchAll = async () => {
    await Promise.all([
      fetchOverviewData(),
      fetchAttendanceData(),
      fetchFinanceData()
    ]);
  };


  // Carregar dados iniciais
  useEffect(() => {
    refetchAll();
  }, []);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        console.log('Refreshing dashboard data...');
        refetchAll();
      }, 5 * 60 * 1000); // 5 minutos

      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh]);

  // Quick Actions - Ações Rápidas e Frequentes
  const quickActions: QuickAction[] = [
    {
      id: 'new-student',
      title: '+ Novo Aluno',
      description: 'Matricular estudante',
      icon: UserPlus,
      action: () => navigate('/students?action=new'),
      color: 'bg-blue-500'
    },
    {
      id: 'generate-report',
      title: 'Gerar Relatório',
      description: 'Abrir tela de relatórios',
      icon: FileText,
      action: () => navigate('/analytics'),
      color: 'bg-green-500'
    },
    {
      id: 'new-invoice',
      title: 'Nova Fatura',
      description: 'Emitir nova fatura',
      icon: CreditCard,
      action: () => navigate('/financial?action=new'),
      color: 'bg-purple-500'
    },
    {
      id: 'new-event',
      title: 'Novo Evento',
      description: 'Criar evento no calendário',
      icon: CalendarPlus,
      action: () => navigate('/events?action=new'),
      color: 'bg-indigo-500'
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
        <Card className="min-h-[110px] hover:shadow-md transition-all duration-200 border-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center justify-between flex-col">
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="min-h-[110px] hover:shadow-md transition-all duration-200 border-muted bg-white/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center justify-between flex-col">
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

  const isLoading = overviewLoading || attendanceLoading || financeLoading;
  const hasErrors = overviewError || attendanceError || financeError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
          <p className="text-[14px] text-muted-foreground">
            Bem-vindo de volta! Aqui está o resumo do dia da sua escola.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            title="Atualização automática"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {overviewError && <div>• {overviewError}</div>}
            {attendanceError && <div>• {attendanceError}</div>}
            {financeError && <div>• {financeError}</div>}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2 mt-2"
              onClick={() => refetchAll()}
              disabled={isLoading}
            >
              {isLoading ? 'Carregando...' : 'Tentar novamente'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs Grid - Indicadores Essenciais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total de Alunos"
          value={overviewData?.totalStudents || 0}
          icon={GraduationCap}
          trend="up"
          change="+12 novos este mês"
          loading={overviewLoading}
        />
        <KPICard
          title="Alunos Ativos"
          value={overviewData?.totalStudents || 0}
          icon={UserCheck}
          trend="up"
          change={overviewData ? formatPercentage(overviewData.attendanceRate) + " do total" : "0% do total"}
          loading={overviewLoading}
        />
        <KPICard
          title="Taxa de Presenças"
          value={attendanceData ? formatPercentage(attendanceData.overallAttendanceRate) : "0%"}
          icon={UserX}
          trend="up"
          change={attendanceData?.criticalAttendanceCount ? `${attendanceData.criticalAttendanceCount} em risco` : "0 em risco"}
          loading={attendanceLoading}
        />
        <KPICard
          title="Faturas Pendentes"
          value={financeData?.pendingInvoices || 0}
          icon={ScrollText}
          trend="down"
          change={financeData ? `Taxa: ${formatPercentage(financeData.defaultRate)}` : "0% inadimplência"}
          loading={financeLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="mb-3">
          <h2 className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">Ações Rápidas</h2>
          <p className="text-[12px] text-muted-foreground">Acesse as funcionalidades mais utilizadas</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <div
              key={action.id}
              className="group cursor-pointer p-4 rounded-xl hover:bg-muted/30 transition-all duration-200 hover:shadow-sm border border-muted bg-white/60"
              onClick={action.action}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`${action.color} rounded-full p-2.5 group-hover:scale-105 transition-transform`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-medium text-[14px] block">{action.title}</span>
                  <span className="text-[12px] text-muted-foreground">{action.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Cards Horizontais - Informações Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card 
          className="rounded-xl shadow-sm bg-white/60 hover:shadow-md transition-all duration-200 cursor-pointer border-muted" 
          onClick={() => navigate('/events?filter=reunioes')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[14px] text-gray-900">Próxima reunião de pais</p>
                <p className="text-[12px] text-muted-foreground truncate">Sexta-feira, 26 de Julho</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="rounded-xl shadow-sm bg-white/60 hover:shadow-md transition-all duration-200 cursor-pointer border-muted" 
          onClick={() => navigate('/grades?filter=tests')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 flex-shrink-0">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[14px] text-gray-900">Próximo teste geral</p>
                <p className="text-[12px] text-muted-foreground truncate">2ª feira, 29 de Julho</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="rounded-xl shadow-sm bg-white/60 hover:shadow-md transition-all duration-200 cursor-pointer border-muted" 
          onClick={() => navigate('/settings?tab=backup')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 flex-shrink-0">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[14px] text-gray-900">Último backup</p>
                <p className="text-[12px] text-muted-foreground truncate">Ontem, 23:00 - Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}