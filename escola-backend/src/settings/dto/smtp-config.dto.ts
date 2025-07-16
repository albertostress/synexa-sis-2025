import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsEmail, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateSmtpConfigDto {
  @ApiProperty({
    description: 'Servidor SMTP',
    example: 'smtp.gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({
    description: 'Porta do servidor SMTP',
    example: 587,
    minimum: 1,
    maximum: 65535,
  })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({
    description: 'Usar SSL/TLS',
    example: true,
  })
  @IsBoolean()
  secure: boolean;

  @ApiProperty({
    description: 'Email do remetente',
    example: 'noreply@escola.com',
  })
  @IsEmail()
  @IsNotEmpty()
  user: string;

  @ApiProperty({
    description: 'Senha do email',
    example: 'senha123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Nome do remetente',
    example: 'Escola Synexa',
  })
  @IsString()
  @IsNotEmpty()
  fromName: string;

  @ApiProperty({
    description: 'Status da configuração',
    example: true,
    default: true,
  })
  @IsBoolean()
  isActive: boolean;
}

export class UpdateSmtpConfigDto {
  @ApiProperty({
    description: 'Servidor SMTP',
    example: 'smtp.gmail.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiProperty({
    description: 'Porta do servidor SMTP',
    example: 587,
    minimum: 1,
    maximum: 65535,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiProperty({
    description: 'Usar SSL/TLS',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  secure?: boolean;

  @ApiProperty({
    description: 'Email do remetente',
    example: 'noreply@escola.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  user?: string;

  @ApiProperty({
    description: 'Senha do email',
    example: 'senha123',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    description: 'Nome do remetente',
    example: 'Escola Synexa',
    required: false,
  })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiProperty({
    description: 'Status da configuração',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TestSmtpDto {
  @ApiProperty({
    description: 'Email de destino para teste',
    example: 'admin@escola.com',
  })
  @IsEmail()
  @IsNotEmpty()
  toEmail: string;

  @ApiProperty({
    description: 'Assunto do email de teste',
    example: 'Teste de configuração SMTP',
    required: false,
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: 'Corpo do email de teste',
    example: 'Este é um email de teste para verificar a configuração SMTP.',
    required: false,
  })
  @IsOptional()
  @IsString()
  body?: string;
}