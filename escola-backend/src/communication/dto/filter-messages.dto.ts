/**
 * Filter Messages DTO - DTO para filtrar mensagens
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MessagePriority, MessageAudience } from './create-message.dto';

export class FilterMessagesDto {
  @ApiProperty({
    description: 'Filtrar por prioridade',
    enum: MessagePriority,
    required: false,
    example: MessagePriority.HIGH,
  })
  @IsOptional()
  @IsEnum(MessagePriority, { message: 'Prioridade inválida' })
  priority?: MessagePriority;

  @ApiProperty({
    description: 'Filtrar por público-alvo',
    enum: MessageAudience,
    required: false,
    example: MessageAudience.PARENTS,
  })
  @IsOptional()
  @IsEnum(MessageAudience, { message: 'Público-alvo inválido' })
  audience?: MessageAudience;

  @ApiProperty({
    description: 'Data inicial para filtrar',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve ser uma data válida' })
  startDate?: string;

  @ApiProperty({
    description: 'Data final para filtrar',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data final deve ser uma data válida' })
  endDate?: string;

  @ApiProperty({
    description: 'Filtrar apenas mensagens não lidas',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'Unread deve ser um boolean' })
  unread?: boolean;

  @ApiProperty({
    description: 'Buscar por termo no título ou conteúdo',
    example: 'reunião',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search deve ser uma string' })
  search?: string;

  @ApiProperty({
    description: 'Incluir mensagens expiradas',
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'Include expired deve ser um boolean' })
  includeExpired?: boolean = false;

  @ApiProperty({
    description: 'Página para paginação',
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
    description: 'Limite de itens por página',
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