/**
 * Class Entity - Entidade Turma
 * Referência: context7 mcp - Entity Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { SchoolClass as PrismaSchoolClass, Student, Teacher, User, Shift, ClassLevel, SchoolCycle } from '@prisma/client';

export class SchoolClass implements PrismaSchoolClass {
  @ApiProperty({
    description: 'ID único da turma',
    example: 'uuid-generated-id',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da turma',
    example: '3° Ano A',
  })
  name: string;

  @ApiProperty({
    description: 'Nível de classe (1.ª à 12.ª classe)',
    example: 'CLASSE_7',
    enum: ClassLevel,
  })
  classLevel: ClassLevel;

  @ApiProperty({
    description: 'Ciclo escolar',
    example: 'SECUNDARIO_1',
    enum: SchoolCycle,
  })
  cycle: SchoolCycle;

  @ApiProperty({
    description: 'Ano letivo',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Turno da turma',
    example: 'MORNING',
    enum: ['MORNING', 'AFTERNOON', 'EVENING'],
  })
  shift: Shift;

  @ApiProperty({
    description: 'Capacidade máxima de alunos',
    example: 30,
  })
  capacity: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-01T10:00:00.000Z',
  })
  updatedAt: Date;
}

export class SchoolClassWithRelations extends SchoolClass {
  @ApiProperty({
    description: 'Alunos matriculados na turma',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'student-uuid-id' },
        name: { type: 'string', example: 'João Silva' },
        email: { type: 'string', example: 'joao.silva@email.com' },
        birthDate: { type: 'string', example: '2010-05-15T00:00:00.000Z' },
        createdAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
      },
    },
  })
  students: Omit<Student, 'classId'>[];

  @ApiProperty({
    description: 'Professores responsáveis pela turma',
    type: 'array',
    items: {
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
    },
  })
  teachers: (Teacher & { user: Omit<User, 'password'> })[];
}