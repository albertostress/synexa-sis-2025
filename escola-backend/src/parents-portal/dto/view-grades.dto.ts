/**
 * View Grades DTO - DTO para consulta de notas
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ViewGradesDto {
  @ApiProperty({
    description: 'Ano letivo para filtrar (opcional)',
    example: 2024,
    minimum: 2020,
    maximum: 2030,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2020, { message: 'Ano deve ser maior ou igual a 2020' })
  @Max(2030, { message: 'Ano deve ser menor ou igual a 2030' })
  year?: number;
}