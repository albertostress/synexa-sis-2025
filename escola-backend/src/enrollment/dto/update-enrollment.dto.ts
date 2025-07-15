/**
 * Update Enrollment DTO - Validação para atualização de matrícula
 * Referência: context7 mcp - DTO Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsString } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class UpdateEnrollmentDto {
  @ApiProperty({
    description: 'Novo status da matrícula',
    example: 'TRANSFERRED',
    enum: EnrollmentStatus,
    required: false,
  })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @ApiProperty({
    description: 'Novo ID da turma (para transferência)',
    example: 'uuid-new-class-id',
    required: false,
  })
  @IsString()
  @IsUUID('4')
  @IsOptional()
  classId?: string;
}