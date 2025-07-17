import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, CreditCard, TrendingUp, TrendingDown, Search, Filter, Eye, FileText, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import PaymentPlanForm from '@/components/financial/PaymentPlanForm';
import PaymentForm from '@/components/financial/PaymentForm';
import FinancialReports from '@/components/financial/FinancialReports';
import InvoiceForm from '@/components/financial/InvoiceForm';

interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  method?: string;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Ana Silva',
    type: 'mensalidade',
    description: 'Mensalidade - Janeiro 2024',
    amount: 450.00,
    dueDate: '2024-01-05',
    paymentDate: '2024-01-03',
    status: 'paid',
    method: 'cartao',
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'João Santos',
    type: 'mensalidade',
    description: 'Mensalidade - Janeiro 2024',
    amount: 450.00,
    dueDate: '2024-01-05',
    status: 'overdue',
  },
  {
    id: '3',
    studentId: '1',
    studentName: 'Ana Silva',
    type: 'material',
    description: 'Material Escolar 2024',
    amount: 180.00,
    dueDate: '2024-01-15',
    status: 'pending',
  },
];

const mockStudents = [
  { id: '1', name: 'Ana Silva' },
  { id: '2', name: 'João Santos' },
  { id: '3', name: 'Maria Costa' },
];

const invoiceTypes = [
  { value: 'mensalidade', label: 'Mensalidade' },
  { value: 'material', label: 'Material Escolar' },
  { value: 'uniforme', label: 'Uniforme' },
  { value: 'atividade', label: 'Atividade Extra' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacao', label: 'Alimentação' },
];

export default function Financial() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', searchTerm, statusFilter, typeFilter],
    queryFn: async () => {
      console.log('Fetching invoices with filters:', { searchTerm, statusFilter, typeFilter });
      return Promise.resolve(
        mockInvoices.filter(invoice => 
          invoice.studentName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (statusFilter === 'all' || invoice.status === statusFilter) &&
          (typeFilter === 'all' || invoice.type === typeFilter)
        )
      );
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      partial: 'bg-blue-100 text-blue-800',
    };
    
    const labels = {
      pending: 'Pendente',
      paid: 'Pago',
      overdue: 'Em Atraso',
      cancelled: 'Cancelado',
      partial: 'Parcial',
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getFinancialStats = () => {
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
    
    const pendingAmount = invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0);
    
    const overdueAmount = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      totalRevenue,
      pendingAmount,
      overdueAmount,
      totalInvoices: invoices.length,
    };
  };

  const generateBatchInvoices = () => {
    console.log('Generating batch invoices for all active students');
    toast({
      title: 'Sucesso',
      description: 'Mensalidades geradas em lote para todos os alunos ativos.',
    });
  };

  const stats = getFinancialStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gerir pagamentos e finanças da escola</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalRevenue)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valores Pendentes</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(stats.pendingAmount)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.overdueAmount)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Facturas</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={generateBatchInvoices}
                >
                  Gerar Mensalidades em Lote
                </Button>
                <InvoiceForm />
                <PaymentPlanForm />
                <PaymentForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Inadimplentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">12</div>
                <p className="text-muted-foreground">alunos em atraso</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recibos do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">145</div>
                <p className="text-muted-foreground">recibos emitidos</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Imprimir Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Planos de Pagamento</h2>
            <PaymentPlanForm />
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Plano</TableHead>
                    <TableHead>Ano Letivo</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Dia Vencimento</TableHead>
                    <TableHead>Multa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Mensalidade Ensino Médio</TableCell>
                    <TableCell>2024</TableCell>
                    <TableCell className="font-mono">{formatCurrency(15000)}</TableCell>
                    <TableCell>Dia 10</TableCell>
                    <TableCell>2% + 1%/dia</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Editar</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Em Atraso</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="mensalidade">Mensalidade</SelectItem>
                    <SelectItem value="material">Material Escolar</SelectItem>
                    <SelectItem value="uniforme">Uniforme</SelectItem>
                    <SelectItem value="atividade">Atividade Extra</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="alimentacao">Alimentação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Facturas e Pagamentos</CardTitle>
              <InvoiceForm />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.studentName}</TableCell>
                      <TableCell>
                        {invoiceTypes.find(t => t.value === invoice.type)?.label}
                      </TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString('pt-AO')}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gestão de Pagamentos</h2>
            <PaymentForm />
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Funcionalidades de pagamento em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
