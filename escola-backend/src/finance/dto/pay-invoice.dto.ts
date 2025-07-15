/**
 * Pay Invoice DTO - DTO para pagamento de faturas
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  IsString, 
  MaxLength,
  Min 
} from 'class-validator';

export enum PaymentMethod {
  DINHEIRO = 'DINHEIRO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  MULTIBANCO = 'MULTIBANCO',
  MBWAY = 'MBWAY',
  CARTAO = 'CARTAO',
  CHEQUE = 'CHEQUE',
}

export class PayInvoiceDto {
  @ApiProperty({
    description: 'Valor do pagamento em euros',
    example: 85.50,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor deve ser um número com no máximo 2 casas decimais' })
  @Min(0.01, { message: 'Valor do pagamento deve ser maior que zero' })
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod,
    example: PaymentMethod.TRANSFERENCIA,
  })
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido' })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Referência do pagamento (opcional)',
    example: 'TRF20240815001',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Referência deve ser uma string' })
  @MaxLength(100, { message: 'Referência deve ter no máximo 100 caracteres' })
  reference?: string;
}