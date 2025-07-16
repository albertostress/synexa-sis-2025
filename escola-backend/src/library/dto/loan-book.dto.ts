/**
 * Loan Book DTO - DTO para empréstimo de livro
 * Validação de dados para criar empréstimos
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class LoanBookDto {
  @ApiProperty({
    description: 'ID do livro a ser emprestado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString({ message: 'ID do livro deve ser uma string' })
  @IsNotEmpty({ message: 'ID do livro é obrigatório' })
  @IsUUID('4', { message: 'ID do livro deve ser um UUID válido' })
  bookId: string;

  @ApiProperty({
    description: 'ID do aluno (se empréstimo for para aluno)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do aluno deve ser um UUID válido' })
  studentId?: string;

  @ApiProperty({
    description: 'ID do professor (se empréstimo for para professor)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do professor deve ser um UUID válido' })
  teacherId?: string;

  @ApiProperty({
    description: 'Data de vencimento personalizada (opcional, padrão: 15 dias)',
    example: '2024-01-30T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de vencimento deve ser uma data válida' })
  dueDate?: string;
}

export class LoanBookResponse {
  @ApiProperty({
    description: 'ID do empréstimo criado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do livro emprestado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  bookId: string;

  @ApiProperty({
    description: 'ID do aluno ou professor',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  borrowerId: string;

  @ApiProperty({
    description: 'Tipo do emprestário',
    example: 'student',
    enum: ['student', 'teacher'],
  })
  borrowerType: 'student' | 'teacher';

  @ApiProperty({
    description: 'Status do empréstimo',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Data do empréstimo',
    example: '2024-01-15T10:30:00Z',
  })
  loanDate: Date;

  @ApiProperty({
    description: 'Data de vencimento',
    example: '2024-01-30T10:30:00Z',
  })
  dueDate: Date;

  @ApiProperty({
    description: 'Dados do livro emprestado',
  })
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };

  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Empréstimo realizado com sucesso',
  })
  message: string;
}