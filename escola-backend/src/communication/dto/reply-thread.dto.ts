/**
 * ReplyThreadDto - DTO para envio de resposta em conversa existente
 * Referência: context7 mcp - NestJS DTOs Pattern
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ReplyThreadDto {
  @ApiProperty({
    description: 'Conteúdo da mensagem de resposta',
    example: 'Perfeito! Podemos nos reunir na quarta-feira às 14h na sala da coordenação.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'O conteúdo da mensagem não pode estar vazio' })
  content: string;
}