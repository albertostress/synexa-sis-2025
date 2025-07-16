import { ApiProperty } from '@nestjs/swagger';

export class StudentTransport {
  @ApiProperty({
    description: 'ID único da atribuição de transporte',
    example: 'uuid-da-atribuicao',
  })
  id: string;

  @ApiProperty({
    description: 'ID do aluno',
    example: 'uuid-do-aluno',
  })
  studentId: string;

  @ApiProperty({
    description: 'ID da rota de transporte',
    example: 'uuid-da-rota',
  })
  routeId: string;

  @ApiProperty({
    description: 'Nome da paragem onde o aluno embarca/desembarca',
    example: 'Praça Central',
  })
  stopName: string;

  @ApiProperty({
    description: 'Notas adicionais sobre o transporte do aluno',
    example: 'Aluno tem dificuldades de locomoção',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Dados do aluno',
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
    description: 'Dados da rota de transporte',
    type: 'object',
    required: false,
  })
  route?: {
    id: string;
    name: string;
    driverName: string;
    vehicle: string;
    departure: string;
    returnTime: string;
    stops: { name: string; order: number }[];
  };
}