import { ApiProperty } from '@nestjs/swagger';

export enum EventType {
  PALESTRA = 'PALESTRA',
  PASSEIO = 'PASSEIO',
  REUNIAO = 'REUNIAO',
  FORMATURA = 'FORMATURA',
  OUTRO = 'OUTRO',
}

export class Event {
  @ApiProperty({
    description: 'ID único do evento',
    example: 'uuid-do-evento',
  })
  id: string;

  @ApiProperty({
    description: 'Título do evento',
    example: 'Festa Junina 2025',
  })
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada do evento',
    example: 'Festa junina anual da escola com apresentações culturais, comidas típicas e quadrilha.',
  })
  description: string;

  @ApiProperty({
    description: 'Data e hora do evento',
    example: '2025-06-15T14:00:00Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Local onde será realizado o evento',
    example: 'Pátio principal da escola',
  })
  location: string;

  @ApiProperty({
    description: 'Tipo do evento',
    enum: EventType,
    example: EventType.OUTRO,
  })
  type: EventType;

  @ApiProperty({
    description: 'Data de criação do evento',
    example: '2025-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2025-01-16T14:20:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Lista de participantes do evento',
    type: 'array',
    required: false,
  })
  participants?: any[];

  @ApiProperty({
    description: 'Total de participantes inscritos',
    example: 45,
    required: false,
  })
  totalParticipants?: number;

  @ApiProperty({
    description: 'Total de presenças confirmadas',
    example: 38,
    required: false,
  })
  totalPresent?: number;
}