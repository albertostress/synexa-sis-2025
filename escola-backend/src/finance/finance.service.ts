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

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceEntity> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: createInvoiceDto.studentId },
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
        `Já existe uma fatura para ${student.name} no mês ${createInvoiceDto.month}/${createInvoiceDto.year}`
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
            name: true,
            email: true,
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
              name: true,
              email: true,
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
            name: true,
            email: true,
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
            name: true,
            email: true,
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
            name: true,
            email: true,
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
        name: true,
        email: true,
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
            name: true,
            email: true,
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
      student,
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
            name: true,
            email: true,
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
        name: invoice.student.name,
        email: invoice.student.email,
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
}