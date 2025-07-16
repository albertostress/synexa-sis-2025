/**
 * Update Attendance DTO - DTO para atualizar presença
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAttendanceDto {
  @ApiProperty({
    description: 'Se o aluno está presente',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Campo present deve ser booleano' })
  present?: boolean;

  @ApiProperty({
    description: 'Se a falta foi justificada',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Campo justified deve ser booleano' })
  justified?: boolean;

  @ApiProperty({
    description: 'Observação sobre a presença',
    example: 'Atestado médico apresentado',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Nota deve ser uma string' })
  @MaxLength(255, { message: 'Nota deve ter no máximo 255 caracteres' })
  note?: string;
}