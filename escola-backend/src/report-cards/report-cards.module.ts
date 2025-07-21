/**
 * Report Cards Module - Módulo de boletins escolares
 * Referência: context7 mcp - NestJS Modules Pattern
 */
import { Module } from '@nestjs/common';
import { ReportCardsService } from './report-cards.service';
import { ReportCardsController } from './report-cards.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportCardsPdfModule } from './pdf/report-cards-pdf.module';

@Module({
  imports: [PrismaModule, ReportCardsPdfModule],
  controllers: [ReportCardsController],
  providers: [ReportCardsService],
  exports: [ReportCardsService],
})
export class ReportCardsModule {}