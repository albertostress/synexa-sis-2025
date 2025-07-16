import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class TransportStopDto {
  @ApiProperty({
    description: 'Nome da paragem',
    example: 'Praça Central',
  })
  @IsString({ message: 'Nome da paragem deve ser uma string' })
  @IsNotEmpty({ message: 'Nome da paragem é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'Ordem da paragem na rota (1, 2, 3...)',
    example: 1,
  })
  @IsNumber({}, { message: 'Ordem deve ser um número' })
  @Min(1, { message: 'Ordem deve ser no mínimo 1' })
  @Max(50, { message: 'Ordem não pode ser maior que 50' })
  order: number;
}

export class CreateRouteDto {
  @ApiProperty({
    description: 'Nome da rota de transporte',
    example: 'Rota Centro - Escola',
  })
  @IsString({ message: 'Nome da rota deve ser uma string' })
  @IsNotEmpty({ message: 'Nome da rota é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'Nome do motorista responsável pela rota',
    example: 'João Silva',
  })
  @IsString({ message: 'Nome do motorista deve ser uma string' })
  @IsNotEmpty({ message: 'Nome do motorista é obrigatório' })
  driverName: string;

  @ApiProperty({
    description: 'Identificação do veículo (placa ou nome)',
    example: 'ABC-1234',
  })
  @IsString({ message: 'Identificação do veículo deve ser uma string' })
  @IsNotEmpty({ message: 'Identificação do veículo é obrigatória' })
  vehicle: string;

  @ApiProperty({
    description: 'Horário de saída (formato HH:mm)',
    example: '07:00',
  })
  @IsString({ message: 'Horário de saída deve ser uma string' })
  @IsNotEmpty({ message: 'Horário de saída é obrigatório' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário de saída deve estar no formato HH:mm (ex: 07:00)',
  })
  departure: string;

  @ApiProperty({
    description: 'Horário de retorno (formato HH:mm)',
    example: '17:30',
  })
  @IsString({ message: 'Horário de retorno deve ser uma string' })
  @IsNotEmpty({ message: 'Horário de retorno é obrigatório' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário de retorno deve estar no formato HH:mm (ex: 17:30)',
  })
  returnTime: string;

  @ApiProperty({
    description: 'Lista ordenada de paragens da rota',
    example: [
      { name: 'Praça Central', order: 1 },
      { name: 'Mercado Municipal', order: 2 },
      { name: 'Bairro Novo', order: 3 },
    ],
    type: [TransportStopDto],
  })
  @IsArray({ message: 'Paragens devem ser um array' })
  @ValidateNested({ each: true })
  @Type(() => TransportStopDto)
  stops: TransportStopDto[];
}