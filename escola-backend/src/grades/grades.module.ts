/**
 * Grades Module - Módulo de notas
 * Referência: context7 mcp - NestJS Modules Pattern
 */
import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesAngolaService } from './grades-angola.service';
import { GradesController } from './grades.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GradesController],
  providers: [GradesService, GradesAngolaService],
  exports: [GradesService, GradesAngolaService],
})
export class GradesModule {}