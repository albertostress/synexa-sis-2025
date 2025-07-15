/**
 * Create Invoice DTO - DTO para criação de faturas
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsUUID, 
  IsNumber, 
  IsDateString, 
  IsString, 
  IsInt, 
  Min, 
  Max, 
  MaxLength,
  IsOptional 
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'ID do aluno',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4, { message: 'ID do aluno deve ser um UUID válido' })
  studentId: string;

  @ApiProperty({
    description: 'Valor da fatura em euros',
    example: 85.50,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor deve ser um número com no máximo 2 casas decimais' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  amount: number;

  @ApiProperty({
    description: 'Data de vencimento da fatura',
    example: '2024-08-15',
  })
  @IsDateString({}, { message: 'Data de vencimento deve estar no formato ISO (YYYY-MM-DD)' })
  dueDate: string;

  @ApiProperty({
    description: 'Descrição da fatura',
    example: 'Mensalidade - Agosto 2024',
    maxLength: 200,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(200, { message: 'Descrição deve ter no máximo 200 caracteres' })
  description: string;

  @ApiProperty({
    description: 'Mês de referência (1-12)',
    example: 8,
    minimum: 1,
    maximum: 12,
  })
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês deve ser entre 1 e 12' })
  month: number;

  @ApiProperty({
    description: 'Ano de referência',
    example: 2024,
    minimum: 2020,
    maximum: 2030,
  })
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2020, { message: 'Ano deve ser maior ou igual a 2020' })
  @Max(2030, { message: 'Ano deve ser menor ou igual a 2030' })
  year: number;
}