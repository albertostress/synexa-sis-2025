/**
 * Report Card Entity - Entidade Boletim Escolar
 * Referência: context7 mcp - Entity Pattern
 */
import { ApiProperty } from '@nestjs/swagger';

export class SubjectGrade {
  @ApiProperty({
    description: 'ID da disciplina',
    example: 'uuid-subject-id',
  })
  subjectId: string;

  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'Matemática',
  })
  subjectName: string;

  @ApiProperty({
    description: 'Descrição da disciplina',
    example: 'Disciplina de matemática fundamental',
    required: false,
  })
  subjectDescription?: string;

  @ApiProperty({
    description: 'Nota do aluno na disciplina',
    example: 8.5,
  })
  grade: number;

  @ApiProperty({
    description: 'Nome do professor responsável',
    example: 'Prof. João Silva',
  })
  teacherName: string;

  @ApiProperty({
    description: 'Email do professor responsável',
    example: 'joao.silva@escola.com',
  })
  teacherEmail: string;
}

export class StudentInfo {
  @ApiProperty({
    description: 'ID do aluno',
    example: 'uuid-student-id',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do aluno',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Email do aluno',
    example: 'joao.silva@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Data de nascimento do aluno',
    example: '2010-05-15T00:00:00.000Z',
  })
  birthDate: Date;
}

export class ClassInfo {
  @ApiProperty({
    description: 'ID da turma',
    example: 'uuid-class-id',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da turma',
    example: '3° Ano A',
  })
  name: string;

  @ApiProperty({
    description: 'Turno da turma',
    example: 'MORNING',
    enum: ['MORNING', 'AFTERNOON', 'EVENING'],
  })
  shift: string;

  @ApiProperty({
    description: 'Capacidade da turma',
    example: 30,
  })
  capacity: number;
}

export class ReportCard {
  @ApiProperty({
    description: 'Informações do aluno',
    type: StudentInfo,
  })
  student: StudentInfo;

  @ApiProperty({
    description: 'Informações da turma',
    type: ClassInfo,
  })
  class: ClassInfo;

  @ApiProperty({
    description: 'Ano letivo',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Notas por disciplina',
    type: [SubjectGrade],
  })
  subjects: SubjectGrade[];

  @ApiProperty({
    description: 'Média geral do aluno',
    example: 7.8,
  })
  averageGrade: number;

  @ApiProperty({
    description: 'Status de aprovação',
    example: 'APROVADO',
    enum: ['APROVADO', 'REPROVADO', 'EM_RECUPERACAO'],
  })
  status: 'APROVADO' | 'REPROVADO' | 'EM_RECUPERACAO';

  @ApiProperty({
    description: 'Data de geração do boletim',
    example: '2024-12-15T10:00:00.000Z',
  })
  generatedAt: Date;
}