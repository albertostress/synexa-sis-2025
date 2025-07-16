import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterTransportDto {
  @ApiProperty({
    description: 'Filtrar por nome da rota',
    example: 'Centro',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome da rota deve ser uma string' })
  routeName?: string;

  @ApiProperty({
    description: 'Filtrar por nome do motorista',
    example: 'João',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome do motorista deve ser uma string' })
  driverName?: string;

  @ApiProperty({
    description: 'Filtrar por identificação do veículo',
    example: 'ABC-1234',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Identificação do veículo deve ser uma string' })
  vehicle?: string;

  @ApiProperty({
    description: 'Filtrar por horário de saída (formato HH:mm)',
    example: '07:00',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Horário de saída deve ser uma string' })
  departure?: string;

  @ApiProperty({
    description: 'Filtrar por horário de retorno (formato HH:mm)',
    example: '17:30',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Horário de retorno deve ser uma string' })
  returnTime?: string;

  @ApiProperty({
    description: 'Filtrar por nome da paragem',
    example: 'Praça Central',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome da paragem deve ser uma string' })
  stopName?: string;

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

export class FilterStudentTransportDto {
  @ApiProperty({
    description: 'Filtrar por nome do aluno',
    example: 'Maria',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome do aluno deve ser uma string' })
  studentName?: string;

  @ApiProperty({
    description: 'Filtrar por nome da turma',
    example: '9ª Classe A',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome da turma deve ser uma string' })
  className?: string;

  @ApiProperty({
    description: 'Filtrar por nome da rota',
    example: 'Centro',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome da rota deve ser uma string' })
  routeName?: string;

  @ApiProperty({
    description: 'Filtrar por nome da paragem',
    example: 'Praça Central',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome da paragem deve ser uma string' })
  stopName?: string;

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