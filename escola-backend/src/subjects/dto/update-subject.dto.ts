/**
 * Update Subject DTO - Validação para atualização de disciplina
 * Referência: context7 mcp - DTO Pattern
 */
import { PartialType } from '@nestjs/swagger';
import { CreateSubjectDto } from './create-subject.dto';

export class UpdateSubjectDto extends PartialType(CreateSubjectDto) {}