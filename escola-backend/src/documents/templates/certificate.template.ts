/**
 * Certificate Template - Template para Certificado de Conclusão
 * Referência: context7 mcp - Template Pattern
 */
import { ApiProperty } from '@nestjs/swagger';

export class CertificateSubject {
  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'Matemática',
  })
  subjectName: string;

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
}

export class CertificateData {
  @ApiProperty({
    description: 'Tipo do documento',
    example: 'CERTIFICADO_CONCLUSAO',
  })
  documentType: 'CERTIFICADO_CONCLUSAO';

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
    description: 'Nome da turma concluída',
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
    description: 'Ano letivo de conclusão',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Disciplinas cursadas com notas',
    type: [CertificateSubject],
  })
  subjects: CertificateSubject[];

  @ApiProperty({
    description: 'Média geral de conclusão',
    example: 8.2,
  })
  overallAverage: number;

  @ApiProperty({
    description: 'Status final do aluno',
    example: 'APROVADO',
  })
  finalStatus: 'APROVADO';

  @ApiProperty({
    description: 'Nome da instituição',
    example: 'Escola Synexa',
  })
  institutionName: string;

  @ApiProperty({
    description: 'Cidade da instituição',
    example: 'São Paulo',
  })
  city: string;

  @ApiProperty({
    description: 'Data de emissão do certificado',
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