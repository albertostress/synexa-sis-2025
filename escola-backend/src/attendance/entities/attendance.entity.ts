/**
 * Attendance Entities - Entidades para documentação Swagger
 * Referência: context7 mcp - NestJS Entities Pattern
 */
import { ApiProperty } from '@nestjs/swagger';

export class AttendanceEntity {
  @ApiProperty({
    description: 'ID único da presença',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Data da chamada',
    example: '2024-08-15',
  })
  date: string;

  @ApiProperty({
    description: 'Informações do aluno',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: 'João Silva' },
      email: { type: 'string', example: 'joao.silva@email.com' },
    },
  })
  student: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Informações da turma',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: '3° Ano A' },
      shift: { type: 'string', example: 'MORNING' },
    },
  })
  class: {
    id: string;
    name: string;
    shift: string;
  };

  @ApiProperty({
    description: 'Informações da disciplina',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: 'Matemática' },
    },
  })
  subject: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Informações do professor',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: 'Prof. Carlos Silva' },
    },
  })
  teacher: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Se o aluno estava presente',
    example: true,
  })
  present: boolean;

  @ApiProperty({
    description: 'Se a falta foi justificada',
    example: false,
  })
  justified: boolean;

  @ApiProperty({
    description: 'Observação sobre a presença',
    example: 'Chegou atrasado',
    required: false,
  })
  note?: string;

  @ApiProperty({
    description: 'ID do usuário que registrou',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-08-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-08-15T14:30:00.000Z',
  })
  updatedAt: string;
}

export class StudentAttendanceSummary {
  @ApiProperty({
    description: 'Informações do aluno',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: 'João Silva' },
      email: { type: 'string', example: 'joao.silva@email.com' },
    },
  })
  student: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Total de aulas',
    example: 20,
  })
  totalClasses: number;

  @ApiProperty({
    description: 'Total de presenças',
    example: 18,
  })
  totalPresent: number;

  @ApiProperty({
    description: 'Total de faltas',
    example: 2,
  })
  totalAbsent: number;

  @ApiProperty({
    description: 'Total de faltas justificadas',
    example: 1,
  })
  totalJustified: number;

  @ApiProperty({
    description: 'Percentual de frequência',
    example: 90.0,
  })
  attendancePercentage: number;

  @ApiProperty({
    description: 'Resumo por disciplina',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        subjectId: { type: 'string' },
        subjectName: { type: 'string', example: 'Matemática' },
        totalClasses: { type: 'number', example: 10 },
        totalPresent: { type: 'number', example: 9 },
        attendancePercentage: { type: 'number', example: 90.0 },
      },
    },
  })
  bySubject: Array<{
    subjectId: string;
    subjectName: string;
    totalClasses: number;
    totalPresent: number;
    attendancePercentage: number;
  }>;
}

export class AttendanceListResponse {
  @ApiProperty({
    description: 'Lista de registros de presença',
    type: [AttendanceEntity],
    isArray: true,
  })
  data: AttendanceEntity[];

  @ApiProperty({
    description: 'Informações de paginação',
    type: 'object',
    properties: {
      total: { type: 'number', example: 100 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      pages: { type: 'number', example: 5 },
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ClassAttendanceReport {
  @ApiProperty({
    description: 'Informações da turma',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: '3° Ano A' },
      shift: { type: 'string', example: 'MORNING' },
    },
  })
  class: {
    id: string;
    name: string;
    shift: string;
  };

  @ApiProperty({
    description: 'Data da chamada',
    example: '2024-08-15',
  })
  date: string;

  @ApiProperty({
    description: 'Disciplina',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: 'Matemática' },
    },
    required: false,
  })
  subject?: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Lista de presenças dos alunos',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        studentName: { type: 'string', example: 'João Silva' },
        present: { type: 'boolean', example: true },
        justified: { type: 'boolean', example: false },
        note: { type: 'string', example: 'Chegou atrasado' },
      },
    },
  })
  attendances: Array<{
    studentId: string;
    studentName: string;
    present: boolean;
    justified: boolean;
    note?: string;
  }>;

  @ApiProperty({
    description: 'Resumo da turma',
    type: 'object',
    properties: {
      totalStudents: { type: 'number', example: 25 },
      totalPresent: { type: 'number', example: 23 },
      totalAbsent: { type: 'number', example: 2 },
      totalJustified: { type: 'number', example: 1 },
    },
  })
  summary: {
    totalStudents: number;
    totalPresent: number;
    totalAbsent: number;
    totalJustified: number;
  };
}