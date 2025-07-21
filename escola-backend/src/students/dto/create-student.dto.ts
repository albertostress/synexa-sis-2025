import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsDateString, 
  IsOptional,
  IsEmail,
  Matches,
  MinLength,
  MaxLength,
  IsUUID,
  IsArray,
  Length
} from 'class-validator';
import { Gender, StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ 
    description: 'Primeiro nome do aluno',
    example: 'João' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Primeiro nome é obrigatório' })
  @MinLength(2, { message: 'Primeiro nome deve ter no mínimo 2 caracteres' })
  @MaxLength(50, { message: 'Primeiro nome deve ter no máximo 50 caracteres' })
  firstName: string;

  @ApiProperty({ 
    description: 'Último nome do aluno',
    example: 'Silva' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Último nome é obrigatório' })
  @MinLength(2, { message: 'Último nome deve ter no mínimo 2 caracteres' })
  @MaxLength(50, { message: 'Último nome deve ter no máximo 50 caracteres' })
  lastName: string;

  @ApiProperty({ 
    description: 'Gênero do aluno',
    enum: Gender,
    example: Gender.MASCULINO 
  })
  @IsEnum(Gender, { message: 'Gênero deve ser MASCULINO ou FEMININO' })
  @IsNotEmpty({ message: 'Gênero é obrigatório' })
  gender: Gender;

  @ApiProperty({ 
    description: 'Data de nascimento (ISO 8601)',
    example: '2010-05-15T00:00:00.000Z' 
  })
  @IsDateString({}, { message: 'Data de nascimento inválida' })
  @IsNotEmpty({ message: 'Data de nascimento é obrigatória' })
  birthDate: string;

  @ApiProperty({ 
    description: 'Número do Bilhete de Identidade do aluno',
    example: '003456789LA042' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Número do BI é obrigatório' })
  @Length(8, 20, { message: 'Número do BI deve ter entre 8 e 20 caracteres' })
  @Matches(/^\d{6,9}[A-Z]{2}\d{3}$/, { 
    message: 'Formato inválido do BI (ex: 003456789LA042)' 
  })
  biNumber: string;


  @ApiProperty({ 
    description: 'Número de matrícula único do aluno (gerado automaticamente se não fornecido)',
    example: '2024-0001',
    required: false 
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{4}-[0-9]{4}$/, { 
    message: 'Número de matrícula deve estar no formato: AAAA-XXXX (ex: 2024-0001)' 
  })
  studentNumber?: string;

  @ApiProperty({ 
    description: 'Ano acadêmico',
    example: '2024' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Ano acadêmico é obrigatório' })
  @Matches(/^20[0-9]{2}$/, { 
    message: 'Ano acadêmico deve estar no formato: 2024' 
  })
  academicYear: string;

  @ApiProperty({ 
    description: 'ID da turma',
    example: 'uuid-da-turma' 
  })
  @IsUUID('4', { message: 'ID da turma inválido' })
  @IsNotEmpty({ message: 'Turma é obrigatória' })
  classId: string;

  @ApiProperty({ 
    description: 'URL da foto de perfil',
    example: 'https://storage.example.com/photos/student123.jpg',
    required: false 
  })
  @IsString()
  @IsOptional()
  profilePhotoUrl?: string;

  @ApiProperty({ 
    description: 'Nome completo do encarregado de educação',
    example: 'Maria Silva' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome do encarregado é obrigatório' })
  @MinLength(5, { message: 'Nome do encarregado deve ter no mínimo 5 caracteres' })
  @MaxLength(100, { message: 'Nome do encarregado deve ter no máximo 100 caracteres' })
  guardianName: string;

  @ApiProperty({ 
    description: 'Telefone do encarregado',
    example: '+244923456789' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Telefone do encarregado é obrigatório' })
  @Matches(/^[+]?[0-9]{9,15}$/, { 
    message: 'Telefone do encarregado deve conter apenas números e ter entre 9 e 15 dígitos' 
  })
  guardianPhone: string;

  @ApiProperty({ 
    description: 'Município de residência',
    example: 'Luanda' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Município é obrigatório' })
  @MinLength(3, { message: 'Município deve ter no mínimo 3 caracteres' })
  @MaxLength(50, { message: 'Município deve ter no máximo 50 caracteres' })
  municipality: string;

  @ApiProperty({ 
    description: 'Província de residência',
    example: 'Luanda' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Província é obrigatória' })
  @MinLength(3, { message: 'Província deve ter no mínimo 3 caracteres' })
  @MaxLength(50, { message: 'Província deve ter no máximo 50 caracteres' })
  province: string;

  @ApiProperty({ 
    description: 'País de residência',
    example: 'Angola',
    default: 'Angola' 
  })
  @IsString()
  @IsNotEmpty({ message: 'País é obrigatório' })
  @MinLength(3, { message: 'País deve ter no mínimo 3 caracteres' })
  @MaxLength(50, { message: 'País deve ter no máximo 50 caracteres' })
  country: string = 'Angola';

  @ApiProperty({ 
    description: 'Email dos pais/responsável',
    example: 'pais@email.com' 
  })
  @IsEmail({}, { message: 'Email dos pais inválido' })
  @IsNotEmpty({ message: 'Email dos pais é obrigatório' })
  parentEmail: string;

  @ApiProperty({ 
    description: 'Telefone dos pais',
    example: '+244923456789' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Telefone dos pais é obrigatório' })
  @Matches(/^[+]?[0-9]{9,15}$/, { 
    message: 'Telefone dos pais deve conter apenas números e ter entre 9 e 15 dígitos' 
  })
  parentPhone: string;

  @ApiProperty({ 
    description: 'Status do aluno',
    enum: StudentStatus,
    example: StudentStatus.ATIVO,
    required: false,
    default: StudentStatus.ATIVO
  })
  @IsEnum(StudentStatus, { message: 'Status deve ser: ATIVO, TRANSFERIDO, DESISTENTE ou CONCLUIDO' })
  @IsOptional()
  status?: StudentStatus;

  @ApiProperty({ 
    description: 'Tags do aluno',
    example: ['bolsista', 'monitor', 'atleta'],
    required: false,
    default: []
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}