/**
 * Create Subject DTO - Validação para criação de disciplina
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID, IsInt, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SubjectCategory {
  OBRIGATORIA = 'Obrigatória',
  OPCIONAL = 'Opcional',
}

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
    description: 'Código único da disciplina',
    example: 'MAT101',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Ano letivo da disciplina',
    example: '1º Ano',
  })
  @IsString()
  @IsNotEmpty()
  year: string;

  @ApiProperty({
    description: 'Categoria da disciplina',
    enum: SubjectCategory,
    example: SubjectCategory.OBRIGATORIA,
  })
  @IsEnum(SubjectCategory)
  category: SubjectCategory;

  @ApiProperty({
    description: 'Número de créditos da disciplina',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => parseInt(value))
  credits: number;

  @ApiProperty({
    description: 'Carga horária da disciplina em horas',
    example: 60,
    minimum: 1,
    maximum: 500,
  })
  @IsInt()
  @Min(1)
  @Max(500)
  @Transform(({ value }) => parseInt(value))
  workloadHours: number;

  @ApiProperty({
    description: 'Se a disciplina está ativa',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean = true;

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