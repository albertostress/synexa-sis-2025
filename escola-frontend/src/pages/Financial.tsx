import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Eye,
  FileText,
  Users,
  Calendar,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  Banknote,
  Wallet,
  Target,
  BarChart3,
  Bell,
  Mail,
  CheckSquare,
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
  InvoiceType,
  InvoiceStatusLabels,
  InvoiceStatusColors,
  InvoiceTypeLabels,
  PaymentMethodLabels,
  formatCurrency,
  MONTHS_PT
} from '@/types/finance';
import { FinancialDashboard } from '@/components/financial/FinancialDashboard';
import { InvoiceModal } from '@/components/financial/InvoiceModal';
import { InvoicesTable } from '@/components/financial/InvoicesTable';
import { useFinancialData } from '@/hooks/useFinancialData';

// Schema de validação para pagamento
const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  method: z.enum(['DINHEIRO', 'TRANSFERENCIA', 'MULTICAIXA', 'EXPRESS', 'PAYWAY', 'CARTAO', 'CHEQUE']),
  reference: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function Financial() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<number | undefined>();
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Hook para dados financeiros do dashboard
  const { data: dashboardData, isLoading: loadingDashboard } = useFinancialData();

  // Form setup para pagamentos
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      method: 'DINHEIRO',
      reference: '',
    },
  });

  // ==================== QUERIES ====================

  // Buscar faturas
  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', searchTerm, statusFilter, monthFilter, yearFilter, page],
    queryFn: () => {
      const filters: InvoiceFilters = {
        page,
        limit,
        ...(statusFilter !== 'all' && { status: statusFilter as InvoiceStatus }),
        ...(monthFilter && { month: monthFilter }),
        ...(yearFilter && { year: yearFilter }),
      };
      return financialAPI.getInvoices(filters);
    },
  });

  // Buscar alunos
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: studentsAPI.getAll,
  });

  // ==================== MUTATIONS ====================

  // Criar nova fatura
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => {
      // Adaptar dados do modal avançado para o formato do backend
      const createData: CreateInvoiceDto = {
        studentId: data.studentId,
        amount: data.amount,
        description: data.description,
        dueDate: data.dueDate,
        month: data.month,
        year: data.year,
      };
      return financialAPI.createInvoice(createData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
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
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
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

  // Cancelar fatura
  const cancelInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => financialAPI.cancelInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      toast({
        title: 'Fatura Cancelada',
        description: 'A fatura foi cancelada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Cancelar Fatura',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Automação - Notificar alunos em atraso
  const notifyOverdueMutation = useMutation({
    mutationFn: financialAPI.sendOverdueReminders,
    onSuccess: (result) => {
      toast({
        title: 'Lembretes Enviados!',
        description: `Lembretes enviados para ${result.count || 'todos os'} alunos em atraso.`,
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

  // Marcar pagamentos em atraso
  const markOverduePaymentsMutation = useMutation({
    mutationFn: financialAPI.markOverduePayments,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      toast({
        title: 'Pagamentos Atualizados!',
        description: `${result.count || 'Algumas'} faturas foram marcadas como vencidas.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Atualizar Pagamentos',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // ==================== HANDLERS ====================

  const handleSubmitPayment = (data: PaymentFormData) => {
    if (!selectedInvoice) return;

    const paymentData: PayInvoiceDto = {
      amount: data.amount,
      method: data.method,
      reference: data.reference,
    };

    payInvoiceMutation.mutate({
      invoiceId: selectedInvoice.id,
      paymentData,
    });
  };

  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    paymentForm.setValue('amount', invoice.balance);
    setIsPaymentOpen(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewInvoiceOpen(true);
  };

  const handleCancelInvoice = (invoiceId: string) => {
    cancelInvoiceMutation.mutate(invoiceId);
  };

  const handleViewStudentHistory = (studentId: string) => {
    navigate(`/finance/student/${studentId}/history`);
  };

  const handleNotifyOverdue = () => {
    notifyOverdueMutation.mutate();
  };

  const handleMarkOverduePayments = () => {
    markOverduePaymentsMutation.mutate();
  };

  // ==================== COMPUTED VALUES ====================

  const currentInvoices = invoicesData?.data || [];
  const currentPagination = invoicesData?.pagination;

  // Filtrar por busca textual (feito no cliente por simplicidade)
  const filteredInvoices = currentInvoices.filter(invoice =>
    searchTerm === '' || 
    invoice.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar permissões
  const canManageFinance = financialAPI.canManageFinance(user?.role || '');
  const canViewFinance = financialAPI.canViewFinance(user?.role || '');

  if (!canViewFinance) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar o módulo financeiro.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-green-600" />
            <span>Gestão Financeira</span>
          </h1>
          <p className="text-muted-foreground">
            Sistema financeiro escolar completo adaptado para Angola (AOA)
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {canManageFinance && (
            <Button 
              onClick={() => setIsNewInvoiceOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Fatura
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Financeiro Avançado */}
      {dashboardData && (
        <FinancialDashboard 
          data={dashboardData}
          onNotifyOverdue={handleNotifyOverdue}
          onMarkOverduePayments={handleMarkOverduePayments}
        />
      )}

      {/* Abas */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices" className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Faturas</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Automação</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba de Faturas */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtro de Status */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="PENDENTE">⏳ Pendente</SelectItem>
                    <SelectItem value="PAGA">✅ Paga</SelectItem>
                    <SelectItem value="VENCIDA">🔴 Vencida</SelectItem>
                    <SelectItem value="PARCIAL">🔵 Parcial</SelectItem>
                    <SelectItem value="CANCELADA">❌ Cancelada</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro de Mês */}
                <Select 
                  value={monthFilter?.toString() || 'all'} 
                  onValueChange={(value) => setMonthFilter(value === 'all' ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Meses</SelectItem>
                    {MONTHS_PT.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro de Ano */}
                <Select 
                  value={yearFilter.toString()} 
                  onValueChange={(value) => setYearFilter(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2023, 2022, 2021, 2020].map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Limpar Filtros */}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setMonthFilter(undefined);
                    setYearFilter(new Date().getFullYear());
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Faturas Avançada */}
          <InvoicesTable
            invoices={filteredInvoices}
            isLoading={loadingInvoices}
            pagination={currentPagination}
            onViewInvoice={handleViewInvoice}
            onPayInvoice={handleOpenPayment}
            onCancelInvoice={handleCancelInvoice}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
            canManage={canManageFinance}
          />

          {/* Paginação */}
          {currentPagination && currentPagination.pages > 1 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Página {currentPagination.page} de {currentPagination.pages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPagination.page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPagination.page >= currentPagination.pages}
                  onClick={() => setPage(Math.min(currentPagination.pages, page + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Aba de Relatórios */}
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Resumo Mensal
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Histórico por Aluno
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Análise de Inadimplência
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Metas vs Realizado
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exportações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Relatório PDF Completo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por Email
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba de Automação */}
        <TabsContent value="automation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <span>Lembretes Automáticos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure lembretes automáticos para alunos com faturas pendentes ou vencidas.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={handleNotifyOverdue}
                    disabled={notifyOverdueMutation.isPending}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {notifyOverdueMutation.isPending ? 'Enviando...' : 'Enviar Lembretes Agora'}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Configurar Agendamento
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span>Atualizações Automáticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Automatize a marcação de faturas como vencidas e outras atualizações de status.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={handleMarkOverduePayments}
                    disabled={markOverduePaymentsMutation.isPending}
                    variant="outline" 
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {markOverduePaymentsMutation.isPending ? 'Processando...' : 'Atualizar Status'}
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Configurar Rotinas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Nova Fatura Avançada */}
      <InvoiceModal
        open={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        onSubmit={(data) => createInvoiceMutation.mutate(data)}
        students={students}
        isLoading={createInvoiceMutation.isPending}
      />

      {/* Modal de Pagamento */}
      {selectedInvoice && (
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                Registre um novo pagamento para esta fatura
              </DialogDescription>
            </DialogHeader>
            
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="text-sm space-y-1">
                <div><strong>Aluno:</strong> {selectedInvoice.student?.name}</div>
                <div><strong>Fatura:</strong> {selectedInvoice.description}</div>
                <div><strong>Valor Total:</strong> {formatCurrency(selectedInvoice.amount)}</div>
                <div><strong>Já Pago:</strong> {formatCurrency(selectedInvoice.paidAmount)}</div>
                <div><strong>Saldo:</strong> {formatCurrency(selectedInvoice.balance)}</div>
              </div>
            </div>
            
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(handleSubmitPayment)} className="space-y-4">
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Pagamento (AOA)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
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
                      <FormLabel>Método de Pagamento</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {financialAPI.getPaymentMethods().map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.icon} {method.label}
                              </SelectItem>
                            ))}
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
                      <FormLabel>Referência (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Comprovativo, Nº Operação..."
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
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={payInvoiceMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {payInvoiceMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Registrar Pagamento
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Visualização de Fatura */}
      {selectedInvoice && (
        <Dialog open={isViewInvoiceOpen} onOpenChange={setIsViewInvoiceOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Detalhes da Fatura</span>
                <Badge 
                  className={InvoiceStatusColors[selectedInvoice.status]}
                  variant="outline"
                >
                  {InvoiceStatusLabels[selectedInvoice.status]}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Informações completas da fatura selecionada
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">ALUNO</h4>
                  <p className="font-medium">{selectedInvoice.student?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.student?.studentNumber}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">DESCRIÇÃO</h4>
                  <p>{selectedInvoice.description}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">PERÍODO</h4>
                  <p>{MONTHS_PT[selectedInvoice.month - 1]} {selectedInvoice.year}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">VALORES</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pago:</span>
                      <span className="font-mono text-green-600">{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="font-medium">Saldo:</span>
                      <span className="font-mono font-medium">{formatCurrency(selectedInvoice.balance)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">VENCIMENTO</h4>
                  <p>{format(new Date(selectedInvoice.dueDate), 'dd/MM/yyyy', { locale: pt })}</p>
                  {financialAPI.isOverdue(selectedInvoice.dueDate) && selectedInvoice.status !== 'PAGA' && (
                    <p className="text-red-600 text-sm">
                      {financialAPI.calculateDebtAge(selectedInvoice.dueDate)} dias em atraso
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleViewStudentHistory(selectedInvoice.student?.id)}
              >
                <Users className="h-4 w-4 mr-2" />
                Ver Histórico do Aluno
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => financialAPI.downloadInvoicePdf(selectedInvoice.id, `fatura_${selectedInvoice.id}.pdf`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                
                {canManageFinance && selectedInvoice.status !== 'PAGA' && selectedInvoice.status !== 'CANCELADA' && (
                  <Button
                    onClick={() => {
                      setIsViewInvoiceOpen(false);
                      handleOpenPayment(selectedInvoice);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registrar Pagamento
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}