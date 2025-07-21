import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Target
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

// Schema de validação para nova fatura
const invoiceSchema = z.object({
  studentId: z.string().min(1, 'Selecione um aluno'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
});

// Schema de validação para pagamento
const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  method: z.enum(['DINHEIRO', 'TRANSFERENCIA', 'MULTICAIXA', 'EXPRESS', 'PAYWAY', 'CARTAO', 'CHEQUE']),
  reference: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

export default function FinancialAngolan() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<number | undefined>();
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Form setup
  const invoiceForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      studentId: '',
      amount: 0,
      description: '',
      dueDate: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

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
    queryKey: ['invoices', searchTerm, statusFilter, typeFilter, monthFilter, yearFilter, page],
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
    mutationFn: (data: CreateInvoiceDto) => financialAPI.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Fatura Criada!',
        description: 'A fatura foi criada com sucesso.',
      });
      setIsNewInvoiceOpen(false);
      invoiceForm.reset();
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

  // ==================== HANDLERS ====================

  const handleSubmitInvoice = (data: InvoiceFormData) => {
    const createData: CreateInvoiceDto = {
      studentId: data.studentId,
      amount: data.amount,
      description: data.description,
      dueDate: data.dueDate,
      month: data.month,
      year: data.year,
    };

    createInvoiceMutation.mutate(createData);
  };

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

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      await financialAPI.downloadInvoicePdf(invoiceId, `fatura_${invoiceId}.pdf`);
      toast({
        title: 'PDF Baixado',
        description: 'O PDF da fatura foi baixado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao Baixar PDF',
        description: 'Não foi possível baixar o PDF da fatura.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelInvoice = (invoiceId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta fatura?')) {
      cancelInvoiceMutation.mutate(invoiceId);
    }
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

  // KPIs calculados
  const totalRevenue = currentInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const pendingAmount = currentInvoices
    .filter(inv => inv.status === 'PENDENTE')
    .reduce((sum, inv) => sum + inv.balance, 0);
  const overdueAmount = currentInvoices
    .filter(inv => inv.status === 'VENCIDA')
    .reduce((sum, inv) => sum + inv.balance, 0);
  const totalInvoices = currentInvoices.length;

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
          <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Sistema financeiro escolar adaptado para Angola (AOA)
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {canManageFinance && (
            <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Fatura
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Nova Fatura</DialogTitle>
                </DialogHeader>
                
                <Form {...invoiceForm}>
                  <form onSubmit={invoiceForm.handleSubmit(handleSubmitInvoice)} className="space-y-4">
                    {/* Aluno */}
                    <FormField
                      control={invoiceForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aluno</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o aluno" />
                              </SelectTrigger>
                              <SelectContent>
                                {students.map((student: any) => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.firstName} {student.lastName} - {student.studentNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Valor */}
                    <FormField
                      control={invoiceForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (AOA)</FormLabel>
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

                    {/* Descrição */}
                    <FormField
                      control={invoiceForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Mensalidade Janeiro 2024"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Data de Vencimento */}
                    <FormField
                      control={invoiceForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mês/Ano */}
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={invoiceForm.control}
                        name="month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mês</FormLabel>
                            <FormControl>
                              <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {MONTHS_PT.map((month, index) => (
                                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                                      {month}
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
                        control={invoiceForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="2020"
                                max="2030"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsNewInvoiceOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createInvoiceMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {createInvoiceMutation.isPending ? (
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Criar Fatura
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              valores recebidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valores Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(pendingAmount)}
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
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              faturas vencidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              no período
            </p>
          </CardContent>
        </Card>
      </div>

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
              value={monthFilter?.toString() || ''} 
              onValueChange={(value) => setMonthFilter(value ? parseInt(value) : undefined)}
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

      {/* Lista de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Faturas</span>
            {currentPagination && (
              <span className="text-sm text-muted-foreground">
                {currentPagination.total} fatura(s)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInvoices ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-32">Valor</TableHead>
                  <TableHead className="w-32">Pago</TableHead>
                  <TableHead className="w-32">Saldo</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Vencimento</TableHead>
                  <TableHead className="w-40">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    {/* Aluno */}
                    <TableCell className="font-medium">
                      <div>
                        <div>{invoice.student?.name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.student?.studentNumber}
                        </div>
                      </div>
                    </TableCell>

                    {/* Descrição */}
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {MONTHS_PT[invoice.month - 1]} {invoice.year}
                        </div>
                      </div>
                    </TableCell>

                    {/* Valor */}
                    <TableCell className="font-mono">
                      {formatCurrency(invoice.amount)}
                    </TableCell>

                    {/* Pago */}
                    <TableCell className="font-mono">
                      {formatCurrency(invoice.paidAmount)}
                    </TableCell>

                    {/* Saldo */}
                    <TableCell className="font-mono">
                      {formatCurrency(invoice.balance)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge className={InvoiceStatusColors[invoice.status]}>
                        {InvoiceStatusLabels[invoice.status]}
                      </Badge>
                    </TableCell>

                    {/* Vencimento */}
                    <TableCell className="text-sm">
                      {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: pt })}
                      {financialAPI.isOverdue(invoice.dueDate) && invoice.status !== 'PAGA' && (
                        <div className="text-xs text-red-600">
                          {financialAPI.calculateDebtAge(invoice.dueDate)} dias atraso
                        </div>
                      )}
                    </TableCell>

                    {/* Ações */}
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadPdf(invoice.id)}
                          title="Baixar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        {canManageFinance && invoice.status !== 'PAGA' && invoice.status !== 'CANCELADA' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenPayment(invoice)}
                            title="Registrar Pagamento"
                            className="text-green-600 hover:text-green-700"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}

                        {canManageFinance && invoice.status === 'PENDENTE' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelInvoice(invoice.id)}
                            title="Cancelar Fatura"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Paginação */}
          {currentPagination && currentPagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
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
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      {selectedInvoice && (
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="text-sm">
                <div><strong>Aluno:</strong> {selectedInvoice.student?.name}</div>
                <div><strong>Fatura:</strong> {selectedInvoice.description}</div>
                <div><strong>Valor Total:</strong> {formatCurrency(selectedInvoice.amount)}</div>
                <div><strong>Já Pago:</strong> {formatCurrency(selectedInvoice.paidAmount)}</div>
                <div><strong>Saldo:</strong> {formatCurrency(selectedInvoice.balance)}</div>
              </div>
            </div>
            
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(handleSubmitPayment)} className="space-y-4">
                {/* Valor */}
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

                {/* Método */}
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

                {/* Referência */}
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

                {/* Botões */}
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
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Registrar Pagamento
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Informações sobre Sistema Financeiro Angola */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema Financeiro Escolar Angola</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Funcionalidades:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="text-primary font-medium">Moeda:</span> Kwanza Angolano (AOA)</li>
                <li>• <span className="text-primary font-medium">Pagamentos:</span> Multicaixa, Express, PayWay</li>
                <li>• <span className="text-primary font-medium">Geração de PDF</span> automática</li>
                <li>• <span className="text-primary font-medium">Controle de vencimentos</span> e multas</li>
                <li>• <span className="text-primary font-medium">Histórico completo</span> por aluno</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Métodos de Pagamento:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="text-green-600 font-medium">💵 Dinheiro:</span> Pagamento presencial</li>
                <li>• <span className="text-blue-600 font-medium">🏦 Transferência:</span> Bancária</li>
                <li>• <span className="text-purple-600 font-medium">💳 Multicaixa:</span> Sistema nacional</li>
                <li>• <span className="text-orange-600 font-medium">📱 Express:</span> Mobile payment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}