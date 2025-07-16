/**
 * Book Entity - Entidade para livros da biblioteca
 * Representa livros físicos disponíveis para empréstimo
 */
import { ApiProperty } from '@nestjs/swagger';

export class Book {
  @ApiProperty({
    description: 'ID único do livro',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Título do livro',
    example: 'Dom Casmurro',
  })
  title: string;

  @ApiProperty({
    description: 'Autor do livro',
    example: 'Machado de Assis',
  })
  author: string;

  @ApiProperty({
    description: 'ISBN único do livro',
    example: '978-85-7326-158-9',
  })
  isbn: string;

  @ApiProperty({
    description: 'Número de cópias disponíveis',
    example: 5,
    default: 1,
  })
  copies: number;

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
}