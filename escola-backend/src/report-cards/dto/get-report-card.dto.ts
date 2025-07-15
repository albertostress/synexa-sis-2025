/**
 * Get Report Card DTO - Validação para consulta de boletim
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReportCardDto {
  @ApiProperty({
    description: 'Ano letivo para geração do boletim',
    example: 2024,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  year: number;
}