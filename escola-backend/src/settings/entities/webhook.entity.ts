import { ApiProperty } from '@nestjs/swagger';

export class Webhook {
  @ApiProperty({
    description: 'ID único do webhook',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do webhook',
    example: 'Webhook de Pagamentos',
  })
  name: string;

  @ApiProperty({
    description: 'URL do webhook',
    example: 'https://api.exemplo.com/webhook',
  })
  url: string;

  @ApiProperty({
    description: 'Método HTTP',
    example: 'POST',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
  method: string;

  @ApiProperty({
    description: 'Eventos que disparam o webhook',
    example: ['PAYMENT_RECEIVED', 'ENROLLMENT_CREATED'],
  })
  events: string[];

  @ApiProperty({
    description: 'Cabeçalhos HTTP personalizados',
    example: { 'Authorization': 'Bearer token123' },
  })
  headers?: Record<string, string>;

  @ApiProperty({
    description: 'Chave secreta para verificação',
    example: 'secret_key_123',
  })
  secret?: string;

  @ApiProperty({
    description: 'Status do webhook',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Número de tentativas em caso de falha',
    example: 3,
  })
  retryAttempts: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}