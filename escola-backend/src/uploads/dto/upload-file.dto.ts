/**
 * Upload File DTO - DTO para upload de arquivo
 * Validação de dados para upload de arquivos
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { FileType } from '../entities/uploaded-file.entity';

export class UploadFileDto {
  @ApiProperty({
    description: 'Tipo/categoria do arquivo',
    enum: FileType,
    example: FileType.MATRICULA,
  })
  @IsEnum(FileType, { message: 'Tipo de arquivo deve ser válido' })
  @IsNotEmpty({ message: 'Tipo de arquivo é obrigatório' })
  type: FileType;

  @ApiProperty({
    description: 'Descrição opcional do arquivo',
    example: 'Certificado de matrícula do aluno',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  description?: string;
}

export class FileValidationResult {
  @ApiProperty({
    description: 'Indica se o arquivo é válido',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Mensagem de erro se inválido',
    example: 'Arquivo muito grande',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'Tipo MIME detectado',
    example: 'application/pdf',
    required: false,
  })
  mimeType?: string;

  @ApiProperty({
    description: 'Tamanho em bytes',
    example: 1024000,
    required: false,
  })
  size?: number;
}

export class UploadResponse {
  @ApiProperty({
    description: 'ID do arquivo enviado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'certificado_matricula.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'Tipo do arquivo',
    enum: FileType,
    example: FileType.MATRICULA,
  })
  type: FileType;

  @ApiProperty({
    description: 'Tamanho em bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'Data de upload',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Mensagem de sucesso',
    example: 'Arquivo enviado com sucesso',
  })
  message: string;
}