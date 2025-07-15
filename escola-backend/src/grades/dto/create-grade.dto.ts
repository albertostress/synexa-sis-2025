/**
 * Create Grade DTO - Validação para criação de nota
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsNumber, IsUUID, Min, Max } from 'class-validator';

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
    description: 'ID do professor',
    example: 'uuid-teacher-id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  teacherId: string;

  @ApiProperty({
    description: 'ID da turma',
    example: 'uuid-class-id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  classId: string;

  @ApiProperty({
    description: 'Ano letivo',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  year: number;

  @ApiProperty({
    description: 'Valor da nota (0-10)',
    example: 8.5,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  value: number;
}