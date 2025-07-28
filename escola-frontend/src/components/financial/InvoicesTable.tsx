import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Eye,
  Download,
  CreditCard,
  Mail,
  MoreHorizontal,
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Send,
  Copy,
  FileText,
  CalendarDays,
  User,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatCurrency } from '@/types/finance';
import { financialAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface InvoicesTableProps {
  invoices: any[];
  isLoading: boolean;
  pagination?: {
    page: number;
    pages: number;
    total: number;
  };
  onViewInvoice: (invoice: any) => void;
  onPayInvoice: (invoice: any) => void;
  onCancelInvoice: (invoiceId: string) => void;
  onRefresh: () => void;
  canManage: boolean;
}

export function InvoicesTable({
  invoices,
  isLoading,
  pagination,
  onViewInvoice,
  onPayInvoice,
  onCancelInvoice,
  onRefresh,
  canManage,
}: InvoicesTableProps) {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Status colors and icons
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

  const handleDownloadPdf = async (invoice: any) => {
    setActionLoading(prev => ({ ...prev, [`download_${invoice.id}`]: true }));
    try {
      const filename = `fatura_${invoice.student?.name?.replace(/\s+/g, '_')}_${invoice.month}_${invoice.year}.pdf`;
      await financialAPI.downloadInvoicePdf(invoice.id, filename);
      
      toast({
        title: 'PDF Baixado',
        description: 'A fatura foi baixada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao Baixar PDF',
        description: 'Não foi possível baixar a fatura. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`download_${invoice.id}`]: false }));
    }
  };

  const handleSendReminder = async (invoice: any) => {
    setActionLoading(prev => ({ ...prev, [`reminder_${invoice.id}`]: true }));
    try {
      // Simular envio de lembrete - conectar com backend real depois
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Lembrete Enviado',
        description: `Lembrete enviado para ${invoice.student?.name}`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao Enviar Lembrete',
        description: 'Não foi possível enviar o lembrete.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`reminder_${invoice.id}`]: false }));
    }
  };

  const handleCopyInvoiceDetails = (invoice: any) => {
    const details = `
Fatura: ${financialAPI.formatInvoiceNumber(invoice.id, invoice.month, invoice.year)}
Aluno: ${invoice.student?.name}
Valor: ${formatCurrency(invoice.amount)}
Vencimento: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: pt })}
Status: ${getStatusLabel(invoice.status)}
    `.trim();
    
    navigator.clipboard.writeText(details);
    toast({
      title: 'Detalhes Copiados',
      description: 'Os detalhes da fatura foram copiados.',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'PAGA': 'Paga',
      'PENDENTE': 'Pendente',
      'VENCIDA': 'Vencida',
      'PARCIAL': 'Pagamento Parcial',
      'CANCELADA': 'Cancelada',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma fatura encontrada</p>
            <p className="text-sm">Ajuste os filtros ou crie uma nova fatura</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Faturas ({invoices.length})</span>
          {pagination && (
            <span className="text-sm text-muted-foreground font-normal">
              Página {pagination.page} de {pagination.pages} • {pagination.total} total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Aluno</span>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Categoria</span>
                  </div>
                </TableHead>
                <TableHead className="w-[120px]">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Valor</span>
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>Vencimento</span>
                  </div>
                </TableHead>
                <TableHead className="w-[140px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const statusConfig = getStatusConfig(invoice.status);
                const StatusIcon = statusConfig.icon;
                const isOverdue = financialAPI.isOverdue(invoice.dueDate) && invoice.status !== 'PAGA';
                const debtAge = isOverdue ? financialAPI.calculateDebtAge(invoice.dueDate) : 0;

                return (
                  <TableRow key={invoice.id} className="hover:bg-muted/30">
                    {/* Aluno */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {invoice.student?.firstName} {invoice.student?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.student?.studentNumber} • {invoice.student?.academicYear}º Ano
                        </div>
                        {invoice.student?.classId && (
                          <Badge variant="outline" className="text-xs">
                            {invoice.student.classId}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Categoria/Descrição */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{invoice.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][invoice.month - 1]} {invoice.year}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          #{financialAPI.formatInvoiceNumber(invoice.id, invoice.month, invoice.year)}
                        </div>
                      </div>
                    </TableCell>

                    {/* Valor */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono font-medium">
                          {formatCurrency(invoice.amount)}
                        </div>
                        {invoice.paidAmount > 0 && (
                          <div className="text-xs text-green-600">
                            Pago: {formatCurrency(invoice.paidAmount)}
                          </div>
                        )}
                        {invoice.balance > 0 && (
                          <div className="text-xs text-red-600">
                            Saldo: {formatCurrency(invoice.balance)}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge className={statusConfig.color} variant="outline">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {getStatusLabel(invoice.status)}
                      </Badge>
                      {isOverdue && (
                        <div className="text-xs text-red-600 mt-1">
                          {debtAge} dias atraso
                        </div>
                      )}
                    </TableCell>

                    {/* Vencimento */}
                    <TableCell>
                      <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: pt })}
                      </div>
                      {isOverdue && (
                        <div className="flex items-center text-xs text-red-600 mt-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Vencida
                        </div>
                      )}
                    </TableCell>

                    {/* Ações */}
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {/* Visualizar */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewInvoice(invoice)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Download PDF */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadPdf(invoice)}
                          disabled={actionLoading[`download_${invoice.id}`]}
                          title="Baixar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {/* Mais ações */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {/* Registrar Pagamento */}
                            {canManage && invoice.status !== 'PAGA' && invoice.status !== 'CANCELADA' && (
                              <DropdownMenuItem 
                                onClick={() => onPayInvoice(invoice)}
                                className="text-green-600"
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Registrar Pagamento
                              </DropdownMenuItem>
                            )}

                            {/* Enviar Lembrete */}
                            {(invoice.status === 'PENDENTE' || invoice.status === 'VENCIDA') && (
                              <DropdownMenuItem 
                                onClick={() => handleSendReminder(invoice)}
                                disabled={actionLoading[`reminder_${invoice.id}`]}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                {actionLoading[`reminder_${invoice.id}`] ? 'Enviando...' : 'Enviar Lembrete'}
                              </DropdownMenuItem>
                            )}

                            {/* Copiar Detalhes */}
                            <DropdownMenuItem onClick={() => handleCopyInvoiceDetails(invoice)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Detalhes
                            </DropdownMenuItem>

                            {/* Cancelar Fatura */}
                            {canManage && invoice.status === 'PENDENTE' && (
                              <>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Cancelar Fatura
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancelar Fatura</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja cancelar esta fatura? 
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Não, manter fatura</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => onCancelInvoice(invoice.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Sim, cancelar fatura
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}