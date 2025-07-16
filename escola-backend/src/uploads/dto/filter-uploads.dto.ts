/**
 * Filter Uploads DTO - DTO para filtrar uploads
 * Permite filtrar arquivos por tipo, data, etc.
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { FileType } from '../entities/uploaded-file.entity';

export class FilterUploadsDto {
  @ApiProperty({
    description: 'Filtrar por tipo de arquivo',
    enum: FileType,
    example: FileType.MATRICULA,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileType, { message: 'Tipo de arquivo deve ser válido' })
  type?: FileType;

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
    description: 'Data de início para filtrar (ISO string)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de início deve ser uma data válida' })
  startDate?: string;

  @ApiProperty({
    description: 'Data de fim para filtrar (ISO string)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de fim deve ser uma data válida' })
  endDate?: string;

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

  @ApiProperty({
    description: 'Buscar por nome do arquivo',
    example: 'certificado',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Termo de busca deve ser uma string' })
  search?: string;
}

export class FileListResponse {
  @ApiProperty({
    description: 'Lista de arquivos',
    type: [Object],
    isArray: true,
  })
  files: any[];

  @ApiProperty({
    description: 'Total de arquivos',
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