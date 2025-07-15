import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTeacherDto {
  @ApiPropertyOptional({
    description: 'Biografia do professor',
    example: 'Professor de Matemática especializado em álgebra, com mestrado em Educação Matemática',
  })
  @IsOptional()
  @IsString({ message: 'Biografia deve ser uma string' })
  bio?: string;
}