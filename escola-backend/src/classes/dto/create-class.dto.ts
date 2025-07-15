/**
 * Create Class DTO - Validação para criação de turma
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsEnum, IsArray, IsUUID, IsOptional, Min } from 'class-validator';
import { Shift } from '@prisma/client';

export class CreateClassDto {
  @ApiProperty({
    description: 'Nome da turma',
    example: '3° Ano A',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Ano letivo',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  year: number;

  @ApiProperty({
    description: 'Turno da turma',
    example: 'MORNING',
    enum: Shift,
  })
  @IsEnum(Shift)
  shift: Shift;

  @ApiProperty({
    description: 'Capacidade máxima de alunos',
    example: 30,
  })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({
    description: 'IDs dos alunos a serem matriculados na turma',
    example: ['uuid-student-1', 'uuid-student-2'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  studentIds?: string[];

  @ApiProperty({
    description: 'IDs dos professores responsáveis pela turma',
    example: ['uuid-teacher-1', 'uuid-teacher-2'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  teacherIds?: string[];
}