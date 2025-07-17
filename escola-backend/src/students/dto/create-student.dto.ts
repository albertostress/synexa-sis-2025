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
  IsUUID
} from 'class-validator';
import { Gender } from '@prisma/client';

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
    description: 'Telefone do aluno',
    example: '+244923456789' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @Matches(/^[+]?[0-9]{9,15}$/, { 
    message: 'Telefone deve conter apenas números e ter entre 9 e 15 dígitos' 
  })
  phone: string;

  @ApiProperty({ 
    description: 'Tipo sanguíneo',
    example: 'O+',
    required: false 
  })
  @IsString()
  @IsOptional()
  @Matches(/^(A|B|AB|O)[+-]$/, { 
    message: 'Tipo sanguíneo inválido. Use formato: A+, A-, B+, B-, AB+, AB-, O+, O-' 
  })
  bloodType?: string;

  @ApiProperty({ 
    description: 'Número de matrícula único do aluno',
    example: 'STD2024001' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Número de matrícula é obrigatório' })
  @Matches(/^[A-Z0-9]{8,15}$/, { 
    message: 'Número de matrícula deve conter apenas letras maiúsculas e números (8-15 caracteres)' 
  })
  studentNumber: string;

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
}