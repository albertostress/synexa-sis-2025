import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Mail,
  CreditCard,
  FileText,
  Calendar,
  Receipt,
  Target,
  Wallet,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatCurrency } from '@/types/finance';
import { financialAPI, studentsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function StudentFinancialHistory() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Buscar dados do aluno
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsAPI.getById(studentId!),
    enabled: !!studentId,
  });

  // Buscar histórico financeiro
  const { data: financialHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['student-financial-history', studentId],
    queryFn: () => financialAPI.getStudentHistory(studentId!),
    enabled: !!studentId,
  });

  // Dados simulados para demonstração
  const mockData = {
    summary: {
      totalInvoiced: 180000,
      totalPaid: 145000,
      totalPending: 25000,
      totalOverdue: 10000,
      averageMonthlyAmount: 15000,
      paymentSuccessRate: 85,
    },
    monthlyPayments: [
      { month: 'Jan', invoiced: 15000, paid: 15000, pending: 0 },
      { month: 'Fev', invoiced: 15000, paid: 15000, pending: 0 },
      { month: 'Mar', invoiced: 15000, paid: 12000, pending: 3000 },
      { month: 'Abr', invoiced: 15000, paid: 15000, pending: 0 },
      { month: 'Mai', invoiced: 15000, paid: 10000, pending: 5000 },
      { month: 'Jun', invoiced: 15000, paid: 15000, pending: 0 },
      { month: 'Jul', invoiced: 15000, paid: 8000, pending: 7000 },
      { month: 'Ago', invoiced: 15000, paid: 15000, pending: 0 },
      { month: 'Set', invoiced: 15000, paid: 15000, pending: 0 },
      { month: 'Out', invoiced: 15000, paid: 15000, pending: 0 },
      { month: 'Nov', invoiced: 15000, paid: 0, pending: 15000 },
      { month: 'Dez', invoiced: 15000, paid: 0, pending: 15000 },
    ],
    invoices: [
      {
        id: '1',
        description: 'Propina de Novembro 2024',
        amount: 15000,
        paidAmount: 0,
        balance: 15000,
        status: 'PENDENTE',
        dueDate: '2024-11-30',
        createdAt: '2024-11-01',
        month: 11,
        year: 2024,
      },
      {
        id: '2',
        description: 'Propina de Outubro 2024',
        amount: 15000,
        paidAmount: 15000,
        balance: 0,
        status: 'PAGA',
        dueDate: '2024-10-30',
        createdAt: '2024-10-01',
        month: 10,
        year: 2024,
        payments: [
          {
            id: 'p1',
            amount: 15000,
            method: 'TRANSFERENCIA',
            paidAt: '2024-10-25',
            reference: 'TRF123456789',
          }
        ]
      },
      // Mais faturas...
    ],
    paymentMethods: [
      { method: 'Transferência Bancária', amount: 85000, count: 8, color: '#10b981' },
      { method: 'Multicaixa', amount: 45000, count: 5, color: '#3b82f6' },
      { method: 'Dinheiro', amount: 15000, count: 2, color: '#f59e0b' },
    ],
  };

  const handleDownloadFullReport = async () => {
    try {
      // Simular geração de relatório completo
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Relatório Gerado',
        description: 'O relatório completo foi baixado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório.',
        variant: 'destructive',
      });
    }
  };

  if (loadingStudent || loadingHistory) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
        <h2 className="text-xl font-semibold mb-2">Aluno não encontrado</h2>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAGA':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'PENDENTE':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
      case 'VENCIDA':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle };
      case 'PARCIAL':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CreditCard };
      case 'CANCELADA':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <User className="h-8 w-8" />
              <span>Histórico Financeiro</span>
            </h1>
            <p className="text-muted-foreground">
              {student.firstName} {student.lastName} • {student.studentNumber}
            </p>
          </div>
        </div>
        
        <Button onClick={handleDownloadFullReport} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Relatório Completo PDF
        </Button>
      </div>

      {/* Informações do Aluno */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Dados do Aluno</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Nome Completo</span>
              <p className="font-medium">{student.firstName} {student.lastName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Número</span>
              <p className="font-medium">{student.studentNumber}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Ano Acadêmico</span>
              <p className="font-medium">{student.academicYear}º Ano</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Turma</span>
              <p className="font-medium">{student.classId || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faturado</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(mockData.summary.totalInvoiced)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média mensal: {formatCurrency(mockData.summary.averageMonthlyAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(mockData.summary.totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de sucesso: {mockData.summary.paymentSuccessRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(mockData.summary.totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(mockData.summary.totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground">
              valores vencidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Tendência */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Tendência Mensal 2024</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockData.monthlyPayments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                    <Area type="monotone" dataKey="invoiced" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="paid" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Métodos de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Métodos de Pagamento Preferidos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={mockData.paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="amount"
                      >
                        {mockData.paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {mockData.paymentMethods.map((method, index) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: method.color }}
                        />
                        <span className="text-sm">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{formatCurrency(method.amount)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({method.count}x)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lista de Faturas */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockData.invoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.description}</div>
                            <div className="text-xs text-muted-foreground">
                              #{financialAPI.formatInvoiceNumber(invoice.id, invoice.month, invoice.year)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-mono">{formatCurrency(invoice.amount)}</div>
                            {invoice.paidAmount > 0 && (
                              <div className="text-xs text-green-600">
                                Pago: {formatCurrency(invoice.paidAmount)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color} variant="outline">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {invoice.status === 'PAGA' ? 'Paga' : 
                             invoice.status === 'PENDENTE' ? 'Pendente' :
                             invoice.status === 'VENCIDA' ? 'Vencida' : invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: pt })}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost" title="Baixar PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Ver detalhes">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detalhes dos Pagamentos */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Detalhamento completo dos pagamentos realizados</p>
                <p className="text-sm">Esta funcionalidade será implementada na próxima versão</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise Detalhada */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Padrões de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Taxa de Pontualidade</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      85%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Atraso Médio</span>
                    <span className="text-sm">3 dias</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Método Preferido</span>
                    <span className="text-sm">Transferência Bancária</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Target className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Histórico Positivo</p>
                      <p className="text-muted-foreground">Aluno com boa pontualidade nos pagamentos</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Atenção Necessária</p>
                      <p className="text-muted-foreground">Enviar lembrete para faturas pendentes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}