/**
 * Generate Declaration DTO - DTO para geração de declaração
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsString, MaxLength } from 'class-validator';

export class GenerateDeclarationDto {
  @ApiProperty({
    description: 'ID do aluno para geração da declaração',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4, { message: 'ID do aluno deve ser um UUID válido' })
  studentId: string;

  @ApiProperty({
    description: 'Ano letivo da matrícula',
    example: 2024,
    minimum: 2020,
    maximum: 2030,
  })
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2020, { message: 'Ano deve ser maior ou igual a 2020' })
  @Max(2030, { message: 'Ano deve ser menor ou igual a 2030' })
  year: number;

  @ApiProperty({
    description: 'Finalidade da declaração',
    example: 'Para fins de comprovação de matrícula escolar',
    maxLength: 200,
  })
  @IsString({ message: 'Finalidade deve ser uma string' })
  @MaxLength(200, { message: 'Finalidade deve ter no máximo 200 caracteres' })
  purpose: string;
}