import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTeacherDto {
  @ApiProperty({
    description: 'ID do usuário que será associado como professor',
    example: 'user-uuid-id',
  })
  @IsNotEmpty({ message: 'ID do usuário é obrigatório' })
  @IsUUID('4', { message: 'ID do usuário deve ser um UUID válido' })
  userId: string;

  @ApiProperty({
    description: 'Biografia do professor',
    example: 'Professor de Matemática com 10 anos de experiência em ensino fundamental e médio',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Biografia deve ser uma string' })
  biography?: string;

  @ApiProperty({
    description: 'Qualificação do professor',
    example: 'Licenciatura em Matemática',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Qualificação deve ser uma string' })
  qualification?: string;

  @ApiProperty({
    description: 'Especialização do professor',
    example: 'Matemática Aplicada',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Especialização deve ser uma string' })
  specialization?: string;

  @ApiProperty({
    description: 'Anos de experiência do professor',
    example: 5,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Experiência deve ser um número inteiro' })
  @Min(0, { message: 'Experiência deve ser no mínimo 0 anos' })
  @Max(50, { message: 'Experiência deve ser no máximo 50 anos' })
  experience?: number;
}
