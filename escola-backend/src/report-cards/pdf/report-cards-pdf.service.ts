/**
 * Report Cards PDF Service - Geração de PDFs para boletins escolares
 * Módulo intermediário para quebrar dependência circular entre Documents e ReportCards
 */
import { Injectable } from '@nestjs/common';
import { ReportCard } from '../entities/report-card.entity';
import { PdfService } from '../../documents/pdf/pdf.service';
import { ReportCardData, getReportCardTemplate } from '../../documents/templates/report-card.template';

@Injectable()
export class ReportCardsPdfService {
  constructor(
    private readonly pdfService: PdfService,
  ) {}

  async generateReportCardPdf(reportCard: ReportCard): Promise<Buffer> {
    const html = getReportCardTemplate(reportCard as ReportCardData);
    // Por enquanto, usar o método generatePdf genérico
    // TODO: Implementar método generatePdfFromHtml no PdfService
    return this.pdfService.generatePdf('report-card', reportCard as any);
  }
}