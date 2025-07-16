import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { EventType } from '../entities/event.entity';

export class CreateEventDto {
  @ApiProperty({
    description: 'Título do evento',
    example: 'Festa Junina 2025',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Título deve ser uma string' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MinLength(3, { message: 'Título deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Título deve ter no máximo 100 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do evento',
    example: 'Festa junina anual da escola com apresentações culturais, comidas típicas e quadrilha.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @MinLength(10, { message: 'Descrição deve ter no mínimo 10 caracteres' })
  @MaxLength(1000, { message: 'Descrição deve ter no máximo 1000 caracteres' })
  description: string;

  @ApiProperty({
    description: 'Data e hora do evento (formato ISO 8601)',
    example: '2025-06-15T14:00:00Z',
  })
  @IsDateString({}, { message: 'Data deve estar no formato ISO 8601' })
  @IsNotEmpty({ message: 'Data é obrigatória' })
  date: string;

  @ApiProperty({
    description: 'Local onde será realizado o evento',
    example: 'Pátio principal da escola',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'Local deve ser uma string' })
  @IsNotEmpty({ message: 'Local é obrigatório' })
  @MinLength(3, { message: 'Local deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Local deve ter no máximo 200 caracteres' })
  location: string;

  @ApiProperty({
    description: 'Tipo do evento',
    enum: EventType,
    example: EventType.OUTRO,
  })
  @IsEnum(EventType, { message: 'Tipo de evento inválido' })
  @IsNotEmpty({ message: 'Tipo é obrigatório' })
  type: EventType;
}

export class UpdateEventDto {
  @ApiProperty({
    description: 'Título do evento',
    example: 'Festa Junina 2025',
    minLength: 3,
    maxLength: 100,
    required: false,
  })
  @IsString({ message: 'Título deve ser uma string' })
  @MinLength(3, { message: 'Título deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Título deve ter no máximo 100 caracteres' })
  title?: string;

  @ApiProperty({
    description: 'Descrição detalhada do evento',
    example: 'Festa junina anual da escola com apresentações culturais, comidas típicas e quadrilha.',
    minLength: 10,
    maxLength: 1000,
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @MinLength(10, { message: 'Descrição deve ter no mínimo 10 caracteres' })
  @MaxLength(1000, { message: 'Descrição deve ter no máximo 1000 caracteres' })
  description?: string;

  @ApiProperty({
    description: 'Data e hora do evento (formato ISO 8601)',
    example: '2025-06-15T14:00:00Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data deve estar no formato ISO 8601' })
  date?: string;

  @ApiProperty({
    description: 'Local onde será realizado o evento',
    example: 'Pátio principal da escola',
    minLength: 3,
    maxLength: 200,
    required: false,
  })
  @IsString({ message: 'Local deve ser uma string' })
  @MinLength(3, { message: 'Local deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'Local deve ter no máximo 200 caracteres' })
  location?: string;

  @ApiProperty({
    description: 'Tipo do evento',
    enum: EventType,
    example: EventType.OUTRO,
    required: false,
  })
  @IsEnum(EventType, { message: 'Tipo de evento inválido' })
  type?: EventType;
}