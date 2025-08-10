import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  Target,
  BarChart3,
  Bell,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  FileText,
  Send,
  Filter,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  financialAPI,
  studentsAPI 
} from '@/lib/api';
import {
  Invoice,
  CreateInvoiceDto,
  PayInvoiceDto,
  InvoiceFilters,
  InvoiceStatus,
  PaymentMethod,
  InvoiceStatusLabels,
  formatCurrency,
  MONTHS_PT
} from '@/types/finance';
import { InvoiceModal } from '@/components/financial/InvoiceModal';
import { useFinancialData } from '@/hooks/useFinancialData';

// Schema de validação para pagamento
const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  method: z.enum(['DINHEIRO', 'TRANSFERENCIA', 'MULTICAIXA', 'EXPRESS', 'PAYWAY', 'CARTAO', 'CHEQUE']),
  reference: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Componente para Card de Estatística
function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  color = 'default' 
}: { 
  title: string; 
  value: string; 
  change?: string; 
  icon: React.ElementType; 
  trend?: 'up' | 'down';
  color?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colorClasses = {
    default: 'bg-gray-50 border-gray-200 text-gray-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    danger: 'bg-red-50 border-red-200 text-red-700'
  };

  return (
    <Card className={`border ${colorClasses[color]} transition-all hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center gap-1">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : trend === 'down' ? (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                ) : null}
                <span className={`text-xs font-medium ${
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color === 'success' ? 'bg-green-100' : color === 'warning' ? 'bg-yellow-100' : color === 'danger' ? 'bg-red-100' : 'bg-gray-100'}`}>
            <Icon className={`h-6 w-6 ${color === 'success' ? 'text-green-600' : color === 'warning' ? 'text-yellow-600' : color === 'danger' ? 'text-red-600' : 'text-gray-600'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Financial() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Verificar permissões
  const userRole = user?.role || '';
  const showKPI = userRole === 'ADMIN' || userRole === 'DIRETOR' || userRole === 'FINANCEIRO';
  const showReports = userRole === 'ADMIN' || userRole === 'DIRETOR' || userRole === 'FINANCEIRO';
  
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  // SECRETARIA começa na aba "Faturas"; gestores começam na "Visão Geral"
  const [activeTab, setActiveTab] = useState<string>(showKPI ? 'overview' : 'invoices');

  // Hook para dados financeiros
  const { data: summary, isLoading: loadingDashboard } = useFinancialData();

  // Form setup para pagamentos
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      method: 'DINHEIRO',
      reference: '',
    },
  });

  // Buscar faturas
  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', searchTerm, statusFilter],
    queryFn: () => {
      const filters: InvoiceFilters = {
        page: 1,
        limit: 50,
        ...(statusFilter !== 'all' && { status: statusFilter as InvoiceStatus }),
      };
      return financialAPI.getInvoices(filters);
    },
  });

  // Buscar alunos
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: studentsAPI.getAll,
  });

  // Criar nova fatura
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => {
      const createData: CreateInvoiceDto = {
        studentId: data.studentId,
        amount: Number(data.amount),
        description: data.description,
        dueDate: data.dueDate,
        month: data.month,
        year: data.year,
      };
      return financialAPI.createInvoice(createData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Fatura Criada!',
        description: 'A fatura foi criada com sucesso.',
      });
      setIsNewInvoiceOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Criar Fatura',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Pagar fatura
  const payInvoiceMutation = useMutation({
    mutationFn: ({ invoiceId, paymentData }: { invoiceId: string; paymentData: PayInvoiceDto }) => 
      financialAPI.payInvoice(invoiceId, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({
        title: 'Pagamento Registrado!',
        description: 'O pagamento foi registrado com sucesso.',
      });
      setIsPaymentOpen(false);
      setSelectedInvoice(null);
      paymentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Registrar Pagamento',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Notificar alunos em atraso
  const notifyOverdueMutation = useMutation({
    mutationFn: financialAPI.sendOverdueReminders,
    onSuccess: (result) => {
      toast({
        title: 'Lembretes Enviados!',
        description: `Lembretes enviados para ${result.count || 'todos os'} alunos.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Enviar Lembretes',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleSubmitPayment = (data: PaymentFormData) => {
    if (!selectedInvoice) return;

    const paymentData: PayInvoiceDto = {
      amount: Number(data.amount),
      method: data.method,
      reference: data.reference,
    };

    payInvoiceMutation.mutate({
      invoiceId: selectedInvoice.id,
      paymentData,
    });
  };

  const handleOpenPayment = (invoice: any) => {
    setSelectedInvoice(invoice);
    paymentForm.setValue('amount', invoice.remainingBalance || invoice.balance || 0);
    setIsPaymentOpen(true);
  };

  // Handler para gerar PDF da fatura
  const handleGenerateInvoicePDF = async (invoiceId: string) => {
    try {
      const response = await financialAPI.downloadInvoicePDF(invoiceId);
      
      // Criar um blob e fazer download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura_${invoiceId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF Gerado!',
        description: 'O PDF da fatura foi baixado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao Gerar PDF',
        description: error.response?.data?.message || 'Erro ao gerar o PDF da fatura',
        variant: 'destructive',
      });
    }
  };

  // Handler para notificar pai/responsável individualmente
  const handleNotifyParent = async (invoice: any) => {
    try {
      await financialAPI.notifyParent(invoice.id);
      
      toast({
        title: 'Notificação Enviada!',
        description: `Lembrete enviado para ${invoice.student?.name}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao Enviar Notificação',
        description: error.response?.data?.message || 'Erro ao enviar notificação',
        variant: 'destructive',
      });
    }
  };

  // Computed values
  const currentInvoices = invoicesData?.invoices || [];
  
  // Filtrar por busca
  const filteredInvoices = currentInvoices.filter(invoice =>
    searchTerm === '' || 
    invoice.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar permissões
  const canManageFinance = financialAPI.canManageFinance(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header Simplificado */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">Gestão Financeira</h1>
        <p className="text-sm text-gray-600">Sistema financeiro escolar adaptado para Angola</p>
      </div>

      {/* Bloco 1: Resumo Financeiro - Cards limpos e organizados - APENAS PARA GESTORES */}
      {showKPI && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Receita do Mês"
            value={summary ? formatCurrency(summary.monthlyRevenue) : 'AOA 0,00'}
            change={summary?.revenueGrowth ? `${summary.revenueGrowth}% vs mês anterior` : undefined}
            trend={summary?.revenueGrowth > 0 ? 'up' : 'down'}
            icon={DollarSign}
            color="success"
          />
          
          <StatCard
            title="Taxa de Cobrança"
            value={summary ? `${summary.collectionRate}%` : '0%'}
            icon={Percent}
            color="default"
          />
          
          <StatCard
            title="Meta do Mês"
            value={summary ? `${summary.monthlyGoalProgress}%` : '0%'}
            icon={Target}
            color={summary?.monthlyGoalProgress >= 80 ? 'success' : 'warning'}
          />
          
          <StatCard
            title="Valores em Atraso"
            value={summary ? formatCurrency(summary.overdueAmount) : 'AOA 0,00'}
            icon={AlertTriangle}
            color="danger"
          />
        </div>
      )}

      {/* Bloco 2: Ações Rápidas - Apenas botão de criar fatura */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            {canManageFinance && (
              <Button 
                onClick={() => setIsNewInvoiceOpen(true)}
                className="h-auto py-4 px-8 bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Gerar Nova Fatura</span>
                  <span className="text-xs opacity-90">Criar cobrança para aluno</span>
                </div>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs simplificadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full ${showKPI ? 'grid-cols-3' : 'grid-cols-1'} bg-gray-100`}>
          {showKPI && (
            <TabsTrigger value="overview" className="data-[state=active]:bg-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
          )}
          <TabsTrigger value="invoices" className="data-[state=active]:bg-white">
            <Receipt className="h-4 w-4 mr-2" />
            Faturas
          </TabsTrigger>
          {showReports && (
            <TabsTrigger value="reports" className="data-[state=active]:bg-white">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab Visão Geral - Bloco 3: Análises e Tendências - APENAS PARA GESTORES */}
        {showKPI && (
          <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Tendência Simplificado */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Tendência dos Últimos 6 Meses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Receita em crescimento</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">+12.5%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métodos de Pagamento Simplificado */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Métodos de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Transferência</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Multicaixa</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Dinheiro</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Outros</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Pendências Recentes */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">
                Pendências Recentes
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab('invoices')}
                className="text-gray-600 hover:text-gray-900"
              >
                Ver todas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        invoice.status === 'VENCIDA' ? 'bg-red-500' : 
                        invoice.status === 'PENDENTE' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invoice.student?.name}</p>
                        <p className="text-xs text-gray-600">{invoice.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(invoice.amount)}</p>
                      <p className="text-xs text-gray-600">
                        Vence {format(new Date(invoice.dueDate), 'dd/MM', { locale: pt })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        )}

        {/* Tab Faturas - Simplificada */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Barra de Filtros Simplificada */}
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por aluno ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 border-gray-300">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="PAGA">Paga</SelectItem>
                    <SelectItem value="VENCIDA">Vencida</SelectItem>
                    <SelectItem value="PARCIAL">Parcial</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="border-gray-300"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela Simplificada */}
          <Card className="border-gray-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900">Aluno</TableHead>
                      <TableHead className="font-semibold text-gray-900">Descrição</TableHead>
                      <TableHead className="font-semibold text-gray-900">Valor</TableHead>
                      <TableHead className="font-semibold text-gray-900">Vencimento</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInvoices ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="h-4 w-4 animate-spin" />
                            <span className="text-gray-600">Carregando...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                          Nenhuma fatura encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{invoice.student?.name}</TableCell>
                          <TableCell className="text-gray-600">{invoice.description}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell className="text-gray-600">
                            {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: pt })}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                invoice.status === 'PAGA' ? 'default' :
                                invoice.status === 'VENCIDA' ? 'destructive' :
                                invoice.status === 'PENDENTE' ? 'secondary' :
                                'outline'
                              }
                              className={
                                invoice.status === 'PAGA' ? 'bg-green-100 text-green-800 border-green-200' :
                                invoice.status === 'VENCIDA' ? 'bg-red-100 text-red-800 border-red-200' :
                                invoice.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                ''
                              }
                            >
                              {InvoiceStatusLabels[invoice.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {invoice.status !== 'PAGA' && invoice.status !== 'CANCELADA' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenPayment(invoice)}
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                  title="Registrar pagamento"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Pagar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateInvoicePDF(invoice.id)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                title="Gerar PDF da fatura"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                PDF
                              </Button>
                              {invoice.status !== 'PAGA' && invoice.status !== 'CANCELADA' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleNotifyParent(invoice)}
                                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                  title="Notificar responsável"
                                >
                                  <Bell className="h-3 w-3 mr-1" />
                                  Notificar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Relatórios - Simplificada - APENAS PARA GESTORES */}
        {showReports && (
          <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Relatórios Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <FileText className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-gray-900">Resumo Mensal</span>
                </Button>
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <Users className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-gray-900">Histórico por Aluno</span>
                </Button>
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <BarChart3 className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-gray-900">Análise de Inadimplência</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Ações de Exportação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <FileText className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-gray-900">Exportar CSV</span>
                </Button>
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <FileText className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-gray-900">Gerar PDF</span>
                </Button>
                <Button variant="outline" className="w-full justify-start border-gray-300">
                  <Send className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-gray-900">Enviar por Email</span>
                </Button>
              </CardContent>
            </Card>
          </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de Nova Fatura */}
      <InvoiceModal
        open={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        onSubmit={(data) => createInvoiceMutation.mutate(data)}
        students={students}
        isLoading={createInvoiceMutation.isPending}
      />

      {/* Modal de Pagamento Simplificado */}
      {selectedInvoice && (
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Registrar Pagamento</DialogTitle>
              <DialogDescription className="text-gray-600">
                Registre o pagamento recebido para esta fatura
              </DialogDescription>
            </DialogHeader>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span>Aluno:</span>
                  <span className="font-medium text-gray-900">{selectedInvoice.student?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor Total:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Saldo:</span>
                  <span className="font-medium text-green-700">{formatCurrency(selectedInvoice.remainingBalance || selectedInvoice.balance || 0)}</span>
                </div>
              </div>
            </div>
            
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(handleSubmitPayment)} className="space-y-4">
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900">Valor do Pagamento (AOA)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="border-gray-300"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900">Método de Pagamento</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DINHEIRO">💵 Dinheiro</SelectItem>
                            <SelectItem value="TRANSFERENCIA">🏦 Transferência</SelectItem>
                            <SelectItem value="MULTICAIXA">💳 Multicaixa</SelectItem>
                            <SelectItem value="EXPRESS">📱 Express</SelectItem>
                            <SelectItem value="PAYWAY">📲 PayWay</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900">Referência (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nº do comprovativo..."
                          className="border-gray-300"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPaymentOpen(false)}
                    className="border-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={payInvoiceMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {payInvoiceMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar Pagamento
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}