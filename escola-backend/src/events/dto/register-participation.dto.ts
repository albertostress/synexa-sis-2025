import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsBoolean, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterParticipationDto {
  @ApiProperty({
    description: 'ID do aluno a registrar no evento',
    example: 'uuid-do-aluno',
  })
  @IsString({ message: 'ID do aluno deve ser uma string' })
  @IsNotEmpty({ message: 'ID do aluno é obrigatório' })
  @IsUUID('4', { message: 'ID do aluno deve ser um UUID válido' })
  studentId: string;

  @ApiProperty({
    description: 'Observações sobre a participação',
    example: 'Aluno irá participar da apresentação de dança',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  note?: string;
}

export class RegisterMultipleParticipationsDto {
  @ApiProperty({
    description: 'Lista de alunos a registrar no evento',
    type: [RegisterParticipationDto],
  })
  @IsArray({ message: 'Deve ser um array de participações' })
  @ArrayMinSize(1, { message: 'Deve ter pelo menos uma participação' })
  @ValidateNested({ each: true })
  @Type(() => RegisterParticipationDto)
  participations: RegisterParticipationDto[];
}

export class RegisterClassParticipationDto {
  @ApiProperty({
    description: 'ID da turma a registrar no evento',
    example: 'uuid-da-turma',
  })
  @IsString({ message: 'ID da turma deve ser uma string' })
  @IsNotEmpty({ message: 'ID da turma é obrigatório' })
  @IsUUID('4', { message: 'ID da turma deve ser um UUID válido' })
  classId: string;

  @ApiProperty({
    description: 'Observação geral para todos os alunos da turma',
    example: 'Turma responsável pela apresentação de abertura',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observação deve ser uma string' })
  note?: string;
}

export class UpdateParticipationDto {
  @ApiProperty({
    description: 'Status de presença do aluno',
    example: true,
  })
  @IsBoolean({ message: 'Presença deve ser um booleano' })
  @IsNotEmpty({ message: 'Status de presença é obrigatório' })
  presence: boolean;

  @ApiProperty({
    description: 'Observações sobre a participação',
    example: 'Aluno participou ativamente das atividades',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  note?: string;
}

export class BatchUpdatePresenceDto {
  @ApiProperty({
    description: 'Lista de IDs de participação e seus status de presença',
    example: [
      { participationId: 'uuid-1', presence: true },
      { participationId: 'uuid-2', presence: false },
    ],
  })
  @IsArray({ message: 'Deve ser um array de atualizações' })
  @ArrayMinSize(1, { message: 'Deve ter pelo menos uma atualização' })
  updates: {
    participationId: string;
    presence: boolean;
    note?: string;
  }[];
}