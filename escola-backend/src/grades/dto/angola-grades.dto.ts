/**
 * DTOs para os endpoints de notas Angola
 * Sistema angolano: MAC, NPP, NPT → MT (Média Trimestral)
 */
import { ApiProperty } from '@nestjs/swagger';

export enum GradeStatus {
  APROVADO = 'APROVADO',
  REPROVADO = 'REPROVADO',
  INCOMPLETO = 'INCOMPLETO',
}

export class AngolaSubjectGradeDto {
  @ApiProperty({ 
    example: 'Matemática',
    description: 'Nome da disciplina' 
  })
  subject: string;

  @ApiProperty({ 
    example: 13,
    description: 'Média das Aulas Contínuas (0-20)', 
    minimum: 0, 
    maximum: 20,
    nullable: true 
  })
  mac: number | null;

  @ApiProperty({ 
    example: 14,
    description: 'Nota da Prova do Professor (0-20)', 
    minimum: 0, 
    maximum: 20,
    nullable: true 
  })
  npp: number | null;

  @ApiProperty({ 
    example: 12,
    description: 'Nota da Prova Trimestral (0-20)', 
    minimum: 0, 
    maximum: 20,
    nullable: true 
  })
  npt: number | null;

  @ApiProperty({ 
    example: 13.0,
    description: 'Média Trimestral calculada (MAC + NPP + NPT) / 3', 
    minimum: 0, 
    maximum: 20,
    type: 'number',
    format: 'float' 
  })
  mt: number;

  @ApiProperty({ 
    example: GradeStatus.APROVADO,
    description: 'Status: APROVADO (MT ≥ 10), REPROVADO (MT < 10), ou INCOMPLETO (falta nota)',
    enum: GradeStatus 
  })
  status: GradeStatus;
}

export class AngolaStudentTermGradesDto {
  @ApiProperty({ 
    example: 'Carlos Mateus Silva',
    description: 'Nome completo do aluno' 
  })
  student: string;

  @ApiProperty({ 
    example: '1º Trimestre',
    description: 'Trimestre das notas' 
  })
  term: string;

  @ApiProperty({ 
    type: [AngolaSubjectGradeDto],
    description: 'Lista de notas por disciplina' 
  })
  subjects: AngolaSubjectGradeDto[];

  @ApiProperty({ 
    example: 14.5,
    description: 'Média geral do aluno no trimestre', 
    minimum: 0, 
    maximum: 20,
    type: 'number',
    format: 'float' 
  })
  average: number;

  @ApiProperty({ 
    example: GradeStatus.APROVADO,
    description: 'Status geral do aluno no trimestre',
    enum: GradeStatus 
  })
  statusGeral: GradeStatus;
}

export class AngolaClassStudentSummaryDto {
  @ApiProperty({ 
    example: 'Carlos Mateus Silva',
    description: 'Nome completo do aluno' 
  })
  student: string;

  @ApiProperty({ 
    example: 13.0,
    description: 'Média trimestral do aluno', 
    minimum: 0, 
    maximum: 20,
    type: 'number',
    format: 'float' 
  })
  mt: number;

  @ApiProperty({ 
    example: GradeStatus.APROVADO,
    description: 'Status do aluno no trimestre',
    enum: GradeStatus 
  })
  status: GradeStatus;
}

export class AngolaCalculateMtDto {
  @ApiProperty({ 
    example: 14,
    description: 'Média das Aulas Contínuas', 
    minimum: 0, 
    maximum: 20,
    nullable: true 
  })
  mac: number | null;

  @ApiProperty({ 
    example: 12,
    description: 'Nota da Prova do Professor', 
    minimum: 0, 
    maximum: 20,
    nullable: true 
  })
  npp: number | null;

  @ApiProperty({ 
    example: 15,
    description: 'Nota da Prova Trimestral', 
    minimum: 0, 
    maximum: 20,
    nullable: true 
  })
  npt: number | null;

  @ApiProperty({ 
    example: 13.7,
    description: 'Média Trimestral calculada', 
    minimum: 0, 
    maximum: 20,
    type: 'number',
    format: 'float' 
  })
  mt: number;

  @ApiProperty({ 
    example: GradeStatus.APROVADO,
    description: 'Status baseado na MT',
    enum: GradeStatus 
  })
  status: GradeStatus;
}