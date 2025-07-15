/**
 * PDF Module - Módulo para geração de PDFs com Playwright
 * Referência: context7 mcp - NestJS Modules Pattern
 */
import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Module({
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly pdfService: PdfService) {}

  async onModuleInit(): Promise<void> {
    await this.pdfService.onModuleInit();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pdfService.onModuleDestroy();
  }
}