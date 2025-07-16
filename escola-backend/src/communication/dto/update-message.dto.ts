/**
 * Update Message DTO - DTO para atualizar mensagem
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MessagePriority, MessageAudience } from './create-message.dto';

export class UpdateMessageDto {
  @ApiProperty({
    description: 'Título da mensagem',
    example: 'Reunião de Pais - Setembro 2024 (ATUALIZADA)',
    minLength: 5,
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Título deve ser uma string' })
  @MinLength(5, { message: 'Título deve ter pelo menos 5 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  title?: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    example: 'ATUALIZAÇÃO: A reunião foi reagendada para o dia 20 de setembro...',
    minLength: 10,
    maxLength: 2000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @MinLength(10, { message: 'Conteúdo deve ter pelo menos 10 caracteres' })
  @MaxLength(2000, { message: 'Conteúdo deve ter no máximo 2000 caracteres' })
  content?: string;

  @ApiProperty({
    description: 'Prioridade da mensagem',
    enum: MessagePriority,
    example: MessagePriority.HIGH,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessagePriority, { message: 'Prioridade inválida' })
  priority?: MessagePriority;

  @ApiProperty({
    description: 'Público-alvo da mensagem',
    enum: MessageAudience,
    isArray: true,
    example: [MessageAudience.PARENTS],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Audience deve ser um array' })
  @IsEnum(MessageAudience, { each: true, message: 'Público-alvo inválido' })
  audience?: MessageAudience[];

  @ApiProperty({
    description: 'IDs específicos dos destinatários',
    type: [String],
    required: false,
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray({ message: 'Target users deve ser um array' })
  @IsUUID('4', { each: true, message: 'Cada target user deve ser um UUID válido' })
  targetUsers?: string[];

  @ApiProperty({
    description: 'Data de expiração da mensagem',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de expiração deve ser uma data válida' })
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  expiresAt?: string;
}