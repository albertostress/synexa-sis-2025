import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Calendar, 
  FileText, 
  Users,
  Clock,
  BookOpen,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfessorStats {
  totalClasses: number;
  totalStudents: number;
  todayLessons: number;
  pendingGrades: number;
  avgAttendance: number;
  upcomingEvents: number;
}

interface ClassSchedule {
  id: string;
  subject: string;
  class: string;
  time: string;
  room: string;
  status: 'upcoming' | 'current' | 'completed';
}

export function ProfessorDashboard() {
  const navigate = useNavigate();
  const [stats] = useState<ProfessorStats>({
    totalClasses: 6,
    totalStudents: 142,
    todayLessons: 4,
    pendingGrades: 23,
    avgAttendance: 87.2,
    upcomingEvents: 2
  });

  const [todaySchedule] = useState<ClassSchedule[]>([
    {
      id: '1',
      subject: 'Matemática',
      class: '10º A',
      time: '08:00 - 09:30',
      room: 'Sala 201',
      status: 'completed'
    },
    {
      id: '2',
      subject: 'Física',
      class: '11º B',
      time: '10:00 - 11:30',
      room: 'Lab. Física',
      status: 'current'
    },
    {
      id: '3',
      subject: 'Matemática',
      class: '12º A',
      time: '14:00 - 15:30',
      room: 'Sala 203',
      status: 'upcoming'
    },
    {
      id: '4',
      subject: 'Física',
      class: '10º C',
      time: '16:00 - 17:30',
      room: 'Lab. Física',
      status: 'upcoming'
    }
  ]);

  const [recentClasses] = useState([
    { id: '1', subject: 'Matemática', class: '10º A', topic: 'Equações do 2º grau', date: '2024-01-15', attendance: 28, total: 30 },
    { id: '2', subject: 'Física', class: '11º B', topic: 'Movimento uniforme', date: '2024-01-14', attendance: 25, total: 27 },
    { id: '3', subject: 'Matemática', class: '12º A', topic: 'Derivadas', date: '2024-01-13', attendance: 24, total: 26 },
    { id: '4', subject: 'Física', class: '10º C', topic: 'Cinemática', date: '2024-01-12', attendance: 29, total: 31 }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'current': return 'bg-primary text-primary-foreground';
      case 'upcoming': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'current': return 'Em andamento';
      case 'upcoming': return 'Próxima';
      default: return 'Desconhecido';
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel do Professor</h1>
          <p className="text-muted-foreground mt-2">
            Suas turmas e atividades acadêmicas - {getCurrentTime()}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/attendance')}
            variant="outline"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Presenças
          </Button>
          <Button 
            onClick={() => navigate('/grades')}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lançar Notas
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minhas Turmas</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalStudents} alunos no total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Hoje</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayLessons}</div>
            <p className="text-xs text-primary flex items-center mt-1">
              1 em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingGrades}</div>
            <p className="text-xs text-warning flex items-center mt-1">
              Aguardando lançamento
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequência Média</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAttendance}%</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +1.5% esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Horário de Hoje</CardTitle>
            <CardDescription>
              Suas aulas programadas para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySchedule.map((lesson) => (
                <div key={lesson.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">
                          {lesson.subject} - {lesson.class}
                        </p>
                      </div>
                      <Badge className={getStatusColor(lesson.status)}>
                        {getStatusText(lesson.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lesson.time} • {lesson.room}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/classes')}
            >
              Ver Todas as Turmas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Aulas Recentes</CardTitle>
            <CardDescription>
              Últimas aulas ministradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClasses.map((class_) => (
                <div key={class_.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-2 rounded-full bg-success/10">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {class_.subject} - {class_.class}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {class_.attendance}/{class_.total}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {class_.topic}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(class_.date).toLocaleDateString('pt-PT')} • 
                      Frequência: {Math.round((class_.attendance / class_.total) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/attendance')}
              >
                Registrar Presenças
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/grades')}
              >
                Lançar Notas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}