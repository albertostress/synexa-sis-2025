/**
 * Create Enrollment with Student DTO - Permite criar matrícula com aluno novo ou existente
 * Sistema Synexa-SIS Angola - Fluxo realista de secretaria escolar
 */
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsInt, 
  IsEnum, 
  IsUUID, 
  Min, 
  IsOptional, 
  IsEmail, 
  IsDateString,
  ValidateNested,
  IsArray,
  Length,
  Matches,
  ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentStatus } from '@prisma/client';

enum Gender {
  MASCULINO = 'MASCULINO',
  FEMININO = 'FEMININO'
}


class GuardianDto {
  @ApiProperty({
    description: 'Nome completo do responsável/encarregado',
    example: 'Maria Silva Santos',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Telefone/contacto do responsável',
    example: '+244923456789',
    required: false
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Email do responsável (opcional)',
    example: 'maria.santos@email.com',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email do responsável deve ter formato válido' })
  email?: string;

  @ApiProperty({
    description: 'Grau de parentesco',
    example: 'Mãe',
    required: false
  })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiProperty({
    description: 'Endereço completo do responsável',
    example: 'Rua da Missão, 123, Maianga, Luanda',
    required: false
  })
  @IsOptional()
  @IsString()
  address?: string;

}

class StudentDto {
  @ApiProperty({
    description: 'Primeiro nome do estudante',
    example: 'João',
    minLength: 2,
    maxLength: 50
  })
  @IsString({ message: 'Primeiro nome deve ser um texto' })
  @IsNotEmpty({ message: 'Primeiro nome é obrigatório' })
  @Length(2, 50, { message: 'Primeiro nome deve ter entre 2 e 50 caracteres' })
  firstName: string;

  @ApiProperty({
    description: 'Sobrenome/apelido do estudante',
    example: 'Manuel da Silva',
    minLength: 2,
    maxLength: 100
  })
  @IsString({ message: 'Sobrenome deve ser um texto' })
  @IsNotEmpty({ message: 'Sobrenome é obrigatório' })
  @Length(2, 100, { message: 'Sobrenome deve ter entre 2 e 100 caracteres' })
  lastName: string;

  @ApiProperty({
    description: 'Género do estudante',
    example: 'MASCULINO',
    enum: Gender
  })
  @IsEnum(Gender, { message: 'Género deve ser MASCULINO ou FEMININO' })
  gender: Gender;

  @ApiProperty({
    description: 'Data de nascimento (formato ISO)',
    example: '2010-03-15',
    type: 'string',
    format: 'date'
  })
  @IsDateString({}, { message: 'Data de nascimento deve estar no formato válido (YYYY-MM-DD)' })
  birthDate: string;

  @ApiProperty({
    description: 'Número do Bilhete de Identidade (Angola) - Opcional',
    example: '003456789LA042',
    minLength: 8,
    maxLength: 20,
    required: false
  })
  @ValidateIf((obj) => obj.biNumber !== undefined && obj.biNumber !== '')
  @IsString({ message: 'Número do BI deve ser um texto' })
  @Length(8, 20, { message: 'Número do BI deve ter entre 8 e 20 caracteres' })
  @Matches(/^\d{6,9}[A-Z]{2}\d{3}$/, { 
    message: 'Formato inválido do BI (ex: 003456789LA042)' 
  })
  biNumber?: string;

  @ApiProperty({
    description: 'Província de origem',
    example: 'Luanda'
  })
  @IsString({ message: 'Província deve ser um texto' })
  @IsNotEmpty({ message: 'Província é obrigatória' })
  province: string;

  @ApiProperty({
    description: 'Município de origem',
    example: 'Maianga'
  })
  @IsString({ message: 'Município deve ser um texto' })
  @IsNotEmpty({ message: 'Município é obrigatório' })
  municipality: string;

  @ApiProperty({
    description: 'Observações sobre o estudante (opcional)',
    example: 'Estudante com necessidades especiais',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'Observação deve ser um texto' })
  @Length(0, 500, { message: 'Observação deve ter no máximo 500 caracteres' })
  observacao?: string;

  @ApiProperty({
    description: 'Dados do responsável/encarregado',
    type: GuardianDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianDto)
  guardian?: GuardianDto;
}

export class CreateEnrollmentWithStudentDto {
  @ApiProperty({
    description: 'Dados do estudante para matrícula',
    type: StudentDto
  })
  @ValidateNested()
  @Type(() => StudentDto)
  student: StudentDto;

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
    description: 'ID da turma para matrícula',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid'
  })
  @IsString({ message: 'ID da turma deve ser um texto' })
  @IsNotEmpty({ message: 'ID da turma é obrigatório' })
  @IsUUID('4', { message: 'ID da turma deve ser um UUID válido' })
  classId: string;

  @ApiProperty({
    description: 'Status inicial da matrícula',
    example: 'ACTIVE',
    enum: EnrollmentStatus,
    default: 'ACTIVE',
    required: false
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus, { message: 'Status deve ser ACTIVE, PENDING, CANCELLED ou TRANSFERRED' })
  status?: EnrollmentStatus;
}