/**
 * Create Enrollment DTO - Validação para criação de matrícula
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsEnum, IsUUID, Min } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'ID do aluno a ser matriculado',
    example: 'uuid-student-id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  studentId: string;

  @ApiProperty({
    description: 'ID da turma para matrícula',
    example: 'uuid-class-id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  classId: string;

  @ApiProperty({
    description: 'Ano letivo da matrícula',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  year: number;

  @ApiProperty({
    description: 'Status inicial da matrícula',
    example: 'ACTIVE',
    enum: EnrollmentStatus,
    default: 'ACTIVE',
  })
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus;
}