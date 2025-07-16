/**
 * View Payments DTO - DTO para consulta de pagamentos
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PaymentStatusFilter {
  ALL = 'ALL',
  PENDENTE = 'PENDENTE',
  PAGA = 'PAGA',
  VENCIDA = 'VENCIDA',
}

export class ViewPaymentsDto {
  @ApiProperty({
    description: 'Ano letivo para filtrar (opcional)',
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
    description: 'Status do pagamento para filtrar (opcional)',
    enum: PaymentStatusFilter,
    example: PaymentStatusFilter.PENDENTE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentStatusFilter, { message: 'Status de pagamento inválido' })
  status?: PaymentStatusFilter;

  @ApiProperty({
    description: 'Limite de itens (opcional, padrão: 20)',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior que zero' })
  @Max(100, { message: 'Limite deve ser no máximo 100' })
  limit?: number = 20;
}