/**
 * Create Grade DTO - Validação para criação de nota (Sistema Angolano)
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsNumber, IsUUID, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { GradeType } from '@prisma/client';

export class CreateGradeDto {
  @ApiProperty({
    description: 'ID do aluno',
    example: 'uuid-student-id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  studentId: string;

  @ApiProperty({
    description: 'ID da disciplina',
    example: 'uuid-subject-id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  subjectId: string;

  @ApiProperty({
    description: 'ID do professor (opcional para PROFESSOR, obrigatório para ADMIN)',
    example: 'uuid-teacher-id',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID('4')
  teacherId?: string;

  @ApiProperty({
    description: 'ID da turma',
    example: 'uuid-class-id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  classId: string;

  @ApiProperty({
    description: 'Tipo de avaliação',
    enum: GradeType,
    example: GradeType.MAC,
  })
  @IsEnum(GradeType, { message: 'Tipo deve ser MAC, NPP, NPT, MT ou FAL' })
  @IsNotEmpty({ message: 'Tipo de avaliação é obrigatório' })
  type: GradeType;

  @ApiProperty({
    description: 'Trimestre (1, 2 ou 3)',
    example: 1,
    minimum: 1,
    maximum: 3,
  })
  @IsInt({ message: 'Trimestre deve ser um número inteiro' })
  @Min(1, { message: 'Trimestre deve ser 1, 2 ou 3' })
  @Max(3, { message: 'Trimestre deve ser 1, 2 ou 3' })
  term: number;

  @ApiProperty({
    description: 'Ano letivo',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  year: number;

  @ApiProperty({
    description: 'Valor da nota (0-20 - Sistema Angolano)',
    example: 16.5,
    minimum: 0,
    maximum: 20,
  })
  @IsNumber({}, { message: 'Nota deve ser um número' })
  @Min(0, { message: 'Nota deve ser entre 0 e 20' })
  @Max(20, { message: 'Nota deve ser entre 0 e 20' })
  value: number;
}