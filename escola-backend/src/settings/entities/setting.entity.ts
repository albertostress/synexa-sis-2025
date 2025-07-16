import { ApiProperty } from '@nestjs/swagger';

export class Setting {
  @ApiProperty({
    description: 'ID único da configuração',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Chave da configuração',
    example: 'school_name',
  })
  key: string;

  @ApiProperty({
    description: 'Valor da configuração',
    example: 'Escola Primária Synexa',
  })
  value: string;

  @ApiProperty({
    description: 'Descrição da configuração',
    example: 'Nome oficial da escola',
  })
  description: string;

  @ApiProperty({
    description: 'Tipo de configuração',
    example: 'STRING',
    enum: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'],
  })
  type: string;

  @ApiProperty({
    description: 'Indica se a configuração é pública',
    example: true,
  })
  isPublic: boolean;

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