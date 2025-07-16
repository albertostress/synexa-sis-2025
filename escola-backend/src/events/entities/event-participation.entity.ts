import { ApiProperty } from '@nestjs/swagger';

export class EventParticipation {
  @ApiProperty({
    description: 'ID único da participação',
    example: 'uuid-da-participacao',
  })
  id: string;

  @ApiProperty({
    description: 'ID do evento',
    example: 'uuid-do-evento',
  })
  eventId: string;

  @ApiProperty({
    description: 'ID do aluno participante',
    example: 'uuid-do-aluno',
  })
  studentId: string;

  @ApiProperty({
    description: 'Status de presença do aluno no evento',
    example: true,
    default: false,
  })
  presence: boolean;

  @ApiProperty({
    description: 'Observações sobre a participação',
    example: 'Aluno participou ativamente das atividades',
    required: false,
  })
  note?: string;

  @ApiProperty({
    description: 'Data de registro da participação',
    example: '2025-05-10T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Dados do aluno participante',
    type: 'object',
    required: false,
  })
  student?: {
    id: string;
    name: string;
    email: string;
    schoolClass?: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    description: 'Dados do evento',
    type: 'object',
    required: false,
  })
  event?: {
    id: string;
    title: string;
    date: Date;
    location: string;
    type: string;
  };
}