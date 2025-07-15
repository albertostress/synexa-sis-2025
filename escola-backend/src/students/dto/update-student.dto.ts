import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateStudentDto {
  @ApiPropertyOptional({
    description: 'Nome completo do aluno',
    example: 'João Silva Santos',
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Email do aluno',
    example: 'joao.santos@email.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Data de nascimento do aluno (ISO string)',
    example: '2000-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de nascimento deve ser uma data válida (ISO string)' })
  birthDate?: string;
}