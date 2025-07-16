/**
 * Mark Attendance DTO - DTO para registrar presença
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsOptional,
  IsString,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StudentAttendanceDto {
  @ApiProperty({
    description: 'ID do aluno',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'ID do aluno deve ser um UUID válido' })
  studentId: string;

  @ApiProperty({
    description: 'Se o aluno está presente',
    example: true,
  })
  @IsBoolean({ message: 'Campo present deve ser booleano' })
  present: boolean;

  @ApiProperty({
    description: 'Se a falta foi justificada',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Campo justified deve ser booleano' })
  justified?: boolean;

  @ApiProperty({
    description: 'Observação sobre a presença',
    example: 'Chegou atrasado',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Nota deve ser uma string' })
  @MaxLength(255, { message: 'Nota deve ter no máximo 255 caracteres' })
  note?: string;
}

export class MarkAttendanceDto {
  @ApiProperty({
    description: 'Data da chamada',
    example: '2024-08-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString({}, { message: 'Data deve estar no formato válido' })
  date: string;

  @ApiProperty({
    description: 'ID da turma',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'ID da turma deve ser um UUID válido' })
  classId: string;

  @ApiProperty({
    description: 'ID da disciplina',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'ID da disciplina deve ser um UUID válido' })
  subjectId: string;

  @ApiProperty({
    description: 'Lista de presenças dos alunos',
    type: [StudentAttendanceDto],
    isArray: true,
  })
  @IsArray({ message: 'Attendance deve ser um array' })
  @ArrayMinSize(1, { message: 'Deve haver pelo menos uma presença' })
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  attendances: StudentAttendanceDto[];
}