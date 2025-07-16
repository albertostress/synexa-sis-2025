import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';

export enum SettingType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

export class CreateSettingDto {
  @ApiProperty({
    description: 'Chave da configuração',
    example: 'school_name',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @ApiProperty({
    description: 'Valor da configuração',
    example: 'Escola Primária Synexa',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    description: 'Descrição da configuração',
    example: 'Nome oficial da escola',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tipo de configuração',
    example: 'STRING',
    enum: SettingType,
    default: SettingType.STRING,
  })
  @IsEnum(SettingType)
  type: SettingType;

  @ApiProperty({
    description: 'Indica se a configuração é pública',
    example: true,
    default: true,
  })
  @IsBoolean()
  isPublic: boolean;
}

export class UpdateSettingDto {
  @ApiProperty({
    description: 'Valor da configuração',
    example: 'Escola Primária Synexa',
    required: false,
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({
    description: 'Descrição da configuração',
    example: 'Nome oficial da escola',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tipo de configuração',
    example: 'STRING',
    enum: SettingType,
    required: false,
  })
  @IsOptional()
  @IsEnum(SettingType)
  type?: SettingType;

  @ApiProperty({
    description: 'Indica se a configuração é pública',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class FilterSettingsDto {
  @ApiProperty({
    description: 'Buscar por chave',
    example: 'school',
    required: false,
  })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({
    description: 'Filtrar por tipo',
    example: 'STRING',
    enum: SettingType,
    required: false,
  })
  @IsOptional()
  @IsEnum(SettingType)
  type?: SettingType;

  @ApiProperty({
    description: 'Filtrar por configurações públicas',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}