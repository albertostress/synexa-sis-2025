import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';

export enum BackupType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  DIFFERENTIAL = 'DIFFERENTIAL',
}

export enum BackupFormat {
  SQL = 'SQL',
  JSON = 'JSON',
  CSV = 'CSV',
}

export class CreateBackupDto {
  @ApiProperty({
    description: 'Nome do backup',
    example: 'backup_2025_01_01',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Tipo de backup',
    example: 'FULL',
    enum: BackupType,
    default: BackupType.FULL,
  })
  @IsEnum(BackupType)
  type: BackupType;

  @ApiProperty({
    description: 'Formato do backup',
    example: 'SQL',
    enum: BackupFormat,
    default: BackupFormat.SQL,
  })
  @IsEnum(BackupFormat)
  format: BackupFormat;

  @ApiProperty({
    description: 'Incluir dados sensíveis (senhas, tokens)',
    example: false,
    default: false,
  })
  @IsBoolean()
  includeSensitiveData: boolean;

  @ApiProperty({
    description: 'Tabelas específicas para backup',
    example: ['students', 'teachers', 'grades'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tables?: string[];

  @ApiProperty({
    description: 'Compactar backup',
    example: true,
    default: true,
  })
  @IsBoolean()
  compress: boolean;
}

export class RestoreBackupDto {
  @ApiProperty({
    description: 'Nome do arquivo de backup',
    example: 'backup_2025_01_01.sql',
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'Confirmar substituição de dados',
    example: true,
  })
  @IsBoolean()
  confirmReplace: boolean;

  @ApiProperty({
    description: 'Tabelas específicas para restaurar',
    example: ['students', 'teachers'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tables?: string[];
}

export class ScheduleBackupDto {
  @ApiProperty({
    description: 'Nome do agendamento',
    example: 'Backup diário',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Expressão cron para agendamento',
    example: '0 2 * * *',
  })
  @IsString()
  cronExpression: string;

  @ApiProperty({
    description: 'Tipo de backup',
    example: 'FULL',
    enum: BackupType,
  })
  @IsEnum(BackupType)
  type: BackupType;

  @ApiProperty({
    description: 'Formato do backup',
    example: 'SQL',
    enum: BackupFormat,
  })
  @IsEnum(BackupFormat)
  format: BackupFormat;

  @ApiProperty({
    description: 'Incluir dados sensíveis',
    example: false,
  })
  @IsBoolean()
  includeSensitiveData: boolean;

  @ApiProperty({
    description: 'Compactar backup',
    example: true,
  })
  @IsBoolean()
  compress: boolean;

  @ApiProperty({
    description: 'Número de backups a manter',
    example: 30,
  })
  @IsOptional()
  retentionDays?: number;

  @ApiProperty({
    description: 'Ativar agendamento',
    example: true,
    default: true,
  })
  @IsBoolean()
  isActive: boolean;
}