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
  Receipt,
  GraduationCap,
  Mail,
  Calendar,
  DollarSign,
  ScrollText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// APIs temporariamente removidas para evitar erros
// import { analyticsAPI, attendanceAPI, financialAPI } from '@/lib/api';
// import { formatPercentage } from '@/types/analytics';

// Função auxiliar para formatar porcentagem
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Dados mockados temporariamente
  const overviewData = {
    totalStudents: 847,
    activeStudents: 812,
    totalTeachers: 45,
    totalClasses: 24,
    attendanceRate: 96.2,
    paymentRate: 87.5
  };

  const attendanceData = {
    todayAbsences: 23,
    criticalAttendanceCount: 5
  };

  const financeData = {
    pendingInvoices: 45,
    totalRevenue: 1250000
  };

  const overviewLoading = false;
  const attendanceLoading = false;
  const financeLoading = false;
  const overviewError = null;
  const refetchOverview = () => {};


  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Aqui seria feito o refresh dos dados
        console.log('Refreshing dashboard data...');
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

  const isLoading = overviewLoading || attendanceLoading || financeLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
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

      {/* KPIs Grid - Indicadores Essenciais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Alunos"
          value={overviewData?.totalStudents || 847}
          icon={GraduationCap}
          trend="up"
          change="+12 novos este mês"
          loading={isLoading}
        />
        <KPICard
          title="Alunos Ativos"
          value={overviewData?.activeStudents || 812}
          icon={UserCheck}
          trend="up"
          change="96% do total"
          loading={isLoading}
        />
        <KPICard
          title="Faltas Hoje"
          value={attendanceData?.todayAbsences || 23}
          icon={UserX}
          trend="down"
          change="3% dos alunos"
          loading={isLoading}
        />
        <KPICard
          title="Faturas Pendentes"
          value={financeData?.pendingInvoices || 45}
          icon={ScrollText}
          trend="down"
          change="- 8 esta semana"
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                <span className="font-medium text-sm">{action.title}</span>
                <span className="text-xs text-muted-foreground text-center">{action.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertas Administrativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            ⚠ Atividade Recente
          </CardTitle>
          <CardDescription>Alertas e pendências importantes da escola</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-accent transition-colors">
              <div className="p-2 rounded-full bg-orange-100">
                <Receipt className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Fatura Pendente</p>
                <p className="text-xs text-muted-foreground">12 faturas aguardando pagamento</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Há 1 dia
              </div>
            </div>

            <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-accent transition-colors">
              <div className="p-2 rounded-full bg-green-100">
                <GraduationCap className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Matrícula Nova</p>
                <p className="text-xs text-muted-foreground">João Silva foi matriculado na 10ª Classe</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Há 2h
              </div>
            </div>

            <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-accent transition-colors">
              <div className="p-2 rounded-full bg-blue-100">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Novo Comunicado</p>
                <p className="text-xs text-muted-foreground">Comunicado geral enviado para a turma 7A</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Há 12h
              </div>
            </div>

            <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-accent transition-colors">
              <div className="p-2 rounded-full bg-purple-100">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Evento Próximo</p>
                <p className="text-xs text-muted-foreground">Reunião de pais agendada para sexta-feira</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Em 3 dias
              </div>
            </div>

            <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-accent transition-colors">
              <div className="p-2 rounded-full bg-amber-100">
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Backup Sistema</p>
                <p className="text-xs text-muted-foreground">Último backup realizado com sucesso</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Ontem 23:00
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atalhos com Cores - Cards Horizontais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/events?filter=reunioes')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Próxima reunião de pais</p>
                <p className="text-sm text-muted-foreground">Sexta-feira, 26 de Julho</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/grades?filter=tests')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-green-100">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Próximo teste geral</p>
                <p className="text-sm text-muted-foreground">2ª feira, 29 de Julho</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/settings?tab=backup')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Último backup</p>
                <p className="text-sm text-muted-foreground">Ontem, 23:00 - Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}