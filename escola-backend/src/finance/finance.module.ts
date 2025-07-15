/**
 * Finance Module - Módulo de gestão financeira escolar
 * Referência: context7 mcp - NestJS Modules Pattern
 */
import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfModule } from '../documents/pdf/pdf.module';

@Module({
  imports: [PrismaModule, PdfModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}