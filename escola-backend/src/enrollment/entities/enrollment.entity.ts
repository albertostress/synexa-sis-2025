/**
 * Enrollment Entity - Entidade Matrícula
 * Referência: context7 mcp - Entity Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { Enrollment as PrismaEnrollment, Student, SchoolClass, EnrollmentStatus, Teacher, User } from '@prisma/client';

export class Enrollment implements PrismaEnrollment {
  @ApiProperty({
    description: 'ID único da matrícula',
    example: 'uuid-generated-id',
  })
  id: string;

  @ApiProperty({
    description: 'ID do aluno matriculado',
    example: 'student-uuid-id',
  })
  studentId: string;

  @ApiProperty({
    description: 'ID da turma',
    example: 'class-uuid-id',
  })
  classId: string;

  @ApiProperty({
    description: 'Ano letivo da matrícula',
    example: 2024,
  })
  year: number;

  @ApiProperty({
    description: 'Status da matrícula',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'TRANSFERRED', 'CANCELLED', 'PENDING'],
  })
  status: EnrollmentStatus;

  @ApiProperty({
    description: 'Data de criação da matrícula',
    example: '2024-01-01T10:00:00.000Z',
  })
  createdAt: Date;
}

export class EnrollmentWithRelations extends Enrollment {
  @ApiProperty({
    description: 'Dados do aluno matriculado',
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