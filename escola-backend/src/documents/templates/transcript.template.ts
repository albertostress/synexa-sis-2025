/**
 * Transcript Template - Template para Histórico Escolar
 * Referência: context7 mcp - Template Pattern
 */
import { ApiProperty } from '@nestjs/swagger';

export class TranscriptSubject {
  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'Matemática',
  })
  subjectName: string;

  @ApiProperty({
    description: 'Ano letivo cursado',
    example: 2023,
  })
  year: number;

  @ApiProperty({
    description: 'Nota final da disciplina',
    example: 8.5,
  })
  finalGrade: number;

  @ApiProperty({
    description: 'Status na disciplina',
    example: 'APROVADO',
    enum: ['APROVADO', 'REPROVADO'],
  })
  status: 'APROVADO' | 'REPROVADO';

  @ApiProperty({
    description: 'Carga horária da disciplina',
    example: 80,
  })
  workload: number;
}

export class TranscriptYear {
  @ApiProperty({
    description: 'Ano letivo',
    example: 2023,
  })
  year: number;

  @ApiProperty({
    description: 'Nome da turma',
    example: '2° Ano A',
  })
  className: string;

  @ApiProperty({
    description: 'Disciplinas cursadas no ano',
    type: [TranscriptSubject],
  })
  subjects: TranscriptSubject[];

  @ApiProperty({
    description: 'Média anual',
    example: 8.2,
  })
  yearAverage: number;

  @ApiProperty({
    description: 'Status do ano letivo',
    example: 'APROVADO',
    enum: ['APROVADO', 'REPROVADO', 'EM_RECUPERACAO'],
  })
  yearStatus: 'APROVADO' | 'REPROVADO' | 'EM_RECUPERACAO';
}

export class TranscriptData {
  @ApiProperty({
    description: 'Tipo do documento',
    example: 'HISTORICO_ESCOLAR',
  })
  documentType: 'HISTORICO_ESCOLAR';

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
    description: 'RG do aluno',
    example: '12.345.678-9',
  })
  rg: string;

  @ApiProperty({
    description: 'CPF do aluno',
    example: '123.456.789-00',
  })
  cpf: string;

  @ApiProperty({
    description: 'Nome da mãe',
    example: 'Maria Silva Santos',
  })
  motherName: string;

  @ApiProperty({
    description: 'Nome do pai',
    example: 'José Santos',
  })
  fatherName: string;

  @ApiProperty({
    description: 'Anos letivos cursados',
    type: [TranscriptYear],
  })
  years: TranscriptYear[];

  @ApiProperty({
    description: 'Média geral do histórico',
    example: 8.0,
  })
  overallAverage: number;

  @ApiProperty({
    description: 'Status geral do aluno',
    example: 'APROVADO',
    enum: ['APROVADO', 'REPROVADO', 'CURSANDO'],
  })
  overallStatus: 'APROVADO' | 'REPROVADO' | 'CURSANDO';

  @ApiProperty({
    description: 'Data de início dos estudos',
    example: '2022-02-01',
  })
  startDate: string;

  @ApiProperty({
    description: 'Data de conclusão (se aplicável)',
    example: '2024-12-15',
    required: false,
  })
  endDate?: string;

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
    description: 'Data de emissão do histórico',
    example: '2024-12-15',
  })
  issueDate: string;

  @ApiProperty({
    description: 'Nome do emissor responsável',
    example: 'Maria Silva - Diretora',
  })
  issuer: string;

  @ApiProperty({
    description: 'Cargo do emissor',
    example: 'Diretora Acadêmica',
  })
  issuerRole: string;
}