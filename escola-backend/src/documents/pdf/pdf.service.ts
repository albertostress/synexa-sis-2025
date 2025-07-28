/**
 * PDF Service - Geração de PDFs usando Playwright e Handlebars
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { chromium, Browser, Page } from 'playwright';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PdfCacheService } from './pdf-cache.service';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private browser: Browser | null = null;

  constructor(private readonly cacheService: PdfCacheService) {}

  async onModuleInit(): Promise<void> {
    try {
      // Registrar helpers do Handlebars
      this.registerHandlebarsHelpers();

      this.browser = await chromium.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser', // Usar Chromium do Alpine
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--hide-scrollbars',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
        ],
      });
      this.logger.log('Playwright Chromium iniciado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar Playwright Chromium:', error);
      this.logger.warn('PdfService funcionará em modo simulado (sem geração real de PDF)');
      // Não fazer throw para não quebrar a aplicação durante desenvolvimento
    }
  }

  private registerHandlebarsHelpers(): void {
    // Helper para comparação de igualdade
    Handlebars.registerHelper('eq', function(a: any, b: any): boolean {
      return a === b;
    });

    // Helper para formatação de data
    Handlebars.registerHelper('formatDate', function(date: string): string {
      return new Date(date).toLocaleDateString('pt-BR');
    });

    // Helper para formatação de nota
    Handlebars.registerHelper('formatGrade', function(grade: number): string {
      return grade.toFixed(1).replace('.', ',');
    });

    this.logger.log('Handlebars helpers registrados');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Playwright Chromium finalizado');
    }
  }

  async generatePdf(templateName: string, data: Record<string, any>): Promise<Buffer> {
    // Verificar cache primeiro
    const cacheKey = { templateName, data };
    const cachedPdf = this.cacheService.get('pdf', cacheKey);
    if (cachedPdf) {
      this.logger.debug(`PDF recuperado do cache: ${templateName}`);
      return cachedPdf;
    }

    if (!this.browser) {
      this.logger.warn(`Modo simulado: gerando PDF mock para template '${templateName}'`);
      const mockPdf = await this.generateMockPdf(templateName, data);
      // Armazenar mock no cache também
      this.cacheService.set('pdf', cacheKey, mockPdf);
      return mockPdf;
    }

    let page: Page | null = null;

    try {
      // Carregar template Handlebars
      const templatePath = path.join(process.cwd(), 'src', 'documents', 'pdf', 'templates', `${templateName}.hbs`);
      
      let templateContent: string;
      try {
        templateContent = await fs.readFile(templatePath, 'utf-8');
      } catch (error) {
        throw new BadRequestException(`Template '${templateName}' não encontrado`);
      }

      // Compilar template com dados
      const template = Handlebars.compile(templateContent);
      const html = template(data);

      // Criar nova página no browser
      page = await this.browser.newPage();

      // Configurar viewport para PDF
      await page.setViewportSize({ width: 1024, height: 1448 }); // A4 proporção

      // Carregar HTML na página
      await page.setContent(html, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Gerar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      });

      const resultBuffer = Buffer.from(pdfBuffer);
      
      // Armazenar no cache
      this.cacheService.set('pdf', cacheKey, resultBuffer);
      
      this.logger.log(`PDF gerado com sucesso para template: ${templateName}`);
      return resultBuffer;

    } catch (error) {
      this.logger.error(`Erro ao gerar PDF para template '${templateName}':`, error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async generateCertificatePdf(data: Record<string, any>): Promise<Buffer> {
    return this.generatePdf('certificate', data);
  }

  async generateDeclarationPdf(data: Record<string, any>): Promise<Buffer> {
    return this.generatePdf('declaration', data);
  }

  async generateTranscriptPdf(data: Record<string, any>): Promise<Buffer> {
    return this.generatePdf('transcript', data);
  }

  async generateInvoicePdf(data: Record<string, any>): Promise<Buffer> {
    // Usar o template de fatura do módulo finance
    const templatePath = path.join(process.cwd(), 'src', 'finance', 'templates', 'invoice.hbs');
    
    let templateContent: string;
    try {
      templateContent = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      throw new BadRequestException(`Template 'invoice' não encontrado em finance/templates`);
    }

    // Verificar cache primeiro
    const cacheKey = { templateName: 'invoice', data };
    const cachedPdf = this.cacheService.get('pdf', cacheKey);
    if (cachedPdf) {
      this.logger.debug(`PDF de fatura recuperado do cache`);
      return cachedPdf;
    }

    if (!this.browser) {
      this.logger.warn(`Modo simulado: gerando PDF mock para fatura`);
      const mockPdf = await this.generateMockPdf('invoice', data);
      this.cacheService.set('pdf', cacheKey, mockPdf);
      return mockPdf;
    }

    let page: Page | null = null;

    try {
      // Compilar template com dados
      const template = Handlebars.compile(templateContent);
      const html = template(data);

      // Criar nova página no browser
      page = await this.browser.newPage();

      // Configurar viewport para PDF
      await page.setViewportSize({ width: 1024, height: 1448 }); // A4 proporção

      // Carregar HTML na página
      await page.setContent(html, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Gerar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1.5cm',
          right: '1.5cm',
          bottom: '1.5cm',
          left: '1.5cm',
        },
      });

      const resultBuffer = Buffer.from(pdfBuffer);
      
      // Armazenar no cache
      this.cacheService.set('pdf', cacheKey, resultBuffer);
      
      this.logger.log(`PDF de fatura gerado com sucesso`);
      return resultBuffer;

    } catch (error) {
      this.logger.error(`Erro ao gerar PDF de fatura:`, error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Gera um PDF mock para desenvolvimento quando Chromium não está disponível
   */
  private async generateMockPdf(templateName: string, data: Record<string, any>): Promise<Buffer> {
    const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length 89
>>
stream
BT
/F1 12 Tf
72 720 Td
(MOCK PDF - Template: ${templateName}) Tj
0 -20 Td
(Student: ${JSON.stringify(data).substring(0, 50)}...) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000281 00000 n 
0000000354 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
493
%%EOF`;

    return Buffer.from(mockPdfContent, 'utf-8');
  }

  /**
   * Gera PDF a partir de HTML já renderizado
   */
  async generatePdfFromHtml(html: string, cacheKey?: any): Promise<Buffer> {
    // Verificar cache se fornecido
    if (cacheKey) {
      const cachedPdf = this.cacheService.get('pdf', cacheKey);
      if (cachedPdf) {
        this.logger.debug(`PDF recuperado do cache para HTML`);
        return cachedPdf;
      }
    }

    if (!this.browser) {
      this.logger.warn(`Modo simulado: gerando PDF mock para HTML`);
      const mockPdf = await this.generateMockPdf('html-template', { html: html.substring(0, 100) });
      // Armazenar mock no cache se fornecido
      if (cacheKey) {
        this.cacheService.set('pdf', cacheKey, mockPdf);
      }
      return mockPdf;
    }

    let page: Page | null = null;

    try {
      // Criar nova página no browser
      page = await this.browser.newPage();

      // Configurar viewport para PDF
      await page.setViewportSize({ width: 1024, height: 1448 }); // A4 proporção

      // Carregar HTML na página
      await page.setContent(html, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Aguardar carregamento de recursos (fontes, imagens)
      await page.waitForTimeout(1000);

      // Gerar PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '15mm',
          right: '20mm',
          bottom: '15mm',
          left: '20mm',
        },
        preferCSSPageSize: true,
      });

      const resultBuffer = Buffer.from(pdfBuffer);
      
      // Armazenar no cache se fornecido
      if (cacheKey) {
        this.cacheService.set('pdf', cacheKey, resultBuffer);
      }
      
      this.logger.log(`PDF gerado com sucesso a partir de HTML`);
      return resultBuffer;

    } catch (error) {
      this.logger.error(`Erro ao gerar PDF a partir de HTML:`, error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Verifica se o serviço está funcionando corretamente
   */
  async healthCheck(): Promise<{ 
    status: string; 
    browser: boolean; 
    mode: string;
    cache: any;
  }> {
    return {
      status: 'ok',
      browser: this.browser !== null,
      mode: this.browser ? 'production' : 'mock',
      cache: this.cacheService.getStats(),
    };
  }

  /**
   * Limpa o cache de PDFs
   */
  clearCache(): void {
    this.cacheService.clear();
  }

  /**
   * Verifica se um PDF está no cache
   */
  hasCachedPdf(templateName: string, data: Record<string, any>): boolean {
    return this.cacheService.has('pdf', { templateName, data });
  }
}