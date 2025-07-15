/**
 * Update Class DTO - Validação para atualização de turma
 * Referência: context7 mcp - DTO Pattern
 */
import { PartialType } from '@nestjs/swagger';
import { CreateClassDto } from './create-class.dto';

export class UpdateClassDto extends PartialType(CreateClassDto) {}