import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
  bio?: string;
}