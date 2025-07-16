/**
 * UploadedFile Entity - Entidade para arquivos enviados
 * Representa arquivos associados a alunos ou professores
 */
import { ApiProperty } from '@nestjs/swagger';

export enum FileType {
  MATRICULA = 'MATRICULA',
  ATESTADO = 'ATESTADO',
  AVALIACAO = 'AVALIACAO',
  HISTORICO = 'HISTORICO',
  EXAME_MEDICO = 'EXAME_MEDICO',
  OUTRO = 'OUTRO',
}

export class UploadedFile {
  @ApiProperty({
    description: 'ID único do arquivo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'certificado_matricula.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'Nome do arquivo no servidor',
    example: '550e8400-e29b-41d4-a716-446655440000.pdf',
  })
  storedName: string;

  @ApiProperty({
    description: 'Caminho completo do arquivo',
    example: '/storage/students/550e8400-e29b-41d4-a716-446655440000.pdf',
  })
  path: string;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'application/pdf',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'Tipo/categoria do arquivo',
    enum: FileType,
    example: FileType.MATRICULA,
  })
  type: FileType;

  @ApiProperty({
    description: 'ID do aluno associado (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  studentId?: string;

  @ApiProperty({
    description: 'ID do professor associado (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  teacherId?: string;

  @ApiProperty({
    description: 'ID do usuário que fez o upload',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uploaderId: string;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}