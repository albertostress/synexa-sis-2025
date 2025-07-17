import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  FileText, 
  DollarSign, 
  Calendar,
  Users,
  FileCheck,
  TrendingUp,
  Plus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SecretariaStats {
  pendingEnrollments: number;
  documentsGenerated: number;
  monthlyRevenue: number;
  overdueInvoices: number;
  studentsRegistered: number;
  documentsRequested: number;
}

export function SecretariaDashboard() {
  const navigate = useNavigate();
  const [stats] = useState<SecretariaStats>({
    pendingEnrollments: 8,
    documentsGenerated: 45,
    monthlyRevenue: 18950.00,
    overdueInvoices: 7,
    studentsRegistered: 248,
    documentsRequested: 12
  });

  const [recentDocuments] = useState([
    { id: '1', type: 'Certificado', student: 'Ana Costa', status: 'gerado', date: '2024-01-15' },
    { id: '2', type: 'Declaração', student: 'Pedro Silva', status: 'pendente', date: '2024-01-14' },
    { id: '3', type: 'Histórico', student: 'Maria Santos', status: 'gerado', date: '2024-01-14' },
    { id: '4', type: 'Boletim', student: 'João Pereira', status: 'processando', date: '2024-01-13' }
  ]);

  const [pendingTasks] = useState([
    { id: '1', task: 'Processar matrícula de Carlos Oliveira', priority: 'alta', deadline: '2024-01-16' },
    { id: '2', task: 'Emitir certificado para Sofia Rodrigues', priority: 'média', deadline: '2024-01-17' },
    { id: '3', task: 'Atualizar dados de contato', priority: 'baixa', deadline: '2024-01-20' },
    { id: '4', task: 'Revisar pagamentos em atraso', priority: 'alta', deadline: '2024-01-16' }
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2
    }).format(value).replace('AOA', 'Kz');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'destructive';
      case 'média': return 'secondary';
      case 'baixa': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'gerado': return 'text-success';
      case 'pendente': return 'text-warning';
      case 'processando': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel da Secretaria</h1>
          <p className="text-muted-foreground mt-2">
            Gestão académica e administrativa
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => navigate('/enrollments')}
            variant="outline"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Nova Matrícula
          </Button>
          <Button 
            onClick={() => navigate('/documents')}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Gerar Documento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrículas Pendentes</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingEnrollments}</div>
            <p className="text-xs text-warning flex items-center mt-1">
              <AlertCircle className="w-3 h-3 mr-1" />
              Requer atenção
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Gerados</CardTitle>
            <FileCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentsGenerated}</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8 esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-warning flex items-center mt-1">
              {stats.overdueInvoices} facturas em atraso
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Matriculados</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsRegistered}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.documentsRequested} documentos solicitados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos Recentes</CardTitle>
            <CardDescription>
              Últimos documentos processados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {doc.type}
                      </p>
                      <span className={`text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {doc.student}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.date).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/documents')}
            >
              Ver Todos os Documentos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas Pendentes</CardTitle>
            <CardDescription>
              Itens que requerem sua atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {task.task}
                      </p>
                      <Badge variant={getPriorityColor(task.priority) as any}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prazo: {new Date(task.deadline).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/enrollments')}
              >
                Matrículas
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/financial')}
              >
                Financeiro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
