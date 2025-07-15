/**
 * Filter Invoices DTO - DTO para filtrar faturas
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsUUID, 
  IsEnum, 
  IsInt, 
  Min, 
  Max,
  IsDateString 
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum InvoiceStatus {
  PENDENTE = 'PENDENTE',
  PAGA = 'PAGA',
  VENCIDA = 'VENCIDA',
  CANCELADA = 'CANCELADA',
}

export class FilterInvoicesDto {
  @ApiProperty({
    description: 'ID do aluno para filtrar (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do aluno deve ser um UUID válido' })
  studentId?: string;

  @ApiProperty({
    description: 'Status da fatura para filtrar (opcional)',
    enum: InvoiceStatus,
    example: InvoiceStatus.PENDENTE,
    required: false,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus, { message: 'Status da fatura inválido' })
  status?: InvoiceStatus;

  @ApiProperty({
    description: 'Mês de referência para filtrar (1-12, opcional)',
    example: 8,
    minimum: 1,
    maximum: 12,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês deve ser entre 1 e 12' })
  month?: number;

  @ApiProperty({
    description: 'Ano de referência para filtrar (opcional)',
    example: 2024,
    minimum: 2020,
    maximum: 2030,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2020, { message: 'Ano deve ser maior ou igual a 2020' })
  @Max(2030, { message: 'Ano deve ser menor ou igual a 2030' })
  year?: number;

  @ApiProperty({
    description: 'Data inicial para filtrar por período (opcional)',
    example: '2024-08-01',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve estar no formato ISO (YYYY-MM-DD)' })
  startDate?: string;

  @ApiProperty({
    description: 'Data final para filtrar por período (opcional)',
    example: '2024-08-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data final deve estar no formato ISO (YYYY-MM-DD)' })
  endDate?: string;

  @ApiProperty({
    description: 'Página para paginação (opcional, padrão: 1)',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior que zero' })
  page?: number = 1;

  @ApiProperty({
    description: 'Limite de itens por página (opcional, padrão: 10)',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior que zero' })
  @Max(100, { message: 'Limite deve ser no máximo 100' })
  limit?: number = 10;
}