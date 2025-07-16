import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTeacherDto {
  @ApiPropertyOptional({
    description: 'Biografia do professor',
    example: 'Professor de Matemática especializado em álgebra, com mestrado em Educação Matemática',
  })
  @IsOptional()
  @IsString({ message: 'Biografia deve ser uma string' })
  biography?: string;

  @ApiPropertyOptional({
    description: 'Qualificação do professor',
    example: 'Licenciatura em Matemática',
  })
  @IsOptional()
  @IsString({ message: 'Qualificação deve ser uma string' })
  qualification?: string;

  @ApiPropertyOptional({
    description: 'Especialização do professor',
    example: 'Matemática Aplicada',
  })
  @IsOptional()
  @IsString({ message: 'Especialização deve ser uma string' })
  specialization?: string;

  @ApiPropertyOptional({
    description: 'Anos de experiência do professor',
    example: 5,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'Experiência deve ser um número inteiro' })
  @Min(0, { message: 'Experiência deve ser no mínimo 0 anos' })
  @Max(50, { message: 'Experiência deve ser no máximo 50 anos' })
  experience?: number;
}
