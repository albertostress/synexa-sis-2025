/**
 * Get Report Card DTO - Validação para consulta de boletim (Sistema Angolano)
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional } from 'class-validator';
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

  @ApiProperty({
    description: 'Trimestre específico (1, 2, 3) ou omitir para boletim final',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Trimestre deve ser 1, 2 ou 3' })
  @Max(3, { message: 'Trimestre deve ser 1, 2 ou 3' })
  term?: number;
}