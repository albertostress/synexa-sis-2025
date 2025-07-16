/**
 * Teacher Entity - Entidade Professor
 * Referência: context7 mcp - Entity Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { Teacher as PrismaTeacher, User } from '@prisma/client';

export class Teacher implements PrismaTeacher {
  @ApiProperty({
    description: 'ID único do professor',
    example: 'uuid-generated-id',
  })
  id: string;

  @ApiProperty({
    description: 'ID do usuário associado',
    example: 'user-uuid-id',
  })
  userId: string;

  @ApiProperty({
    description: 'Biografia do professor',
    example: 'Professor de Matemática com 10 anos de experiência',
    required: false,
  })
  bio: string | null;

  @ApiProperty({
    description: 'Qualificação do professor',
    example: 'Licenciatura em Matemática',
    required: false,
  })
  qualification: string | null;

  @ApiProperty({
    description: 'Especialização do professor',
    example: 'Matemática Aplicada',
    required: false,
  })
  specialization: string | null;

  @ApiProperty({
    description: 'Anos de experiência',
    example: 5,
    required: false,
  })
  experience: number | null;

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

export class TeacherWithUser extends Teacher {
  @ApiProperty({
    description: 'Dados do usuário associado',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'user-uuid-id' },
      name: { type: 'string', example: 'Prof. João Silva' },
      email: { type: 'string', example: 'joao.silva@escola.com' },
      role: { type: 'string', example: 'PROFESSOR' },
    },
  })
  user: Omit<User, 'password'>;
}