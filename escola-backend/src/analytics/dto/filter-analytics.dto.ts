/**
 * Filter Analytics DTO - DTO para filtrar métricas
 * Permite filtros por ano, turno, turma e disciplina
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsUUID, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterAnalyticsDto {
  @ApiProperty({
    description: 'Ano letivo para filtrar as métricas',
    example: 2024,
    required: false,
    minimum: 2020,
    maximum: 2030,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2020, { message: 'Ano deve ser maior ou igual a 2020' })
  @Max(2030, { message: 'Ano deve ser menor ou igual a 2030' })
  year?: number;

  @ApiProperty({
    description: 'Turno para filtrar (MORNING, AFTERNOON, EVENING)',
    example: 'MORNING',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Turno deve ser uma string' })
  shift?: string;

  @ApiProperty({
    description: 'ID da turma para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID da turma deve ser um UUID válido' })
  classId?: string;

  @ApiProperty({
    description: 'ID da disciplina para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID da disciplina deve ser um UUID válido' })
  disciplineId?: string;

  @ApiProperty({
    description: 'Mês para filtrar (1-12)',
    example: 3,
    required: false,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser maior ou igual a 1' })
  @Max(12, { message: 'Mês deve ser menor ou igual a 12' })
  month?: number;
}