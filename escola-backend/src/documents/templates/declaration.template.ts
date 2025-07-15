/**
 * Declaration Template - Template para Declaração de Matrícula
 * Referência: context7 mcp - Template Pattern
 */
import { ApiProperty } from '@nestjs/swagger';

export class DeclarationData {
  @ApiProperty({
    description: 'Tipo do documento',
    example: 'DECLARACAO_MATRICULA',
  })
  documentType: 'DECLARACAO_MATRICULA';

  @ApiProperty({
    description: 'Nome completo do aluno',
    example: 'João Silva Santos',
  })
  studentName: string;

  @ApiProperty({
    description: 'Data de nascimento do aluno',
    example: '2010-05-15',
  })
  birthDate: string;

  @ApiProperty({
    description: 'Nome da turma atual',
    example: '3° Ano A',
  })
  className: string;

  @ApiProperty({
    description: 'Turno da turma',
    example: 'MORNING',
    enum: ['MORNING', 'AFTERNOON', 'EVENING'],
  })
  shift: string;

  @ApiProperty({
    description: 'Ano letivo atual',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Status da matrícula',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'TRANSFERRED', 'CANCELLED', 'PENDING'],
  })
  enrollmentStatus: string;

  @ApiProperty({
    description: 'Data de matrícula',
    example: '2024-02-01',
  })
  enrollmentDate: string;

  @ApiProperty({
    description: 'Nome da instituição',
    example: 'Escola Synexa',
  })
  institutionName: string;

  @ApiProperty({
    description: 'Endereço da instituição',
    example: 'Rua das Flores, 123 - Centro - São Paulo/SP',
  })
  institutionAddress: string;

  @ApiProperty({
    description: 'Cidade da instituição',
    example: 'São Paulo',
  })
  city: string;

  @ApiProperty({
    description: 'Data de emissão da declaração',
    example: '2024-12-15',
  })
  issueDate: string;

  @ApiProperty({
    description: 'Nome do emissor responsável',
    example: 'Maria Silva - Secretária',
  })
  issuer: string;

  @ApiProperty({
    description: 'Cargo do emissor',
    example: 'Secretária Escolar',
  })
  issuerRole: string;

  @ApiProperty({
    description: 'Finalidade da declaração',
    example: 'Para fins de comprovação de matrícula escolar',
  })
  purpose: string;
}