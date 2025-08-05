/**
 * Subject Entity - Entidade Disciplina
 * Referência: context7 mcp - Entity Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { Subject as PrismaSubject, Teacher, User, ClassLevel, SchoolCycle, SubjectCategory } from '@prisma/client';

export class Subject implements PrismaSubject {
  @ApiProperty({
    description: 'ID único da disciplina',
    example: 'uuid-generated-id',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'Matemática',
  })
  name: string;

  @ApiProperty({
    description: 'Descrição da disciplina',
    example: 'Disciplina de matemática fundamental e aplicada',
    required: false,
  })
  description: string | null;

  @ApiProperty({
    description: 'Código único da disciplina',
    example: 'MAT101',
  })
  code: string;

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
    description: 'Ano letivo da disciplina',
    example: '1º Ano',
  })
  year: string;

  @ApiProperty({
    description: 'Categoria da disciplina',
    enum: SubjectCategory,
    example: 'OBRIGATORIA',
  })
  category: SubjectCategory;

  @ApiProperty({
    description: 'Número de créditos da disciplina',
    example: 3,
  })
  credits: number;

  @ApiProperty({
    description: 'Carga horária da disciplina em horas',
    example: 60,
  })
  workloadHours: number;

  @ApiProperty({
    description: 'Se a disciplina está ativa',
    example: true,
  })
  isActive: boolean;

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

export class SubjectWithTeachers extends Subject {
  @ApiProperty({
    description: 'Professores associados à disciplina',
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