/**
 * Grade Entity - Entidade Nota (Sistema Angolano)
 * Referência: context7 mcp - Entity Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { Grade as PrismaGrade, Student, Subject, Teacher, User, SchoolClass, GradeType } from '@prisma/client';

export class Grade implements PrismaGrade {
  @ApiProperty({
    description: 'ID único da nota',
    example: 'uuid-generated-id',
  })
  id: string;

  @ApiProperty({
    description: 'ID do aluno',
    example: 'student-uuid-id',
  })
  studentId: string;

  @ApiProperty({
    description: 'ID da disciplina',
    example: 'subject-uuid-id',
  })
  subjectId: string;

  @ApiProperty({
    description: 'ID do professor',
    example: 'teacher-uuid-id',
  })
  teacherId: string;

  @ApiProperty({
    description: 'ID da turma',
    example: 'class-uuid-id',
  })
  classId: string;

  @ApiProperty({
    description: 'Tipo de avaliação',
    enum: GradeType,
    example: GradeType.MAC,
  })
  type: GradeType;

  @ApiProperty({
    description: 'Trimestre (1, 2 ou 3)',
    example: 1,
  })
  term: number;

  @ApiProperty({
    description: 'Ano letivo',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Valor da nota (0-20 - Sistema Angolano)',
    example: 16.5,
  })
  value: number;

  @ApiProperty({
    description: 'Data de criação da nota',
    example: '2024-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização da nota',
    example: '2024-01-01T10:00:00.000Z',
  })
  updatedAt: Date;
}

export class GradeWithRelations extends Grade {
  @ApiProperty({
    description: 'Dados do aluno',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'student-uuid-id' },
      name: { type: 'string', example: 'João Silva' },
      email: { type: 'string', example: 'joao.silva@email.com' },
      birthDate: { type: 'string', example: '2010-05-15T00:00:00.000Z' },
      createdAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
    },
  })
  student: Omit<Student, 'classId'>;

  @ApiProperty({
    description: 'Dados da disciplina',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'subject-uuid-id' },
      name: { type: 'string', example: 'Matemática' },
      description: { type: 'string', example: 'Disciplina de matemática fundamental' },
      createdAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
      updatedAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
    },
  })
  subject: Subject;

  @ApiProperty({
    description: 'Dados do professor',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'teacher-uuid-id' },
      userId: { type: 'string', example: 'user-uuid-id' },
      bio: { type: 'string', example: 'Professor especialista' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-uuid-id' },
          name: { type: 'string', example: 'Prof. João Silva' },
          email: { type: 'string', example: 'joao.silva@escola.com' },
          role: { type: 'string', example: 'PROFESSOR' },
        },
      },
    },
  })
  teacher: Teacher & { user: Omit<User, 'password'> };

  @ApiProperty({
    description: 'Dados da turma',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'class-uuid-id' },
      name: { type: 'string', example: '3° Ano A' },
      year: { type: 'number', example: 2024 },
      shift: { type: 'string', example: 'MORNING' },
      capacity: { type: 'number', example: 30 },
      createdAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
      updatedAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
    },
  })
  class: SchoolClass;
}