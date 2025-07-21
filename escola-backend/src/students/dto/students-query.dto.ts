import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentsQueryDto {
  @ApiProperty({ 
    description: 'Número da página',
    example: 1,
    required: false,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Quantidade de itens por página',
    example: 20,
    required: false,
    default: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Busca por nome, apelido ou número do aluno',
    example: 'João',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Filtrar por ano acadêmico',
    example: '2024',
    required: false
  })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiProperty({ 
    description: 'Filtrar por ID da turma',
    example: 'uuid-da-turma',
    required: false
  })
  @IsOptional()
  @IsUUID('4')
  classId?: string;

  @ApiProperty({ 
    description: 'Filtrar por província',
    example: 'Luanda',
    required: false
  })
  @IsOptional()
  @IsString()
  province?: string;
}

export class PaginatedStudentsResponseDto {
  @ApiProperty({ description: 'Lista de alunos' })
  students: any[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Limite por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ description: 'Tem próxima página' })
  hasNext: boolean;

  @ApiProperty({ description: 'Tem página anterior' })
  hasPrevious: boolean;
}