/**
 * CreateThreadDto - DTO para criação de nova conversa/thread
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({
    description: 'Assunto da conversa (opcional)',
    example: 'Reunião sobre desempenho do aluno João',
    required: false,
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: 'Conteúdo da primeira mensagem da conversa',
    example: 'Gostaria de agendar uma reunião para discutir o desempenho do aluno João Silva...',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Lista de IDs dos participantes da conversa',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'Pelo menos um participante deve ser especificado' })
  participantIds: string[];
}