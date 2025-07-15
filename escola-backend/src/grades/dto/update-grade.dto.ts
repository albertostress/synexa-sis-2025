/**
 * Update Grade DTO - Validação para atualização de nota
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class UpdateGradeDto {
  @ApiProperty({
    description: 'Novo valor da nota (0-10)',
    example: 9.0,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  value: number;
}