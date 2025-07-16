/**
 * List Attendance DTO - DTO para listar presenças
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ListAttendanceDto {
  @ApiProperty({
    description: 'Data inicial para filtrar',
    example: '2024-08-01',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve estar no formato válido' })
  startDate?: string;

  @ApiProperty({
    description: 'Data final para filtrar',
    example: '2024-08-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data final deve estar no formato válido' })
  endDate?: string;

  @ApiProperty({
    description: 'ID da disciplina para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID da disciplina deve ser um UUID válido' })
  subjectId?: string;

  @ApiProperty({
    description: 'ID do aluno para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do aluno deve ser um UUID válido' })
  studentId?: string;

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