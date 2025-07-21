/**
 * Create Enrollment DTO - Validação para criação de matrícula (LEGADO)
 * NOVO: Use CreateEnrollmentWithStudentDto para o fluxo completo de secretaria
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsEnum, IsUUID, Min, IsOptional } from 'class-validator';

import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'ID do estudante existente a ser matriculado',
    example: 'uuid-student-id',
    format: 'uuid'
  })
  @IsString({ message: 'ID do estudante deve ser um texto' })
  @IsNotEmpty({ message: 'ID do estudante é obrigatório' })
  @IsUUID('4', { message: 'ID do estudante deve ser um UUID válido' })
  studentId: string;

  @ApiProperty({
    description: 'ID da turma para matrícula',
    example: 'uuid-class-id',
    format: 'uuid'
  })
  @IsString({ message: 'ID da turma deve ser um texto' })
  @IsNotEmpty({ message: 'ID da turma é obrigatório' })
  @IsUUID('4', { message: 'ID da turma deve ser um UUID válido' })
  classId: string;

  @ApiProperty({
    description: 'Ano letivo da matrícula',
    example: 2025,
    minimum: 2020,
    maximum: 2030
  })
  @IsInt({ message: 'Ano letivo deve ser um número inteiro' })
  @Min(2020, { message: 'Ano letivo deve ser maior ou igual a 2020' })
  academicYear: number;

  @ApiProperty({
    description: 'Status inicial da matrícula',
    example: 'ATIVA',
    enum: EnrollmentStatus,
    default: 'ACTIVE',
    required: false
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus, { message: 'Status deve ser ACTIVE, PENDING, CANCELLED ou TRANSFERRED' })
  status?: EnrollmentStatus;
}