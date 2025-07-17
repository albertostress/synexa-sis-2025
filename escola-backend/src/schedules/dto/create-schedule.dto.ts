import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, Matches, IsEnum } from 'class-validator';

export enum Weekday {
  SEGUNDA = 'SEGUNDA',
  TERCA = 'TERCA',
  QUARTA = 'QUARTA',
  QUINTA = 'QUINTA',
  SEXTA = 'SEXTA',
  SABADO = 'SABADO',
}

export class CreateScheduleDto {
  @ApiProperty({
    description: 'ID do professor',
    example: 'teacher-uuid-id',
  })
  @IsNotEmpty({ message: 'ID do professor é obrigatório' })
  @IsUUID('4', { message: 'ID do professor deve ser um UUID válido' })
  teacherId: string;

  @ApiProperty({
    description: 'Dia da semana',
    enum: Weekday,
    example: 'SEGUNDA',
  })
  @IsNotEmpty({ message: 'Dia da semana é obrigatório' })
  @IsEnum(Weekday, { message: 'Dia da semana deve ser um dos valores: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO' })
  weekday: Weekday;

  @ApiProperty({
    description: 'Horário de início (formato HH:mm)',
    example: '08:00',
  })
  @IsNotEmpty({ message: 'Horário de início é obrigatório' })
  @IsString({ message: 'Horário de início deve ser uma string' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Horário de início deve estar no formato HH:mm (exemplo: 08:30)' 
  })
  startTime: string;

  @ApiProperty({
    description: 'Horário de fim (formato HH:mm)',
    example: '09:30',
  })
  @IsNotEmpty({ message: 'Horário de fim é obrigatório' })
  @IsString({ message: 'Horário de fim deve ser uma string' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Horário de fim deve estar no formato HH:mm (exemplo: 09:30)' 
  })
  endTime: string;

  @ApiProperty({
    description: 'ID da disciplina',
    example: 'subject-uuid-id',
  })
  @IsNotEmpty({ message: 'ID da disciplina é obrigatório' })
  @IsUUID('4', { message: 'ID da disciplina deve ser um UUID válido' })
  subjectId: string;
}