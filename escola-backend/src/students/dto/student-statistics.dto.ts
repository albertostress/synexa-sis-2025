import { ApiProperty } from '@nestjs/swagger';

export class StudentStatisticsDto {
  @ApiProperty({ description: 'Total de alunos' })
  total: number;

  @ApiProperty({ 
    description: 'Distribuição por status',
    example: { ATIVO: 150, TRANSFERIDO: 10, DESISTENTE: 5, CONCLUIDO: 20 }
  })
  byStatus: Record<string, number>;

  @ApiProperty({ 
    description: 'Distribuição por género',
    example: { MASCULINO: 95, FEMININO: 90 }
  })
  byGender: Record<string, number>;

  @ApiProperty({ 
    description: 'Distribuição por província',
    example: { Luanda: 100, Benguela: 50, Huambo: 35 }
  })
  byProvince: Record<string, number>;

  @ApiProperty({ 
    description: 'Distribuição por ano letivo',
    example: { '2024': 150, '2023': 35 }
  })
  byAcademicYear: Record<string, number>;

  @ApiProperty({ 
    description: 'Distribuição por turma',
    example: { '10ª A': 30, '10ª B': 28, '11ª A': 32 }
  })
  byClass: Record<string, number>;

  @ApiProperty({ 
    description: 'Média de idade dos alunos',
    example: 15.5
  })
  averageAge: number;

  @ApiProperty({ 
    description: 'Alunos com tags específicas',
    example: { bolsista: 20, monitor: 5, atleta: 15 }
  })
  byTags: Record<string, number>;
}