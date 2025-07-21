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
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  MessageSquare,
  Award,
  Activity,
  ArrowRight,
  UserCheck,
  GraduationCap,
  ClipboardList,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { analyticsAPI, attendanceAPI, gradesAPI, classesAPI, eventsAPI } from '@/lib/api';
import { 
  formatPercentage, 
  formatNumber,
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

interface MyClass {
  id: string;
  name: string;
  shift: string;
  totalStudents: number;
  presentToday: number;
  attendanceRate: number;
}

export function ProfessorDashboardIntegrated() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Query para attendance analytics (geral para contexto)
  const { 
    data: attendanceData, 
    isLoading: attendanceLoading, 
    error: attendanceError,
    refetch: refetchAttendance 
  } = useQuery({
    queryKey: ['professor', 'attendance', selectedYear, selectedMonth],
    queryFn: () => analyticsAPI.getAttendanceAnalytics({ 
      year: selectedYear, 
      month: selectedMonth 
    }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para grades analytics
  const { 
    data: gradesData, 
    isLoading: gradesLoading,
  } = useQuery({
    queryKey: ['professor', 'grades', selectedYear],
    queryFn: () => analyticsAPI.getGradesAnalytics({ year: selectedYear }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para minhas turmas (simulado - deveria filtrar pelo professor logado)
  const { 
    data: myClassesData, 
    isLoading: classesLoading,
  } = useQuery({
    queryKey: ['professor', 'classes', user?.id],
    queryFn: async () => {
      // Simulação de turmas do professor
      const classes: MyClass[] = [
        {
          id: '1',
          name: '10ª Classe A',
          shift: 'MORNING',
          totalStudents: 25,
          presentToday: 23,
          attendanceRate: 92
        },
        {
          id: '2',
          name: '11ª Classe B',
          shift: 'AFTERNOON',
          totalStudents: 28,
          presentToday: 26,
          attendanceRate: 89
        },
        {
          id: '3',
          name: '12ª Classe C',
          shift: 'MORNING',
          totalStudents: 22,
          presentToday: 20,
          attendanceRate: 94
        }
      ];
      return classes;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Query para próximos eventos
  const { 
    data: eventsData, 
    isLoading: eventsLoading,
  } = useQuery({
    queryKey: ['professor', 'events'],
    queryFn: () => eventsAPI.getEvents({ futureOnly: true, limit: 3 }),
    staleTime: 5 * 60 * 1000,
  });

  // Query para atividades recentes do professor
  const { data: recentActivities } = useQuery({
    queryKey: ['professor', 'activities'],
    queryFn: async () => {
      // Simulação de atividades do professor
      return [
        {
          id: '1',
          type: 'grade',
          title: 'Notas lançadas',
          description: 'Matemática - 10ª Classe A (25 alunos)',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          status: 'success'
        },
        {
          id: '2',
          type: 'attendance',
          title: 'Presença registrada',
          description: 'Física - 11ª Classe B (26/28 presentes)',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          status: 'success'
        },
        {
          id: '3',
          type: 'schedule',
          title: 'Aula reagendada',
          description: 'Química - 12ª Classe C para quinta-feira',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
          status: 'warning'
        }
      ];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['professor'] });
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, queryClient]);

  // Quick Actions para Professor
  const quickActions: QuickAction[] = [
    {
      id: 'register-attendance',
      title: 'Registrar Presença',
      description: 'Marcar presenças da aula',
      icon: UserCheck,
      action: () => navigate('/attendance?action=register'),
      color: 'bg-blue-500'
    },
    {
      id: 'record-grades',
      title: 'Lançar Notas',
      description: 'Registrar avaliações',
      icon: Award,
      action: () => navigate('/grades?action=new'),
      color: 'bg-green-500'
    },
    {
      id: 'view-schedule',
      title: 'Ver Horários',
      description: 'Cronograma de aulas',
      icon: Clock,
      action: () => navigate('/schedules'),
      color: 'bg-purple-500'
    },
    {
      id: 'send-message',
      title: 'Enviar Recado',
      description: 'Comunicar com pais',
      icon: MessageSquare,
      action: () => navigate('/communication?action=compose'),
      color: 'bg-orange-500'
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'grade': return <Award className="w-4 h-4" />;
      case 'attendance': return <UserCheck className="w-4 h-4" />;
      case 'schedule': return <Clock className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-red-600';
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
          {change && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : ''}>
                {change}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const isLoading = attendanceLoading || gradesLoading || classesLoading;

  // Calcular estatísticas das minhas turmas
  const totalStudents = myClassesData?.reduce((sum, cls) => sum + cls.totalStudents, 0) || 0;
  const totalPresent = myClassesData?.reduce((sum, cls) => sum + cls.presentToday, 0) || 0;
  const averageAttendance = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;
  const myClassesCount = myClassesData?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Professor</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.name}! Gerencie suas turmas e atividades.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS_PT.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
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
            Relatórios
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {attendanceError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados. Por favor, tente novamente.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => refetchAttendance()}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs específicos para Professor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Minhas Turmas"
          value={myClassesCount}
          icon={GraduationCap}
          change="Este período letivo"
          loading={isLoading}
        />
        <KPICard
          title="Total de Alunos"
          value={totalStudents}
          icon={Users}
          change="Todas as turmas"
          loading={isLoading}
        />
        <KPICard
          title="Presença Hoje"
          value={`${totalPresent}/${totalStudents}`}
          icon={Calendar}
          trend={averageAttendance >= 85 ? "up" : "down"}
          change={formatPercentage(averageAttendance)}
          loading={isLoading}
        />
        <KPICard
          title="Média Geral"
          value={gradesData?.overallAverage.toFixed(1) || '0.0'}
          icon={Award}
          trend={gradesData && gradesData.overallAverage >= 14 ? "up" : "down"}
          change="Suas disciplinas"
          loading={isLoading}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Funcionalidades mais utilizadas em sala de aula</CardDescription>
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

      {/* Minhas Turmas e Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minhas Turmas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Minhas Turmas</CardTitle>
              <CardDescription>Status atual das suas turmas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/classes')}>
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {myClassesData?.map((cls) => (
                  <div key={cls.id} className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{cls.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {cls.shift === 'MORNING' ? 'Manhã' : cls.shift === 'AFTERNOON' ? 'Tarde' : 'Noite'}
                        </p>
                      </div>
                      <Badge variant={cls.attendanceRate >= 85 ? "default" : "destructive"}>
                        {formatPercentage(cls.attendanceRate)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>{cls.totalStudents} alunos</span>
                      <span className="text-green-600">
                        {cls.presentToday} presentes hoje
                      </span>
                    </div>
                    <Progress 
                      value={cls.attendanceRate} 
                      className="h-2 mt-2" 
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance das Disciplinas */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Disciplina</CardTitle>
            <CardDescription>Médias das suas disciplinas</CardDescription>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : gradesData && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradesData.averageBySubject.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 20]} />
                  <Tooltip formatter={(value) => [Number(value).toFixed(1), 'Média']} />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atividades e Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>Suas últimas ações no sistema</CardDescription>
            </div>
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

        {/* Próximos Eventos */}
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
                        <p className="text-xs text-muted-foreground">
                          {event.location}
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

      {/* Resumo Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Mês</CardTitle>
          <CardDescription>Indicadores do mês de {MONTHS_PT[selectedMonth - 1]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Aulas Ministradas</p>
              <p className="text-2xl font-bold text-blue-800">42</p>
              <p className="text-xs text-blue-500">+8% em relação ao mês anterior</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Notas Lançadas</p>
              <p className="text-2xl font-bold text-green-800">156</p>
              <p className="text-xs text-green-500">Todas as disciplinas</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600">Presenças Registradas</p>
              <p className="text-2xl font-bold text-purple-800">1,285</p>
              <p className="text-xs text-purple-500">Taxa média: {formatPercentage(averageAttendance)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600">Comunicados Enviados</p>
              <p className="text-2xl font-bold text-orange-800">8</p>
              <p className="text-xs text-orange-500">Para pais e responsáveis</p>
            </div>
          </div>
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
              onClick={() => navigate('/classes')}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Turmas
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start h-auto py-3"
              onClick={() => navigate('/grades')}
            >
              <Award className="w-4 h-4 mr-2" />
              Notas
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
              onClick={() => navigate('/schedules')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Horários
            </Button>
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
              onClick={() => navigate('/subjects')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Disciplinas
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
              <ClipboardList className="w-4 h-4 mr-2" />
              Relatórios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}