/**
 * Angola Report Card Entity - Entidade Boletim Escolar Angolano (MINED)
 * Sistema de classificação: 0-20 pontos
 */
import { ApiProperty } from '@nestjs/swagger';

export class AngolaSubjectGrades {
  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'Matemática',
  })
  subjectName: string;

  @ApiProperty({
    description: 'Nome do professor responsável',
    example: 'Prof. João Silva',
  })
  teacherName: string;

  @ApiProperty({
    description: 'Média das Avaliações Contínuas (MAC)',
    example: 14.0,
    nullable: true,
  })
  mac: number | null;

  @ApiProperty({
    description: 'Nota da Prova do Professor (NPP)',
    example: 16.0,
    nullable: true,
  })
  npp: number | null;

  @ApiProperty({
    description: 'Nota da Prova Trimestral (NPT)',
    example: 15.0,
    nullable: true,
  })
  npt: number | null;

  @ApiProperty({
    description: 'Média Trimestral calculada: (MAC + NPP + NPT) / 3',
    example: 15.0,
    nullable: true,
  })
  mt: number | null;

  @ApiProperty({
    description: 'Total de faltas na disciplina',
    example: 2,
  })
  fal: number;

  @ApiProperty({
    description: 'Classificação textual baseada na MT',
    example: 'Muito Bom',
    enum: ['Excelente', 'Muito Bom', 'Bom', 'Satisfatório', 'Não Satisfatório'],
  })
  classification: string;
}

export class AngolaReportCard {
  @ApiProperty({
    description: 'Informações do aluno',
    type: 'object',
    properties: {
      name: { type: 'string', example: 'João Silva Santos' },
      fatherName: { type: 'string', example: 'António Silva' },
      className: { type: 'string', example: '12ª Classe - Turma A' },
      shift: { type: 'string', example: 'Manhã' },
      birthDate: { type: 'string', example: '2006-03-15' },
      academicYear: { type: 'number', example: 2024 },
    },
  })
  student: {
    name: string;
    fatherName: string | null;
    className: string;
    shift: string;
    birthDate: string;
    academicYear: number;
  };

  @ApiProperty({
    description: 'Lista de disciplinas com notas angolanas',
    type: [AngolaSubjectGrades],
  })
  subjects: AngolaSubjectGrades[];

  @ApiProperty({
    description: 'Média Geral (média das MTs)',
    example: 14.5,
  })
  averageGrade: number;

  @ApiProperty({
    description: 'Situação Final do aluno',
    example: 'Aprovado',
    enum: ['Aprovado', 'Reprovado'],
  })
  finalStatus: string;

  @ApiProperty({
    description: 'Percentual de frequência geral',
    example: 95.5,
  })
  attendancePercentage: number;

  @ApiProperty({
    description: 'Termo/Trimestre específico ou null para boletim final',
    example: 1,
    nullable: true,
  })
  term: number | null;

  @ApiProperty({
    description: 'Ano letivo',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Data de geração do boletim',
    example: '2024-07-22T14:30:00.000Z',
  })
  generatedAt: Date;
}