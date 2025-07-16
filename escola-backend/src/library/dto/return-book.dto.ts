/**
 * Return Book DTO - DTO para devolução de livro
 * Validação de dados para processar devoluções
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class ReturnBookDto {
  @ApiProperty({
    description: 'Data de devolução personalizada (opcional, padrão: agora)',
    example: '2024-01-28T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de devolução deve ser uma data válida' })
  returnDate?: string;
}

export class ReturnBookResponse {
  @ApiProperty({
    description: 'ID do empréstimo devolvido',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Data do empréstimo original',
    example: '2024-01-15T10:30:00Z',
  })
  loanDate: Date;

  @ApiProperty({
    description: 'Data de vencimento',
    example: '2024-01-30T10:30:00Z',
  })
  dueDate: Date;

  @ApiProperty({
    description: 'Data de devolução efetiva',
    example: '2024-01-28T10:30:00Z',
  })
  returnDate: Date;

  @ApiProperty({
    description: 'Indica se a devolução foi feita em atraso',
    example: false,
  })
  wasOverdue: boolean;

  @ApiProperty({
    description: 'Dias de atraso (se aplicável)',
    example: 0,
  })
  daysOverdue: number;

  @ApiProperty({
    description: 'Dados do livro devolvido',
  })
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };

  @ApiProperty({
    description: 'Dados do emprestário',
  })
  borrower: {
    id: string;
    name: string;
    type: 'student' | 'teacher';
  };

  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Livro devolvido com sucesso',
  })
  message: string;
}