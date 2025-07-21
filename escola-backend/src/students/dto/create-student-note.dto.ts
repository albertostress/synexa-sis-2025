import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, MinLength } from 'class-validator';
import { NoteType } from '@prisma/client';

export class CreateStudentNoteDto {
  @ApiProperty({ 
    description: 'Conteúdo da anotação',
    example: 'Aluno demonstrou excelente participação nas atividades de grupo.'
  })
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo da anotação é obrigatório' })
  @MinLength(10, { message: 'Anotação deve ter no mínimo 10 caracteres' })
  content: string;

  @ApiProperty({ 
    description: 'Tipo de anotação',
    enum: NoteType,
    example: NoteType.OBSERVACAO
  })
  @IsEnum(NoteType, { message: 'Tipo deve ser: OBSERVACAO, ELOGIO ou ADVERTENCIA' })
  @IsNotEmpty({ message: 'Tipo de anotação é obrigatório' })
  type: NoteType;
}