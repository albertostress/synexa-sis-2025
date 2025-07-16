/**
 * Message Entities - Entidades para documentação Swagger
 * Referência: context7 mcp - NestJS Entities Pattern
 */
import { ApiProperty } from '@nestjs/swagger';

export class MessageEntity {
  @ApiProperty({
    description: 'ID único da mensagem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Título da mensagem',
    example: 'Reunião de Pais - Setembro 2024',
  })
  title: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    example: 'Informamos que haverá reunião de pais no dia 15 de setembro às 19h...',
  })
  content: string;

  @ApiProperty({
    description: 'Prioridade da mensagem',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    example: 'HIGH',
  })
  priority: string;

  @ApiProperty({
    description: 'Público-alvo da mensagem',
    type: [String],
    enum: ['PARENTS', 'TEACHERS', 'ALL_STAFF', 'SPECIFIC_CLASS', 'INDIVIDUAL', 'GROUP'],
    example: ['PARENTS', 'TEACHERS'],
  })
  audience: string[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-08-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-08-15T14:30:00.000Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Informações do criador da mensagem',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', example: 'João Silva' },
      role: { type: 'string', example: 'ADMIN' },
    },
  })
  createdBy: {
    id: string;
    name: string;
    role: string;
  };

  @ApiProperty({
    description: 'Se a mensagem foi lida pelo usuário atual',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Número total de destinatários',
    example: 25,
  })
  totalRecipients: number;

  @ApiProperty({
    description: 'Número de destinatários que já leram',
    example: 15,
  })
  readCount: number;

  @ApiProperty({
    description: 'Data de expiração (opcional)',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  expiresAt?: string;

  @ApiProperty({
    description: 'Se a mensagem está expirada',
    example: false,
  })
  isExpired: boolean;
}

export class InboxMessageEntity {
  @ApiProperty({
    description: 'ID único da mensagem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Título da mensagem',
    example: 'Reunião de Pais - Setembro 2024',
  })
  title: string;

  @ApiProperty({
    description: 'Prévia do conteúdo (primeiros 100 caracteres)',
    example: 'Informamos que haverá reunião de pais no dia 15 de setembro às 19h. A reunião tem como objetivo...',
  })
  preview: string;

  @ApiProperty({
    description: 'Prioridade da mensagem',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    example: 'HIGH',
  })
  priority: string;

  @ApiProperty({
    description: 'Nome do remetente',
    example: 'Direção Escolar',
  })
  senderName: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-08-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Se a mensagem foi lida',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Se a mensagem está expirada',
    example: false,
  })
  isExpired: boolean;
}

export class MessageListResponse {
  @ApiProperty({
    description: 'Lista de mensagens',
    type: [InboxMessageEntity],
    isArray: true,
  })
  data: InboxMessageEntity[];

  @ApiProperty({
    description: 'Informações de paginação',
    type: 'object',
    properties: {
      total: { type: 'number', example: 50 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      pages: { type: 'number', example: 3 },
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };

  @ApiProperty({
    description: 'Resumo das mensagens',
    type: 'object',
    properties: {
      totalMessages: { type: 'number', example: 50 },
      unreadMessages: { type: 'number', example: 12 },
      urgentMessages: { type: 'number', example: 3 },
      expiredMessages: { type: 'number', example: 2 },
    },
  })
  summary: {
    totalMessages: number;
    unreadMessages: number;
    urgentMessages: number;
    expiredMessages: number;
  };
}

export class MessageStatsEntity {
  @ApiProperty({
    description: 'Total de mensagens enviadas',
    example: 150,
  })
  totalSent: number;

  @ApiProperty({
    description: 'Mensagens ativas (não expiradas)',
    example: 120,
  })
  activeMessages: number;

  @ApiProperty({
    description: 'Taxa de leitura média',
    example: 75.5,
  })
  averageReadRate: number;

  @ApiProperty({
    description: 'Mensagens por prioridade',
    type: 'object',
    properties: {
      LOW: { type: 'number', example: 30 },
      NORMAL: { type: 'number', example: 80 },
      HIGH: { type: 'number', example: 35 },
      URGENT: { type: 'number', example: 5 },
    },
  })
  byPriority: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    URGENT: number;
  };

  @ApiProperty({
    description: 'Mensagens por público-alvo',
    type: 'object',
    properties: {
      PARENTS: { type: 'number', example: 45 },
      TEACHERS: { type: 'number', example: 60 },
      ALL_STAFF: { type: 'number', example: 25 },
      SPECIFIC_CLASS: { type: 'number', example: 15 },
      INDIVIDUAL: { type: 'number', example: 5 },
    },
  })
  byAudience: {
    PARENTS: number;
    TEACHERS: number;
    ALL_STAFF: number;
    SPECIFIC_CLASS: number;
    INDIVIDUAL: number;
    GROUP: number;
  };
}