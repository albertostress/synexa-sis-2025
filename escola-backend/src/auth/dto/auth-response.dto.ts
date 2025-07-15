import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT de acesso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Informações do usuário autenticado',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'uuid' },
      name: { type: 'string', example: 'João Silva' },
      email: { type: 'string', example: 'joao.silva@escola.com' },
      role: { type: 'string', enum: ['ADMIN', 'SECRETARIA', 'PROFESSOR', 'DIRETOR'] },
    },
  })
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}