/**
 * Generate Transcript DTO - DTO para geração de histórico escolar
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';

export class GenerateTranscriptDto {
  @ApiProperty({
    description: 'ID do aluno para geração do histórico',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4, { message: 'ID do aluno deve ser um UUID válido' })
  studentId: string;

  @ApiProperty({
    description: 'Ano inicial do histórico',
    example: 2022,
    minimum: 2020,
    maximum: 2030,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Ano inicial deve ser um número inteiro' })
  @Min(2020, { message: 'Ano inicial deve ser maior ou igual a 2020' })
  @Max(2030, { message: 'Ano inicial deve ser menor ou igual a 2030' })
  startYear?: number;

  @ApiProperty({
    description: 'Ano final do histórico',
    example: 2024,
    minimum: 2020,
    maximum: 2030,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Ano final deve ser um número inteiro' })
  @Min(2020, { message: 'Ano final deve ser maior ou igual a 2020' })
  @Max(2030, { message: 'Ano final deve ser menor ou igual a 2030' })
  endYear?: number;
}