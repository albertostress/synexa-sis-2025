/**
 * Finance Service - Serviço de gestão financeira escolar
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { FilterInvoicesDto, InvoiceStatus } from './dto/filter-invoices.dto';
import { InvoiceEntity, FinancialHistoryEntity } from './entities/invoice.entity';
// Template inline - não precisa de import externo
import axios from 'axios';

@Injectable()
export class FinanceService {
  private readonly playwrightServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.playwrightServiceUrl = process.env.PLAYWRIGHT_SERVICE_URL || 'http://playwright-service:3333';
  }

  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceEntity> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: createInvoiceDto.studentId },
      select: { id: true, firstName: true, lastName: true, parentEmail: true },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${createInvoiceDto.studentId} não encontrado`);
    }

    // Verificar se já existe fatura para o mesmo mês/ano
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        studentId: createInvoiceDto.studentId,
        month: createInvoiceDto.month,
        year: createInvoiceDto.year,
      },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        `Já existe uma fatura para ${student.firstName} ${student.lastName} no mês ${createInvoiceDto.month}/${createInvoiceDto.year}`
      );
    }

    // Criar a fatura
    const invoice = await this.prisma.invoice.create({
      data: {
        studentId: createInvoiceDto.studentId,
        amount: createInvoiceDto.amount,
        dueDate: new Date(createInvoiceDto.dueDate),
        description: createInvoiceDto.description,
        month: createInvoiceDto.month,
        year: createInvoiceDto.year,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
          },
        },
        payments: true,
      },
    });

    return this.mapInvoiceToEntity(invoice);
  }

  async findInvoices(filters: FilterInvoicesDto): Promise<{
    invoices: InvoiceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, ...filterConditions } = filters;
    const skip = (page - 1) * limit;

    // Construir condições de filtro
    const where: any = {};

    if (filterConditions.studentId) {
      where.studentId = filterConditions.studentId;
    }

    if (filterConditions.status) {
      where.status = filterConditions.status;
    }

    if (filterConditions.month) {
      where.month = filterConditions.month;
    }

    if (filterConditions.year) {
      where.year = filterConditions.year;
    }

    if (filterConditions.startDate || filterConditions.endDate) {
      where.dueDate = {};
      if (filterConditions.startDate) {
        where.dueDate.gte = new Date(filterConditions.startDate);
      }
      if (filterConditions.endDate) {
        where.dueDate.lte = new Date(filterConditions.endDate);
      }
    }

    // Buscar faturas com paginação
    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              parentEmail: true,
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    // Atualizar status das faturas vencidas
    await this.updateOverdueInvoices();

    const mappedInvoices = invoices.map(invoice => this.mapInvoiceToEntity(invoice));

    return {
      invoices: mappedInvoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findInvoiceById(id: string): Promise<InvoiceEntity> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Fatura com ID ${id} não encontrada`);
    }

    // Verificar se deve atualizar status para vencida
    if (invoice.status === 'PENDENTE' && new Date() > invoice.dueDate) {
      await this.prisma.invoice.update({
        where: { id },
        data: { status: 'VENCIDA' },
      });
      invoice.status = 'VENCIDA' as any;
    }

    return this.mapInvoiceToEntity(invoice);
  }

  async payInvoice(invoiceId: string, payInvoiceDto: PayInvoiceDto): Promise<InvoiceEntity> {
    // Buscar a fatura
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Fatura com ID ${invoiceId} não encontrada`);
    }

    if (invoice.status === 'PAGA') {
      throw new BadRequestException('Esta fatura já está totalmente paga');
    }

    if (invoice.status === 'CANCELADA') {
      throw new BadRequestException('Não é possível pagar uma fatura cancelada');
    }

    // Calcular total já pago
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = invoice.amount - totalPaid;

    if (payInvoiceDto.amount > remainingBalance) {
      throw new BadRequestException(
        `Valor do pagamento (${payInvoiceDto.amount}€) é maior que o saldo restante (${remainingBalance}€)`
      );
    }

    // Registrar o pagamento
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        amount: payInvoiceDto.amount,
        method: payInvoiceDto.method,
        reference: payInvoiceDto.reference,
      },
    });

    // Verificar se a fatura está totalmente paga
    const newTotalPaid = totalPaid + payInvoiceDto.amount;
    const newStatus = newTotalPaid >= invoice.amount ? 'PAGA' : invoice.status;

    // Atualizar status da fatura se necessário
    if (newStatus !== invoice.status) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus as any },
      });
    }

    // Buscar fatura atualizada
    const updatedInvoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
          },
        },
        payments: true,
      },
    });

    return this.mapInvoiceToEntity(updatedInvoice!);
  }

  async getStudentFinancialHistory(studentId: string): Promise<FinancialHistoryEntity> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        parentEmail: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${studentId} não encontrado`);
    }

    // Buscar todas as faturas do aluno
    const invoices = await this.prisma.invoice.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Atualizar status das faturas vencidas
    await this.updateOverdueInvoices();

    const mappedInvoices = invoices.map(invoice => this.mapInvoiceToEntity(invoice));

    // Calcular resumo financeiro
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      totalPaid: invoices.reduce((sum, inv) => 
        sum + inv.payments.reduce((paySum, payment) => paySum + payment.amount, 0), 0
      ),
      totalPending: 0,
      overdueCount: invoices.filter(inv => inv.status === 'VENCIDA').length,
    };

    summary.totalPending = summary.totalAmount - summary.totalPaid;

    return {
      student: {
        ...student,
        name: `${student.firstName} ${student.lastName}`,
        email: student.parentEmail,
      },
      invoices: mappedInvoices,
      summary,
    };
  }

  async cancelInvoice(invoiceId: string): Promise<InvoiceEntity> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Fatura com ID ${invoiceId} não encontrada`);
    }

    if (invoice.payments.length > 0) {
      throw new BadRequestException('Não é possível cancelar uma fatura que já tem pagamentos');
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELADA' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
          },
        },
        payments: true,
      },
    });

    return this.mapInvoiceToEntity(updatedInvoice);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Fatura com ID ${invoiceId} não encontrada`);
    }

    if (invoice.payments.length > 0) {
      throw new BadRequestException('Não é possível apagar uma fatura que já tem pagamentos');
    }

    await this.prisma.invoice.delete({
      where: { id: invoiceId },
    });
  }

  // ============= MÉTODOS AUXILIARES =============

  private async updateOverdueInvoices(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.invoice.updateMany({
      where: {
        status: 'PENDENTE',
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: 'VENCIDA',
      },
    });
  }

  async settleInvoice(id: string, body: { amount: number; method: string; paidAt?: Date }): Promise<InvoiceEntity> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    const addAmount = Number(body.amount);
    if (!addAmount || addAmount <= 0) {
      throw new BadRequestException('Valor inválido');
    }

    const currentPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const newPaid = currentPaid + addAmount;
    const totalAmount = Number(invoice.amount);
    
    let status: 'PAGA' | 'PENDENTE' | 'VENCIDA';
    if (newPaid >= totalAmount) {
      status = 'PAGA';
    } else {
      status = 'PENDENTE';
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.invoice.update({
        where: { id },
        data: { status },
      }),
      this.prisma.payment.create({
        data: {
          invoiceId: id,
          amount: addAmount,
          method: body.method as any, // PaymentMethod enum
          paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        },
      }),
    ]);

    const result = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
          },
        },
        payments: true,
      },
    });

    return this.mapInvoiceToEntity(result);
  }

  async getSummary(): Promise<any> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const [sumMonth, sumOverdue, paidCount, totalCount] = await Promise.all([
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: start } },
      }),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ['PENDENTE', 'VENCIDA'] },
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.invoice.count({ where: { status: 'PAGA' } }),
      this.prisma.invoice.count(),
    ]);

    const monthlyRevenue = Number(sumMonth._sum.amount || 0);
    const overdueAmount = Number(sumOverdue._sum.amount || 0);
    const collectionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
    const monthlyGoalProgress = monthlyRevenue > 0 ? Math.min(100, Math.round((monthlyRevenue / 100000) * 100)) : 0;

    return {
      monthlyRevenue,
      overdueAmount,
      collectionRate,
      monthlyGoalProgress,
      revenueGrowth: 0,
    };
  }

  private mapInvoiceToEntity(invoice: any): InvoiceEntity {
    const totalPaid = invoice.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const remainingBalance = invoice.amount - totalPaid;

    return {
      id: invoice.id,
      amount: invoice.amount,
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      status: invoice.status,
      description: invoice.description,
      month: invoice.month,
      year: invoice.year,
      student: {
        id: invoice.student.id,
        name: `${invoice.student.firstName} ${invoice.student.lastName}`,
        email: invoice.student.parentEmail,
        firstName: invoice.student.firstName,
        lastName: invoice.student.lastName,
        parentEmail: invoice.student.parentEmail,
      },
      payments: invoice.payments.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference,
        paidAt: payment.paidAt.toISOString(),
        createdAt: payment.createdAt.toISOString(),
      })),
      totalPaid,
      remainingBalance,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }

  /**
   * Enviar notificação para o responsável sobre uma fatura específica
   */
  async notifyInvoiceParent(id: string): Promise<any> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        student: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    // Simulação de envio de email
    // Em produção, integrar com serviço de email real
    const parentEmail = invoice.student.parentEmail;
    
    // Log da notificação
    console.log(`[NOTIFICAÇÃO] Enviando lembrete de fatura para: ${parentEmail}`);
    console.log(`[NOTIFICAÇÃO] Estudante: ${invoice.student.firstName} ${invoice.student.lastName}`);
    console.log(`[NOTIFICAÇÃO] Fatura: ${invoice.description} - ${invoice.amount} AOA`);
    console.log(`[NOTIFICAÇÃO] Vencimento: ${invoice.dueDate}`);
    console.log(`[NOTIFICAÇÃO] Status: ${invoice.status}`);

    return {
      success: true,
      message: 'Notificação enviada com sucesso',
      emailSent: parentEmail,
      invoice: {
        id: invoice.id,
        description: invoice.description,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        status: invoice.status,
      },
    };
  }

  /**
   * Enviar lembretes para todos os responsáveis com faturas vencidas
   */
  async sendOverdueReminders(): Promise<any> {
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: 'VENCIDA',
      },
      include: {
        student: true,
      },
    });

    const notifications = [];
    
    for (const invoice of overdueInvoices) {
      const parentEmail = invoice.student.parentEmail;
      
      // Simulação de envio de email
      console.log(`[LEMBRETE VENCIDO] Enviando para: ${parentEmail}`);
      console.log(`[LEMBRETE VENCIDO] Estudante: ${invoice.student.firstName} ${invoice.student.lastName}`);
      console.log(`[LEMBRETE VENCIDO] Fatura: ${invoice.description} - ${invoice.amount} AOA`);
      
      notifications.push({
        studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
        email: parentEmail,
        invoiceId: invoice.id,
      });
    }

    return {
      success: true,
      count: notifications.length,
      message: `Lembretes enviados para ${notifications.length} responsáveis`,
      notifications,
    };
  }

  /**
   * Gerar PDF da fatura (Fatura para pendentes, Recibo para pagas)
   */
  async generateInvoicePDF(id: string): Promise<Buffer> {
    // Buscar fatura com todos os dados necessários
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            enrollments: {
              where: {
                year: new Date().getFullYear(),
              },
              include: {
                class: true,
              },
              take: 1,
            },
          },
        },
        payments: {
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    // Preparar dados para o template
    const isPaid = invoice.status === 'PAGA';
    const documentType = isPaid ? 'FACTURA RECIBO' : 'FACTURA';
    const documentNumber = `${isPaid ? 'FR' : 'FT'} VSOA${invoice.id.substring(0, 3)}${invoice.year}/${invoice.id.substring(3, 6).toUpperCase()}`;
    const currentDate = new Date();
    
    // Dados extraídos
    const student = invoice.student;
    const payments = invoice.payments || [];
    const currentClass = student.enrollments?.[0]?.class?.name || '';
    
    const formattedDate = currentDate.toLocaleString('pt-AO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '');

    // Gerar HTML inline com design moderno
    const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentType} - ${documentNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.3;
      color: #000;
      background: white;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 15mm;
      background: white;
      position: relative;
    }
    
    /* Header Section */
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 3mm;
      margin-bottom: 5mm;
    }
    
    .logo-area {
      flex: 1;
    }
    
    .logo-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0066cc, #003d7a);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .school-name {
      font-size: 18pt;
      font-weight: 700;
      color: #003d7a;
      margin-bottom: 2px;
      letter-spacing: -0.5px;
    }
    
    .school-tagline {
      font-size: 8pt;
      color: #666;
      font-style: italic;
    }
    
    .contact-info {
      text-align: right;
      font-size: 8pt;
      color: #333;
      line-height: 1.4;
    }
    
    .contact-info div {
      margin-bottom: 2px;
    }
    
    /* Document Title Box */
    .document-header {
      background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 12px 20px;
      margin: 15px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .document-title {
      font-size: 14pt;
      font-weight: 700;
      color: #000;
    }
    
    .document-info {
      text-align: right;
      font-size: 9pt;
    }
    
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: 600;
      margin-left: 5px;
      background: #d4edda;
      color: #155724;
    }
    
    /* Two Column Layout */
    .two-column {
      display: flex;
      gap: 20px;
      margin: 15px 0;
    }
    
    .left-column {
      flex: 1.2;
    }
    
    .right-column {
      flex: 1;
    }
    
    /* Info Box */
    .info-box {
      background: #ffffff;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 15px;
    }
    
    .info-box-title {
      font-size: 9pt;
      font-weight: 700;
      color: #495057;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 4px;
      font-size: 9pt;
    }
    
    .info-label {
      min-width: 80px;
      color: #6c757d;
    }
    
    .info-value {
      flex: 1;
      color: #000;
      font-weight: 500;
    }
    
    /* Main Table */
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .invoice-table thead {
      background: #f8f9fa;
    }
    
    .invoice-table th {
      padding: 10px 12px;
      text-align: left;
      font-size: 9pt;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .invoice-table td {
      padding: 12px;
      font-size: 9pt;
      border-bottom: 1px solid #e9ecef;
      color: #212529;
    }
    
    .invoice-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .item-description {
      font-weight: 600;
      color: #000;
      margin-bottom: 2px;
    }
    
    .item-reference {
      font-size: 8pt;
      color: #6c757d;
    }
    
    /* Totals Section */
    .totals-container {
      display: flex;
      justify-content: flex-end;
      margin: 20px 0;
    }
    
    .totals-box {
      width: 320px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 15px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 9pt;
    }
    
    .total-row.subtotal {
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    
    .total-row.grand-total {
      border-top: 2px solid #495057;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 12pt;
      font-weight: 700;
    }
    
    .total-label {
      color: #495057;
    }
    
    .total-value {
      color: #000;
      font-weight: 600;
    }
    
    .grand-total .total-value {
      color: ${isPaid ? '#28a745' : '#dc3545'};
    }
    
    /* Payment Section */
    .payment-section {
      background: ${isPaid ? '#d4edda' : '#fff3cd'};
      border: 1px solid ${isPaid ? '#c3e6cb' : '#ffeeba'};
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
    }
    
    .payment-title {
      font-size: 10pt;
      font-weight: 700;
      color: ${isPaid ? '#155724' : '#856404'};
      margin-bottom: 10px;
    }
    
    .payment-details {
      font-size: 9pt;
      line-height: 1.5;
      color: ${isPaid ? '#155724' : '#856404'};
    }
    
    .payment-row {
      display: flex;
      margin-bottom: 3px;
    }
    
    .payment-label {
      min-width: 120px;
      font-weight: 600;
    }
    
    /* Bank Details */
    .bank-section {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }
    
    .bank-title {
      font-size: 9pt;
      font-weight: 700;
      color: #495057;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .bank-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    
    .bank-item {
      font-size: 8pt;
      line-height: 1.4;
    }
    
    .bank-name {
      font-weight: 700;
      color: #000;
      margin-bottom: 2px;
    }
    
    .bank-detail {
      color: #495057;
      word-break: break-all;
    }
    
    /* Footer */
    .footer-section {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #dee2e6;
    }
    
    .footer-notes {
      font-size: 8pt;
      color: #6c757d;
      line-height: 1.4;
      margin-bottom: 10px;
    }
    
    .processing-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 15px;
    }
    
    .qr-placeholder {
      width: 60px;
      height: 60px;
      border: 2px solid #dee2e6;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7pt;
      color: #adb5bd;
      background: white;
    }
    
    .processing-text {
      font-size: 7pt;
      color: #6c757d;
      text-align: right;
      line-height: 1.3;
    }
    
    .iva-notice {
      font-size: 8pt;
      color: #6c757d;
      font-style: italic;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header-top">
      <div class="logo-area">
        <div class="logo-circle">CI</div>
        <div class="school-name">CASA INGLESA</div>
        <div class="school-tagline">ENSINO - ESCOLA E CLÍNICA PSICOLÓGICA<br>DE AUTO MELHORIA</div>
      </div>
      <div class="contact-info">
        <div>📍 Bairro Benfica, Desvio do Tombua</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;defronte ao Condomínio Residencial "Boa Vida"</div>
        <div>📞 923728235 / 941048407</div>
        <div>📱 941048407</div>
      </div>
    </div>
    
    <!-- Document Header -->
    <div class="document-header">
      <div>
        <div class="document-title">${documentType} nº: ${documentNumber}</div>
      </div>
      <div class="document-info">
        <div>Estado: <span class="status-badge">Normal</span> / 2ª Via</div>
        <div style="margin-top: 3px;">Operador: Casa Inglesa (500090073)</div>
        <div>Data de Emissão: ${formattedDate}</div>
      </div>
    </div>
    
    <!-- Two Column Layout -->
    <div class="two-column">
      <div class="left-column">
        <div class="info-box">
          <div class="info-box-title">Dados do Cliente</div>
          <div class="info-row">
            <span class="info-label">Nome:</span>
            <span class="info-value">${student.firstName} ${student.lastName} (${student.id.substring(0, 6).toUpperCase()})</span>
          </div>
          <div class="info-row">
            <span class="info-label">Morada:</span>
            <span class="info-value">Belas, Angola</span>
          </div>
          <div class="info-row">
            <span class="info-label">Telef.:</span>
            <span class="info-value">${student.parentPhone || '923013098'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">NIF:</span>
            <span class="info-value">${student.biNumber || 'Consumidor final'}</span>
          </div>
        </div>
      </div>
      
      <div class="right-column">
        <div class="info-box">
          <div class="info-box-title">Informação Escolar</div>
          <div class="info-row">
            <span class="info-label">Classe:</span>
            <span class="info-value">${currentClass || 'ENSINO PRIMÁRIO - 1ª Classe'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Regime:</span>
            <span class="info-value">INTEGRAL - C</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Invoice Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 45%">Artigo / Descrição</th>
          <th class="text-center" style="width: 10%">Quant.</th>
          <th class="text-right" style="width: 15%">P. Unit.</th>
          <th class="text-center" style="width: 10%">Desc. (%)</th>
          <th class="text-center" style="width: 10%">Taxa (%)</th>
          <th class="text-right" style="width: 15%">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-description">${invoice.description}</div>
            <div class="item-reference">ref: ${this.getMonthName(invoice.month)} / ${invoice.year}</div>
          </td>
          <td class="text-center">1,00</td>
          <td class="text-right">${this.formatCurrency(Number(invoice.amount))}</td>
          <td class="text-center">0,00</td>
          <td class="text-center">0,00</td>
          <td class="text-right"><strong>${this.formatCurrency(Number(invoice.amount))}</strong></td>
        </tr>
      </tbody>
    </table>
    
    <div class="iva-notice">IVA – Regime de exclusão</div>
    
    <!-- Tax Summary -->
    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
      <table style="width: 100%; font-size: 8pt;">
        <tr>
          <td style="width: 20%"><strong>Taxa (%)</strong></td>
          <td style="width: 20%"><strong>Designação</strong></td>
          <td style="width: 20%; text-align: right;"><strong>Base Incidência</strong></td>
          <td style="width: 20%; text-align: right;"><strong>Valor Imp.</strong></td>
        </tr>
        <tr>
          <td>0,00</td>
          <td>IVA</td>
          <td style="text-align: right;">${this.formatCurrency(Number(invoice.amount))}</td>
          <td style="text-align: right;">0,00</td>
        </tr>
      </table>
    </div>
    
    <!-- Totals -->
    <div class="totals-container">
      <div class="totals-box">
        <div class="total-row">
          <span class="total-label">Total Ilíquido:</span>
          <span class="total-value">${this.formatCurrency(Number(invoice.amount))}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Descontos comerciais:</span>
          <span class="total-value">0,00</span>
        </div>
        <div class="total-row">
          <span class="total-label">Descontos financeiros:</span>
          <span class="total-value">0,00</span>
        </div>
        <div class="total-row subtotal">
          <span class="total-label">Total Impostos:</span>
          <span class="total-value">0,00</span>
        </div>
        <div class="total-row grand-total">
          <span class="total-label">TOTAL A PAGAR:</span>
          <span class="total-value">${this.formatCurrency(Number(invoice.amount))}</span>
        </div>
      </div>
    </div>
    
    <!-- Payment Section -->
    ${isPaid && payments.length > 0 ? `
    <div class="payment-section">
      <div class="payment-title">Pagamento:</div>
      <div class="payment-details">
        <div class="payment-row">
          <span class="payment-label">${this.formatPaymentMethod(payments[0].method)}:</span>
          <span>Oper. ${payments[0].reference || '-0001-11-30'}</span>
          <span style="margin-left: 20px; font-weight: 700;">${this.formatCurrency(Number(invoice.amount))}</span>
        </div>
      </div>
    </div>
    ` : `
    <div class="payment-section">
      <div class="payment-title">⚠️ AGUARDANDO PAGAMENTO</div>
      <div class="payment-details">
        <div class="payment-row">
          <span class="payment-label">Data de Vencimento:</span>
          <span>${new Date(invoice.dueDate).toLocaleDateString('pt-AO')}</span>
        </div>
        <div class="payment-row">
          <span class="payment-label">Valor a Pagar:</span>
          <span style="font-weight: 700;">${this.formatCurrency(Number(invoice.amount))}</span>
        </div>
      </div>
    </div>
    `}
    
    <!-- Bank Details -->
    <div class="bank-section">
      <div class="bank-title">Coordenadas bancárias:</div>
      <div class="bank-grid">
        <div class="bank-item">
          <div class="bank-name">* BAI</div>
          <div class="bank-detail">Conta: 009314804010001</div>
          <div class="bank-detail">IBAN: AO06 0040 0000 9314 8040 1017 0</div>
          <div class="bank-detail">Titular: CASA INGLESA</div>
        </div>
        <div class="bank-item">
          <div class="bank-name">* BCA</div>
          <div class="bank-detail">Conta: 000900101910001</div>
          <div class="bank-detail">IBAN: AO06 0043 0000 0900 1019 1011 1</div>
          <div class="bank-detail">Titular: CASA INGLESA</div>
        </div>
        <div class="bank-item">
          <div class="bank-name">* BSOL</div>
          <div class="bank-detail">Conta: 12414913710001</div>
          <div class="bank-detail">IBAN: AO06 0044 0000 2414 9137 1018 5</div>
          <div class="bank-detail">Titular: CASA INGLESA</div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer-section">
      <div class="footer-notes">
        * Os bens/serviços foram colocados a disposição do adquirente na data do documento.
      </div>
      
      <div class="processing-info">
        <div class="qr-placeholder">
          <div>QR</div>
        </div>
        <div class="processing-text">
          NIF: 5000461563<br>
          8qNl-Processado por programa validado nº 271/AGT/2020 - GME Sílica. | Pág. 1 / 1
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Converter HTML para PDF usando Playwright Service
    try {
      // Enviar HTML para o serviço Playwright
      const response = await axios.post(
        `${this.playwrightServiceUrl}/generate-pdf`,
        {
          html,
          options: {
            format: 'A4',
            printBackground: true,
            margin: {
              top: '10mm',
              right: '10mm',
              bottom: '10mm',
              left: '10mm',
            },
          },
        },
        {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Retornar o PDF gerado
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Erro ao gerar PDF via Playwright Service:', error);
      
      // Fallback: tentar gerar localmente se o serviço não estiver disponível
      console.log('Tentando fallback para geração local...');
      
      // Se falhar, retornar erro apropriado
      throw new Error('Não foi possível gerar o PDF. Serviço temporariamente indisponível.');
    }
  }

  /**
   * Formatar método de pagamento para exibição
   */
  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      'DINHEIRO': 'Dinheiro',
      'TRANSFERENCIA': 'Transferência Bancária',
      'MULTICAIXA': 'Multicaixa',
      'EXPRESS': 'Multicaixa Express',
      'PAYWAY': 'PayWay',
      'CARTAO': 'Cartão de Crédito/Débito',
      'CHEQUE': 'Cheque',
    };
    return methods[method] || method;
  }

  /**
   * Formatar valor para moeda (Kwanza)
   */
  private formatCurrency(value: number): string {
    // Formatar com espaço como separador de milhares e vírgula para decimais
    return value.toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',00 Kz';
  }

  /**
   * Obtém nome do mês
   */
  private getMonthName(month: number): string {
    const months = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ];
    return months[month - 1] || '';
  }
}