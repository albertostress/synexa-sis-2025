import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

export class AssignStudentDto {
  @ApiProperty({
    description: 'ID do aluno a ser atribuído à rota',
    example: 'uuid-do-aluno',
  })
  @IsString({ message: 'ID do aluno deve ser uma string' })
  @IsNotEmpty({ message: 'ID do aluno é obrigatório' })
  @IsUUID('4', { message: 'ID do aluno deve ser um UUID válido' })
  studentId: string;

  @ApiProperty({
    description: 'Nome da paragem onde o aluno embarca/desembarca',
    example: 'Praça Central',
  })
  @IsString({ message: 'Nome da paragem deve ser uma string' })
  @IsNotEmpty({ message: 'Nome da paragem é obrigatório' })
  stopName: string;

  @ApiProperty({
    description: 'Notas adicionais sobre o transporte do aluno',
    example: 'Aluno tem dificuldades de locomoção',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notas devem ser uma string' })
  notes?: string;
}

export class AssignMultipleStudentsDto {
  @ApiProperty({
    description: 'Lista de alunos a serem atribuídos à rota',
    type: [AssignStudentDto],
  })
  @IsArray({ message: 'Deve ser um array de alunos' })
  @ArrayMinSize(1, { message: 'Deve ter pelo menos um aluno' })
  students: AssignStudentDto[];
}

export class UpdateStudentTransportDto {
  @ApiProperty({
    description: 'Nome da paragem onde o aluno embarca/desembarca',
    example: 'Praça Central',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome da paragem deve ser uma string' })
  @IsNotEmpty({ message: 'Nome da paragem não pode estar vazio' })
  stopName?: string;

  @ApiProperty({
    description: 'Notas adicionais sobre o transporte do aluno',
    example: 'Aluno tem dificuldades de locomoção',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notas devem ser uma string' })
  notes?: string;
}