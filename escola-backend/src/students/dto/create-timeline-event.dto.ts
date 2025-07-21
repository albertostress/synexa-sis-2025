import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { TimelineEventType } from '@prisma/client';

export class CreateTimelineEventDto {
  @ApiProperty({ 
    description: 'Tipo de evento',
    enum: TimelineEventType,
    example: TimelineEventType.MATRICULA
  })
  @IsEnum(TimelineEventType)
  @IsNotEmpty({ message: 'Tipo de evento é obrigatório' })
  eventType: TimelineEventType;

  @ApiProperty({ 
    description: 'Título do evento',
    example: 'Matrícula realizada'
  })
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  title: string;

  @ApiProperty({ 
    description: 'Descrição detalhada do evento',
    example: 'Aluno matriculado na turma 10ª A para o ano letivo 2024'
  })
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({ 
    description: 'Metadados adicionais do evento',
    example: { classId: 'uuid-turma', previousClass: '9ª B' },
    required: false
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}