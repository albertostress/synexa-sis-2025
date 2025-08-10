/**
 * Finance Controller - Controle de gestão financeira escolar
 * Referência: context7 mcp - NestJS Controllers Pattern
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { FilterInvoicesDto } from './dto/filter-invoices.dto';
import { InvoiceEntity, FinancialHistoryEntity } from './entities/invoice.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PdfService } from '../documents/pdf/pdf.service';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly pdfService: PdfService,
  ) {}

  @Post('invoices')
  @Roles('ADMIN', 'SECRETARIA')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova fatura' })
  @ApiResponse({
    status: 201,
    description: 'Fatura criada com sucesso',
    type: InvoiceEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou fatura já existe para o período',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto): Promise<InvoiceEntity> {
    return this.financeService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Listar faturas com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        invoices: { type: 'array', items: { $ref: '#/components/schemas/InvoiceEntity' } },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  async findInvoices(@Query() filters: FilterInvoicesDto): Promise<{
    invoices: InvoiceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.financeService.findInvoices(filters);
  }

  @Get('invoice/:id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar fatura por ID' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura encontrada com sucesso',
    type: InvoiceEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Fatura não encontrada',
  })
  async findInvoiceById(@Param('id', ParseUUIDPipe) id: string): Promise<InvoiceEntity> {
    return this.financeService.findInvoiceById(id);
  }

  // Mudado para pdf-old - usar o endpoint na linha 287 que tem o design novo
  @Get('invoice/:id/pdf-old')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Gerar e baixar fatura em PDF' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'PDF da fatura gerado com sucesso',
    headers: {
      'Content-Type': { description: 'application/pdf' },
      'Content-Disposition': { description: 'attachment; filename="fatura.pdf"' },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Fatura não encontrada',
  })
  async downloadInvoicePdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const invoice = await this.financeService.findInvoiceById(id);
    
    // Preparar dados para o template
    const invoiceData = {
      ...invoice,
      institutionName: 'Escola Synexa',
      institutionAddress: 'Rua das Flores, 123 - Centro',
      city: 'São Paulo - SP',
      invoiceNumber: `FAT-${invoice.id.substring(0, 8).toUpperCase()}`,
      issueDate: new Date().toLocaleDateString('pt-BR'),
      issuer: 'Sistema Synexa-SIS',
      issuerRole: 'Sistema de Gestão Escolar',
      multibancoRef: `${Math.floor(Math.random() * 999999999)}`, // Gerar referência mock
    };

    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoiceData);
    
    const filename = `fatura_${invoice.student.name.replace(/\s+/g, '_')}_${invoice.month}_${invoice.year}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  }

  @Post('invoices/:id/payments')
  @Roles('ADMIN', 'SECRETARIA')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar pagamento de fatura (total ou parcial)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Pagamento registrado com sucesso',
    type: InvoiceEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos, fatura já paga ou valor excede saldo',
  })
  @ApiResponse({
    status: 404,
    description: 'Fatura não encontrada',
  })
  async settleInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { amount: number; method: string; paidAt?: Date },
  ): Promise<InvoiceEntity> {
    return this.financeService.settleInvoice(id, body);
  }

  @Get('student/:id/history')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Obter histórico financeiro completo do aluno' })
  @ApiParam({ name: 'id', description: 'ID do aluno' })
  @ApiResponse({
    status: 200,
    description: 'Histórico financeiro retornado com sucesso',
    type: FinancialHistoryEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async getStudentFinancialHistory(
    @Param('id', ParseUUIDPipe) studentId: string,
  ): Promise<FinancialHistoryEntity> {
    return this.financeService.getStudentFinancialHistory(studentId);
  }

  @Post('invoice/:id/cancel')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar fatura (apenas ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura cancelada com sucesso',
    type: InvoiceEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível cancelar fatura com pagamentos',
  })
  @ApiResponse({
    status: 404,
    description: 'Fatura não encontrada',
  })
  async cancelInvoice(@Param('id', ParseUUIDPipe) id: string): Promise<InvoiceEntity> {
    return this.financeService.cancelInvoice(id);
  }

  @Delete('invoice/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Apagar fatura (apenas ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 204,
    description: 'Fatura apagada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível apagar fatura com pagamentos',
  })
  @ApiResponse({
    status: 404,
    description: 'Fatura não encontrada',
  })
  async deleteInvoice(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.financeService.deleteInvoice(id);
  }

  // ============= ENDPOINTS PARA RELATÓRIOS =============

  @Get('summary')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Resumo financeiro geral com KPIs' })
  @ApiQuery({ name: 'year', description: 'Ano para filtrar', required: false })
  @ApiQuery({ name: 'month', description: 'Mês para filtrar', required: false })
  @ApiResponse({
    status: 200,
    description: 'Resumo financeiro retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string', example: '2024-08' },
        totalInvoices: { type: 'number', example: 150 },
        totalAmount: { type: 'number', example: 12825.00 },
        totalPaid: { type: 'number', example: 9500.00 },
        totalPending: { type: 'number', example: 3325.00 },
        overdueInvoices: { type: 'number', example: 8 },
        overdueAmount: { type: 'number', example: 680.00 },
        paymentMethods: {
          type: 'object',
          properties: {
            TRANSFERENCIA: { type: 'number', example: 5200.00 },
            MULTIBANCO: { type: 'number', example: 3100.00 },
            DINHEIRO: { type: 'number', example: 1200.00 },
          },
        },
      },
    },
  })
  async getSummary(): Promise<any> {
    return this.financeService.getSummary();
  }

  // ============= ENDPOINTS DE PDF =============

  @Get('invoice/:id/pdf')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Gerar PDF da fatura (Fatura para pendentes, Recibo para pagas)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Fatura não encontrada',
  })
  async generateInvoicePDF(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: any,
  ): Promise<void> {
    const pdfBuffer = await this.financeService.generateInvoicePDF(id);
    
    // Adicionar headers CORS manualmente quando usando @Res()
    res.set({
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3001',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="fatura_${id.substring(0, 8)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  // ============= ENDPOINTS DE NOTIFICAÇÃO =============

  @Post('invoice/:id/notify')
  @Roles('ADMIN', 'SECRETARIA')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar notificação para o responsável sobre uma fatura específica' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Notificação enviada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Notificação enviada com sucesso' },
        emailSent: { type: 'string', example: 'parent@email.com' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Fatura não encontrada',
  })
  async notifyInvoiceParent(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.financeService.notifyInvoiceParent(id);
  }

  @Post('notifications/overdue')
  @Roles('ADMIN', 'SECRETARIA')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar lembretes para todos os responsáveis com faturas vencidas' })
  @ApiResponse({
    status: 200,
    description: 'Lembretes enviados com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        count: { type: 'number', example: 5 },
        message: { type: 'string', example: 'Lembretes enviados para 5 responsáveis' },
      },
    },
  })
  async sendOverdueReminders(): Promise<any> {
    return this.financeService.sendOverdueReminders();
  }
}