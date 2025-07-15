/**
 * Generate Certificate DTO - DTO para geração de certificado
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class GenerateCertificateDto {
  @ApiProperty({
    description: 'ID do aluno para geração do certificado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4, { message: 'ID do aluno deve ser um UUID válido' })
  studentId: string;

  @ApiProperty({
    description: 'Ano letivo de conclusão',
    example: 2024,
    minimum: 2020,
    maximum: 2030,
  })
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2020, { message: 'Ano deve ser maior ou igual a 2020' })
  @Max(2030, { message: 'Ano deve ser menor ou igual a 2030' })
  year: number;
}