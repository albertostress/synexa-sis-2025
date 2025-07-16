/**
 * Create Message DTO - DTO para criar mensagem
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  ArrayMinSize,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MessageAudience {
  PARENTS = 'PARENTS',
  TEACHERS = 'TEACHERS',
  ALL_STAFF = 'ALL_STAFF',
  SPECIFIC_CLASS = 'SPECIFIC_CLASS',
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
}

export class CreateMessageDto {
  @ApiProperty({
    description: 'Título da mensagem',
    example: 'Reunião de Pais - Setembro 2024',
    minLength: 5,
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @IsString({ message: 'Título deve ser uma string' })
  @MinLength(5, { message: 'Título deve ter pelo menos 5 caracteres' })
  @MaxLength(200, { message: 'Título deve ter no máximo 200 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    example: 'Informamos que haverá reunião de pais no dia 15 de setembro às 19h...',
    minLength: 10,
    maxLength: 2000,
  })
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @MinLength(10, { message: 'Conteúdo deve ter pelo menos 10 caracteres' })
  @MaxLength(2000, { message: 'Conteúdo deve ter no máximo 2000 caracteres' })
  content: string;

  @ApiProperty({
    description: 'Prioridade da mensagem',
    enum: MessagePriority,
    example: MessagePriority.NORMAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessagePriority, { message: 'Prioridade inválida' })
  priority?: MessagePriority = MessagePriority.NORMAL;

  @ApiProperty({
    description: 'Público-alvo da mensagem',
    enum: MessageAudience,
    isArray: true,
    example: [MessageAudience.PARENTS, MessageAudience.TEACHERS],
  })
  @IsArray({ message: 'Audience deve ser um array' })
  @ArrayMinSize(1, { message: 'Deve especificar pelo menos um público-alvo' })
  @IsEnum(MessageAudience, { each: true, message: 'Público-alvo inválido' })
  audience: MessageAudience[];

  @ApiProperty({
    description: 'IDs específicos dos destinatários (quando audience é INDIVIDUAL ou GROUP)',
    type: [String],
    required: false,
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray({ message: 'Target users deve ser um array' })
  @IsUUID('4', { each: true, message: 'Cada target user deve ser um UUID válido' })
  targetUsers?: string[];

  @ApiProperty({
    description: 'ID da turma específica (quando audience é SPECIFIC_CLASS)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Class ID deve ser um UUID válido' })
  classId?: string;

  @ApiProperty({
    description: 'Data de expiração da mensagem (opcional)',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de expiração deve ser uma data válida' })
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  expiresAt?: string;
}