/**
 * Create Subject DTO - Validação para criação de disciplina
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'Matemática',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descrição da disciplina',
    example: 'Disciplina de matemática fundamental e aplicada',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'IDs dos professores que irão lecionar a disciplina',
    example: ['uuid-teacher-1', 'uuid-teacher-2'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  teacherIds?: string[];
}