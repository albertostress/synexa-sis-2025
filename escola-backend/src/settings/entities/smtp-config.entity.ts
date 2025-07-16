import { ApiProperty } from '@nestjs/swagger';

export class SmtpConfig {
  @ApiProperty({
    description: 'ID único da configuração SMTP',
    example: 'uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'Servidor SMTP',
    example: 'smtp.gmail.com',
  })
  host: string;

  @ApiProperty({
    description: 'Porta do servidor SMTP',
    example: 587,
  })
  port: number;

  @ApiProperty({
    description: 'Usar SSL/TLS',
    example: true,
  })
  secure: boolean;

  @ApiProperty({
    description: 'Email do remetente',
    example: 'noreply@escola.com',
  })
  user: string;

  @ApiProperty({
    description: 'Senha do email (criptografada)',
    example: 'encrypted_password',
  })
  password: string;

  @ApiProperty({
    description: 'Nome do remetente',
    example: 'Escola Synexa',
  })
  fromName: string;

  @ApiProperty({
    description: 'Status da configuração',
    example: true,
  })
  isActive: boolean;

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