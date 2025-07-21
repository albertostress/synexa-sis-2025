/**
 * Report Cards PDF Module - Módulo de geração de PDFs para boletins
 * Módulo intermediário para quebrar dependência circular
 */
import { Module } from '@nestjs/common';
import { ReportCardsPdfService } from './report-cards-pdf.service';
import { PdfModule } from '../../documents/pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [ReportCardsPdfService],
  exports: [ReportCardsPdfService],
})
export class ReportCardsPdfModule {}