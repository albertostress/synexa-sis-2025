import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsUrl, IsEnum, IsArray, IsObject, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export enum WebhookMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum WebhookEvent {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  ENROLLMENT_CREATED = 'ENROLLMENT_CREATED',
  GRADE_ADDED = 'GRADE_ADDED',
  ATTENDANCE_MARKED = 'ATTENDANCE_MARKED',
  STUDENT_CREATED = 'STUDENT_CREATED',
  TEACHER_CREATED = 'TEACHER_CREATED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  DOCUMENT_GENERATED = 'DOCUMENT_GENERATED',
  USER_CREATED = 'USER_CREATED',
}

export class CreateWebhookDto {
  @ApiProperty({
    description: 'Nome do webhook',
    example: 'Webhook de Pagamentos',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'URL do webhook',
    example: 'https://api.exemplo.com/webhook',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Método HTTP',
    example: 'POST',
    enum: WebhookMethod,
    default: WebhookMethod.POST,
  })
  @IsEnum(WebhookMethod)
  method: WebhookMethod;

  @ApiProperty({
    description: 'Eventos que disparam o webhook',
    example: ['PAYMENT_RECEIVED', 'ENROLLMENT_CREATED'],
    enum: WebhookEvent,
    isArray: true,
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiProperty({
    description: 'Cabeçalhos HTTP personalizados',
    example: { 'Authorization': 'Bearer token123' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({
    description: 'Chave secreta para verificação',
    example: 'secret_key_123',
    required: false,
  })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiProperty({
    description: 'Status do webhook',
    example: true,
    default: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Número de tentativas em caso de falha',
    example: 3,
    minimum: 1,
    maximum: 10,
    default: 3,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  retryAttempts: number;
}

export class UpdateWebhookDto {
  @ApiProperty({
    description: 'Nome do webhook',
    example: 'Webhook de Pagamentos',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'URL do webhook',
    example: 'https://api.exemplo.com/webhook',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({
    description: 'Método HTTP',
    example: 'POST',
    enum: WebhookMethod,
    required: false,
  })
  @IsOptional()
  @IsEnum(WebhookMethod)
  method?: WebhookMethod;

  @ApiProperty({
    description: 'Eventos que disparam o webhook',
    example: ['PAYMENT_RECEIVED', 'ENROLLMENT_CREATED'],
    enum: WebhookEvent,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events?: WebhookEvent[];

  @ApiProperty({
    description: 'Cabeçalhos HTTP personalizados',
    example: { 'Authorization': 'Bearer token123' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiProperty({
    description: 'Chave secreta para verificação',
    example: 'secret_key_123',
    required: false,
  })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiProperty({
    description: 'Status do webhook',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Número de tentativas em caso de falha',
    example: 3,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  retryAttempts?: number;
}

export class FilterWebhooksDto {
  @ApiProperty({
    description: 'Filtrar por nome',
    example: 'Pagamentos',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filtrar por método HTTP',
    example: 'POST',
    enum: WebhookMethod,
    required: false,
  })
  @IsOptional()
  @IsEnum(WebhookMethod)
  method?: WebhookMethod;

  @ApiProperty({
    description: 'Filtrar por evento',
    example: 'PAYMENT_RECEIVED',
    enum: WebhookEvent,
    required: false,
  })
  @IsOptional()
  @IsEnum(WebhookEvent)
  event?: WebhookEvent;

  @ApiProperty({
    description: 'Filtrar por status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TestWebhookDto {
  @ApiProperty({
    description: 'Dados de teste para enviar',
    example: { message: 'Teste de webhook', timestamp: new Date() },
    required: false,
  })
  @IsOptional()
  @IsObject()
  testData?: Record<string, any>;
}