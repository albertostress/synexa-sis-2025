import { ApiProperty } from '@nestjs/swagger';

export class TransportRoute {
  @ApiProperty({
    description: 'ID único da rota de transporte',
    example: 'uuid-da-rota',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da rota de transporte',
    example: 'Rota Centro - Escola',
  })
  name: string;

  @ApiProperty({
    description: 'Nome do motorista responsável pela rota',
    example: 'João Silva',
  })
  driverName: string;

  @ApiProperty({
    description: 'Identificação do veículo (placa ou nome)',
    example: 'ABC-1234 ou Micro-bus Amarelo',
  })
  vehicle: string;

  @ApiProperty({
    description: 'Horário de saída da escola/garagem',
    example: '07:00',
  })
  departure: string;

  @ApiProperty({
    description: 'Horário de retorno à escola/garagem',
    example: '17:30',
  })
  returnTime: string;

  @ApiProperty({
    description: 'Lista ordenada de paragens da rota',
    example: [
      { name: 'Praça Central', order: 1 },
      { name: 'Mercado Municipal', order: 2 },
      { name: 'Bairro Novo', order: 3 },
    ],
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        order: { type: 'number' },
      },
    },
  })
  stops: { name: string; order: number }[];

  @ApiProperty({
    description: 'Data de criação da rota',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Lista de alunos atribuídos à rota',
    type: 'array',
    required: false,
  })
  students?: any[];
}