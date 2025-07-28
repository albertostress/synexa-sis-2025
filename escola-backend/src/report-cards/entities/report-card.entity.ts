/**
 * Report Card Entity - Entidade Boletim Escolar (Sistema Angolano)
 * Referência: context7 mcp - Entity Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { GradeType } from '@prisma/client';

export class AngolanGradeDetail {
  @ApiProperty({
    description: 'Tipo de avaliação',
    enum: GradeType,
    example: GradeType.MAC,
  })
  type: GradeType;

  @ApiProperty({
    description: 'Valor da nota (0-20)',
    example: 16.5,
  })
  value: number;

  @ApiProperty({
    description: 'Trimestre (1, 2, 3)',
    example: 1,
  })
  term: number;
}

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
    description: 'Notas por tipo (MAC, NPP, NPT, MT, FAL)',
    type: [AngolanGradeDetail],
  })
  grades: AngolanGradeDetail[];

  @ApiProperty({
    description: 'Média Trimestral calculada (MT)',
    example: 16.0,
    required: false,
  })
  averageGrade?: number;

  @ApiProperty({
    description: 'Total de faltas',
    example: 3,
  })
  absences: number;

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
    description: 'Nome do pai/responsável',
    example: 'António Silva',
    required: false,
  })
  fatherName?: string;

  @ApiProperty({
    description: 'Email dos pais/responsáveis',
    example: 'pais.joao@email.com',
  })
  parentEmail: string;

  @ApiProperty({
    description: 'Número de estudante',
    example: 'EST2024001',
  })
  studentNumber: string;

  @ApiProperty({
    description: 'Data de nascimento do aluno',
    example: '2010-05-15T00:00:00.000Z',
  })
  birthDate: Date;

  @ApiProperty({
    description: 'URL da foto do aluno',
    example: '/uploads/photos/student123.jpg',
    required: false,
  })
  photoUrl?: string;
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
    description: 'Trimestre específico (1, 2, 3) ou null para boletim final',
    example: 1,
    required: false,
  })
  term?: number;

  @ApiProperty({
    description: 'Notas por disciplina (Sistema Angolano)',
    type: [SubjectGrade],
  })
  subjects: SubjectGrade[];

  @ApiProperty({
    description: 'Média geral do aluno (0-20)',
    example: 15.8,
  })
  averageGrade: number;

  @ApiProperty({
    description: 'Percentual de frequência',
    example: 94.5,
  })
  attendancePercentage: number;

  @ApiProperty({
    description: 'Status de aprovação',
    example: 'APROVADO',
    enum: ['APROVADO', 'REPROVADO', 'EM_RECUPERACAO'],
  })
  status: 'APROVADO' | 'REPROVADO' | 'EM_RECUPERACAO';

  @ApiProperty({
    description: 'Informações da escola',
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Complexo Escolar Privado Casa Inglesa' },
      province: { type: 'string', example: 'Luanda' },
      municipality: { type: 'string', example: 'Belas' },
    },
  })
  school: {
    name: string;
    province: string;
    municipality: string;
  };

  @ApiProperty({
    description: 'Data de geração do boletim',
    example: '2024-12-15T10:00:00.000Z',
  })
  generatedAt: Date;
}