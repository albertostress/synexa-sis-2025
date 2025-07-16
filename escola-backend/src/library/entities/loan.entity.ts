/**
 * Loan Entity - Entidade para empréstimos de livros
 * Representa empréstimos feitos por alunos ou professores
 */
import { ApiProperty } from '@nestjs/swagger';

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
}

export class Loan {
  @ApiProperty({
    description: 'ID único do empréstimo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do livro emprestado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  bookId: string;

  @ApiProperty({
    description: 'ID do aluno (se aplicável)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  studentId?: string;

  @ApiProperty({
    description: 'ID do professor (se aplicável)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  teacherId?: string;

  @ApiProperty({
    description: 'Status do empréstimo',
    enum: LoanStatus,
    example: LoanStatus.ACTIVE,
  })
  status: LoanStatus;

  @ApiProperty({
    description: 'Data do empréstimo',
    example: '2024-01-15T10:30:00Z',
  })
  loanDate: Date;

  @ApiProperty({
    description: 'Data de vencimento (devolução esperada)',
    example: '2024-01-30T10:30:00Z',
  })
  dueDate: Date;

  @ApiProperty({
    description: 'Data de devolução efetiva',
    example: '2024-01-28T10:30:00Z',
    required: false,
  })
  returnDate?: Date;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  // Relações (opcionais para response)
  @ApiProperty({
    description: 'Dados do livro emprestado',
    required: false,
  })
  book?: any;

  @ApiProperty({
    description: 'Dados do aluno (se aplicável)',
    required: false,
  })
  student?: any;

  @ApiProperty({
    description: 'Dados do professor (se aplicável)',
    required: false,
  })
  teacher?: any;
}