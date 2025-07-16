/**
 * Create Book DTO - DTO para criação de livro
 * Validação de dados para cadastro de novos livros
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({
    description: 'Título do livro',
    example: 'Dom Casmurro',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'Título deve ser uma string' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MinLength(2, { message: 'Título deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Título deve ter no máximo 255 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Autor do livro',
    example: 'Machado de Assis',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'Autor deve ser uma string' })
  @IsNotEmpty({ message: 'Autor é obrigatório' })
  @MinLength(2, { message: 'Autor deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Autor deve ter no máximo 255 caracteres' })
  author: string;

  @ApiProperty({
    description: 'ISBN único do livro',
    example: '978-85-7326-158-9',
    minLength: 10,
    maxLength: 17,
  })
  @IsString({ message: 'ISBN deve ser uma string' })
  @IsNotEmpty({ message: 'ISBN é obrigatório' })
  @MinLength(10, { message: 'ISBN deve ter pelo menos 10 caracteres' })
  @MaxLength(17, { message: 'ISBN deve ter no máximo 17 caracteres' })
  isbn: string;

  @ApiProperty({
    description: 'Número de cópias disponíveis',
    example: 5,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Número de cópias deve ser um número inteiro' })
  @Min(1, { message: 'Deve haver pelo menos 1 cópia' })
  copies?: number = 1;
}

export class CreateBookResponse {
  @ApiProperty({
    description: 'ID do livro criado',
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
    description: 'ISBN do livro',
    example: '978-85-7326-158-9',
  })
  isbn: string;

  @ApiProperty({
    description: 'Número de cópias',
    example: 5,
  })
  copies: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Livro cadastrado com sucesso',
  })
  message: string;
}