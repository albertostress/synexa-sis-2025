/**
 * Invoice Entity - Entidade de fatura para documentação Swagger
 * Referência: context7 mcp - NestJS Entities Pattern
 */
import { ApiProperty } from '@nestjs/swagger';

export class PaymentEntity {
  @ApiProperty({
    description: 'ID único do pagamento',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Valor pago em euros',
    example: 85.50,
  })
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento utilizado',
    example: 'TRANSFERENCIA',
    enum: ['DINHEIRO', 'TRANSFERENCIA', 'MULTIBANCO', 'MBWAY', 'CARTAO', 'CHEQUE'],
  })
  method: string;

  @ApiProperty({
    description: 'Referência do pagamento',
    example: 'TRF20240815001',
    required: false,
  })
  reference?: string;

  @ApiProperty({
    description: 'Data e hora do pagamento',
    example: '2024-08-15T14:30:00.000Z',
  })
  paidAt: string;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-08-15T14:30:00.000Z',
  })
  createdAt: string;
}

export class StudentBasicInfo {
  @ApiProperty({
    description: 'ID único do aluno',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do aluno',
    example: 'João Silva Santos',
  })
  name: string;

  @ApiProperty({
    description: 'Email do aluno',
    example: 'joao.santos@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Primeiro nome do aluno',
    example: 'João',
  })
  firstName: string;

  @ApiProperty({
    description: 'Último nome do aluno', 
    example: 'Silva Santos',
  })
  lastName: string;

  @ApiProperty({
    description: 'Email dos pais',
    example: 'pais.joao@email.com',
  })
  parentEmail: string;
}

export class InvoiceEntity {
  @ApiProperty({
    description: 'ID único da fatura',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Valor total da fatura em euros',
    example: 85.50,
  })
  amount: number;

  @ApiProperty({
    description: 'Data de vencimento',
    example: '2024-08-15',
  })
  dueDate: string;

  @ApiProperty({
    description: 'Status atual da fatura',
    example: 'PENDENTE',
    enum: ['PENDENTE', 'PAGA', 'VENCIDA', 'CANCELADA'],
  })
  status: string;

  @ApiProperty({
    description: 'Descrição da fatura',
    example: 'Mensalidade - Agosto 2024',
  })
  description: string;

  @ApiProperty({
    description: 'Mês de referência (1-12)',
    example: 8,
  })
  month: number;

  @ApiProperty({
    description: 'Ano de referência',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Informações básicas do aluno',
    type: StudentBasicInfo,
  })
  student: StudentBasicInfo;

  @ApiProperty({
    description: 'Lista de pagamentos realizados',
    type: [PaymentEntity],
  })
  payments: PaymentEntity[];

  @ApiProperty({
    description: 'Total pago até o momento',
    example: 42.75,
  })
  totalPaid: number;

  @ApiProperty({
    description: 'Saldo restante a pagar',
    example: 42.75,
  })
  remainingBalance: number;

  @ApiProperty({
    description: 'Data de criação da fatura',
    example: '2024-07-15T10:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-08-15T14:30:00.000Z',
  })
  updatedAt: string;
}

export class FinancialHistoryEntity {
  @ApiProperty({
    description: 'Informações do aluno',
    type: StudentBasicInfo,
  })
  student: StudentBasicInfo;

  @ApiProperty({
    description: 'Lista de faturas do aluno',
    type: [InvoiceEntity],
  })
  invoices: InvoiceEntity[];

  @ApiProperty({
    description: 'Resumo financeiro',
    type: 'object',
    properties: {
      totalInvoices: { type: 'number', example: 10 },
      totalAmount: { type: 'number', example: 855.00 },
      totalPaid: { type: 'number', example: 427.50 },
      totalPending: { type: 'number', example: 427.50 },
      overdueCount: { type: 'number', example: 2 },
    },
  })
  summary: {
    totalInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    overdueCount: number;
  };
}