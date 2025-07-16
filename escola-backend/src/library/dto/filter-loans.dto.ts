/**
 * Filter Loans DTO - DTO para filtrar empréstimos
 * Permite filtrar empréstimos por status, data, pessoa, etc.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterLoansDto {
  @ApiProperty({
    description: 'Filtrar por status do empréstimo',
    enum: ['ACTIVE', 'RETURNED', 'OVERDUE'],
    example: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'RETURNED', 'OVERDUE'], { message: 'Status deve ser válido' })
  status?: string;

  @ApiProperty({
    description: 'ID do aluno para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do aluno deve ser um UUID válido' })
  studentId?: string;

  @ApiProperty({
    description: 'ID do professor para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do professor deve ser um UUID válido' })
  teacherId?: string;

  @ApiProperty({
    description: 'ID do livro para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do livro deve ser um UUID válido' })
  bookId?: string;

  @ApiProperty({
    description: 'Data de início do empréstimo (ISO string)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de início deve ser uma data válida' })
  startLoanDate?: string;

  @ApiProperty({
    description: 'Data de fim do empréstimo (ISO string)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de fim deve ser uma data válida' })
  endLoanDate?: string;

  @ApiProperty({
    description: 'Data de início do vencimento (ISO string)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de início do vencimento deve ser uma data válida' })
  startDueDate?: string;

  @ApiProperty({
    description: 'Data de fim do vencimento (ISO string)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de fim do vencimento deve ser uma data válida' })
  endDueDate?: string;

  @ApiProperty({
    description: 'Buscar por título do livro',
    example: 'Dom Casmurro',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Termo de busca deve ser uma string' })
  searchBook?: string;

  @ApiProperty({
    description: 'Buscar por nome do emprestário',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Termo de busca deve ser uma string' })
  searchBorrower?: string;

  @ApiProperty({
    description: 'Página para paginação',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}

export class FilterBooksDto {
  @ApiProperty({
    description: 'Buscar por título do livro',
    example: 'Dom Casmurro',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Termo de busca deve ser uma string' })
  title?: string;

  @ApiProperty({
    description: 'Buscar por autor do livro',
    example: 'Machado de Assis',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Termo de busca deve ser uma string' })
  author?: string;

  @ApiProperty({
    description: 'Buscar por ISBN',
    example: '978-85-7326-158-9',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'ISBN deve ser uma string' })
  isbn?: string;

  @ApiProperty({
    description: 'Mostrar apenas livros disponíveis',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  availableOnly?: boolean;

  @ApiProperty({
    description: 'Página para paginação',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}

export class LoansListResponse {
  @ApiProperty({
    description: 'Lista de empréstimos',
    type: [Object],
    isArray: true,
  })
  loans: any[];

  @ApiProperty({
    description: 'Total de empréstimos',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Página atual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Itens por página',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 3,
  })
  totalPages: number;
}

export class BooksListResponse {
  @ApiProperty({
    description: 'Lista de livros',
    type: [Object],
    isArray: true,
  })
  books: any[];

  @ApiProperty({
    description: 'Total de livros',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Página atual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Itens por página',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 3,
  })
  totalPages: number;
}