import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { EventType } from '../entities/event.entity';

export class FilterEventsDto {
  @ApiProperty({
    description: 'Filtrar por título do evento',
    example: 'Festa',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Título deve ser uma string' })
  title?: string;

  @ApiProperty({
    description: 'Filtrar por tipo de evento',
    enum: EventType,
    example: EventType.PALESTRA,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventType, { message: 'Tipo de evento inválido' })
  type?: EventType;

  @ApiProperty({
    description: 'Filtrar por local do evento',
    example: 'Auditório',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Local deve ser uma string' })
  location?: string;

  @ApiProperty({
    description: 'Filtrar eventos a partir desta data (formato ISO 8601)',
    example: '2025-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de início deve estar no formato ISO 8601' })
  startDate?: string;

  @ApiProperty({
    description: 'Filtrar eventos até esta data (formato ISO 8601)',
    example: '2025-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de fim deve estar no formato ISO 8601' })
  endDate?: string;

  @ApiProperty({
    description: 'Filtrar apenas eventos futuros',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Eventos futuros deve ser um booleano' })
  futureOnly?: boolean;

  @ApiProperty({
    description: 'Filtrar apenas eventos passados',
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Eventos passados deve ser um booleano' })
  pastOnly?: boolean;

  @ApiProperty({
    description: 'Número da página (padrão: 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser no mínimo 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Número de itens por página (padrão: 10, máximo: 100)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser no mínimo 1' })
  @Max(100, { message: 'Limite não pode ser maior que 100' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Ordenar por campo (date, title, type)',
    example: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Campo de ordenação deve ser uma string' })
  sortBy?: string = 'date';

  @ApiProperty({
    description: 'Direção da ordenação (asc, desc)',
    example: 'desc',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Direção de ordenação deve ser uma string' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class FilterParticipantsDto {
  @ApiProperty({
    description: 'Filtrar por nome do aluno',
    example: 'João',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome do aluno deve ser uma string' })
  studentName?: string;

  @ApiProperty({
    description: 'Filtrar por turma',
    example: '9ª Classe A',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome da turma deve ser uma string' })
  className?: string;

  @ApiProperty({
    description: 'Filtrar apenas presentes',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Presença deve ser um booleano' })
  presentOnly?: boolean;

  @ApiProperty({
    description: 'Filtrar apenas ausentes',
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Ausência deve ser um booleano' })
  absentOnly?: boolean;

  @ApiProperty({
    description: 'Número da página (padrão: 1)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser no mínimo 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Número de itens por página (padrão: 10, máximo: 100)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser no mínimo 1' })
  @Max(100, { message: 'Limite não pode ser maior que 100' })
  limit?: number = 10;
}