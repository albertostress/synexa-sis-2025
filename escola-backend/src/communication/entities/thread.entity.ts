/**
 * Thread Entities - Entidades para documentação Swagger (sistema de threads)
 * Referência: context7 mcp - NestJS Entities Pattern
 */
import { ApiProperty } from '@nestjs/swagger';

export class ThreadParticipantEntity {
  @ApiProperty({
    description: 'ID único do participante',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do participante',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Role do participante no sistema',
    enum: ['ADMIN', 'DIRETOR', 'SECRETARIA', 'PROFESSOR', 'PARENT'],
    example: 'PROFESSOR',
  })
  role: string;

  @ApiProperty({
    description: 'Se o participante está silenciado nesta conversa',
    example: false,
  })
  isMuted: boolean;

  @ApiProperty({
    description: 'Se o participante arquivou esta conversa',
    example: false,
  })
  isArchived: boolean;

  @ApiProperty({
    description: 'Data de entrada na conversa',
    example: '2024-08-15T10:30:00.000Z',
  })
  joinedAt: string;
}

export class ThreadMessageEntity {
  @ApiProperty({
    description: 'ID único da mensagem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    example: 'Podemos marcar a reunião para quarta-feira às 14h?',
  })
  content: string;

  @ApiProperty({
    description: 'ID do remetente',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  senderId: string;

  @ApiProperty({
    description: 'Informações do remetente',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: 'Maria Santos' },
      role: { type: 'string', example: 'SECRETARIA' },
    },
  })
  sender: {
    id: string;
    name: string;
    role: string;
  };

  @ApiProperty({
    description: 'Lista de IDs dos usuários que leram esta mensagem',
    type: [String],
    example: ['660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002'],
  })
  readBy: string[];

  @ApiProperty({
    description: 'Se a mensagem foi lida pelo usuário atual',
    example: true,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Data de criação da mensagem',
    example: '2024-08-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-08-15T10:30:00.000Z',
  })
  updatedAt: string;
}

export class ThreadEntity {
  @ApiProperty({
    description: 'ID único da conversa',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Assunto da conversa',
    example: 'Reunião sobre desempenho do aluno João',
    required: false,
  })
  subject?: string;

  @ApiProperty({
    description: 'Data de criação da conversa',
    example: '2024-08-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-08-15T14:30:00.000Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Lista de participantes da conversa',
    type: [ThreadParticipantEntity],
    isArray: true,
  })
  participants: ThreadParticipantEntity[];

  @ApiProperty({
    description: 'Número total de mensagens na conversa',
    example: 5,
  })
  messageCount: number;

  @ApiProperty({
    description: 'Número de mensagens não lidas pelo usuário atual',
    example: 2,
  })
  unreadCount: number;

  @ApiProperty({
    description: 'Última mensagem da conversa',
    type: ThreadMessageEntity,
  })
  lastMessage: ThreadMessageEntity;

  @ApiProperty({
    description: 'Se a conversa está arquivada para o usuário atual',
    example: false,
  })
  isArchived: boolean;

  @ApiProperty({
    description: 'Se o usuário está silenciado nesta conversa',
    example: false,
  })
  isMuted: boolean;
}

export class ThreadDetailEntity extends ThreadEntity {
  @ApiProperty({
    description: 'Lista completa de mensagens da conversa',
    type: [ThreadMessageEntity],
    isArray: true,
  })
  messages: ThreadMessageEntity[];
}

export class ThreadListResponse {
  @ApiProperty({
    description: 'Lista de conversas',
    type: [ThreadEntity],
    isArray: true,
  })
  data: ThreadEntity[];

  @ApiProperty({
    description: 'Informações de paginação',
    type: 'object',
    properties: {
      total: { type: 'number', example: 25 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      pages: { type: 'number', example: 2 },
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };

  @ApiProperty({
    description: 'Resumo das conversas',
    type: 'object',
    properties: {
      totalThreads: { type: 'number', example: 25 },
      unreadThreads: { type: 'number', example: 8 },
      archivedThreads: { type: 'number', example: 3 },
      mutedThreads: { type: 'number', example: 1 },
    },
  })
  summary: {
    totalThreads: number;
    unreadThreads: number;
    archivedThreads: number;
    mutedThreads: number;
  };
}