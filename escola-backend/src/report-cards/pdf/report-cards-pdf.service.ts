/**
 * Report Cards PDF Service - Geração de PDFs para boletins escolares
 * Módulo intermediário para quebrar dependência circular entre Documents e ReportCards
 */
import { Injectable } from '@nestjs/common';
import { ReportCard } from '../entities/report-card.entity';
import { AngolaReportCard } from '../entities/angola-report-card.entity';
import { PdfService } from '../../documents/pdf/pdf.service';
import { ReportCardData, getReportCardTemplate, getAngolaReportCardTemplate } from '../../documents/templates/report-card.template';

@Injectable()
export class ReportCardsPdfService {
  constructor(
    private readonly pdfService: PdfService,
  ) {}

  async generateReportCardPdf(reportCard: ReportCard | AngolaReportCard): Promise<Buffer> {
    let html: string;
    let cacheKey: any;
    
    // Verificar se é um boletim angolano ou padrão
    if (this.isAngolaReportCard(reportCard)) {
      html = getAngolaReportCardTemplate(reportCard);
      cacheKey = {
        studentId: reportCard.student.name, // AngolaReportCard não tem student.id, usar name
        year: reportCard.year,
        term: reportCard.term,
        type: 'angola-report-card'
      };
    } else {
      html = getReportCardTemplate(reportCard as ReportCardData);
      cacheKey = {
        studentId: reportCard.student.id,
        year: reportCard.year,
        term: reportCard.term,
        type: 'report-card'
      };
    }
    
    // Usar o novo método generatePdfFromHtml
    return this.pdfService.generatePdfFromHtml(html, cacheKey);
  }

  private isAngolaReportCard(reportCard: ReportCard | AngolaReportCard): reportCard is AngolaReportCard {
    // Verificar se tem as propriedades específicas do AngolaReportCard
    return 'subjects' in reportCard && 
           Array.isArray((reportCard as any).subjects) &&
           (reportCard as any).subjects.length > 0 &&
           'mac' in (reportCard as any).subjects[0];
  }
}