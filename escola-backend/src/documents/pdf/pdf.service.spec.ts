/**
 * PDF Service Tests - Testes para o serviço de geração de PDFs
 * Referência: context7 mcp - NestJS Testing Pattern
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  afterEach(async () => {
    // Limpar recursos após cada teste
    await service.onModuleDestroy();
  });

  describe('onModuleInit', () => {
    it('should initialize successfully', async () => {
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      await service.onModuleInit();
      const health = await service.healthCheck();
      
      expect(health).toHaveProperty('status', 'ok');
      expect(health).toHaveProperty('browser');
      expect(typeof health.browser).toBe('boolean');
    });
  });

  describe('generatePdf', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should throw error for non-existent template', async () => {
      const data = { test: 'data' };
      
      await expect(
        service.generatePdf('non-existent-template', data)
      ).rejects.toThrow("Template 'non-existent-template' não encontrado");
    });

    it('should generate PDF with mock template', async () => {
      // Criar template de teste temporário
      const testTemplatePath = path.join(
        process.cwd(),
        'src',
        'documents',
        'pdf',
        'templates',
        'test.hbs'
      );

      const mockTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Document</title>
          <style>body { font-family: Arial; }</style>
        </head>
        <body>
          <h1>{{title}}</h1>
          <p>{{content}}</p>
        </body>
        </html>
      `;

      // Escrever template temporário
      await fs.writeFile(testTemplatePath, mockTemplate, 'utf-8');

      try {
        const testData = {
          title: 'Documento de Teste',
          content: 'Este é um teste do serviço de PDF',
        };

        const pdfBuffer = await service.generatePdf('test', testData);

        // Verificar se o PDF foi gerado
        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(0);
        
        // Verificar se é um PDF válido (começa com %PDF)
        const pdfHeader = pdfBuffer.subarray(0, 4).toString();
        expect(pdfHeader).toBe('%PDF');

      } finally {
        // Limpar template temporário
        try {
          await fs.unlink(testTemplatePath);
        } catch (error) {
          // Ignorar erro se arquivo não existir
        }
      }
    });
  });

  describe('generateCertificatePdf', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should call generatePdf with certificate template', async () => {
      const mockData = {
        studentName: 'João Silva',
        institutionName: 'Escola Teste',
        year: 2024,
      };

      // Verificar se template existe antes do teste
      const templatePath = path.join(
        process.cwd(),
        'src',
        'documents',
        'pdf',
        'templates',
        'certificate.hbs'
      );

      const templateExists = await fs.access(templatePath)
        .then(() => true)
        .catch(() => false);

      if (templateExists) {
        const pdfBuffer = await service.generateCertificatePdf(mockData);
        expect(pdfBuffer).toBeInstanceOf(Buffer);
      } else {
        await expect(
          service.generateCertificatePdf(mockData)
        ).rejects.toThrow("Template 'certificate' não encontrado");
      }
    });
  });

  describe('generateDeclarationPdf', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should call generatePdf with declaration template', async () => {
      const mockData = {
        studentName: 'Maria Silva',
        institutionName: 'Escola Teste',
        year: 2024,
      };

      // Verificar se template existe antes do teste
      const templatePath = path.join(
        process.cwd(),
        'src',
        'documents',
        'pdf',
        'templates',
        'declaration.hbs'
      );

      const templateExists = await fs.access(templatePath)
        .then(() => true)
        .catch(() => false);

      if (templateExists) {
        const pdfBuffer = await service.generateDeclarationPdf(mockData);
        expect(pdfBuffer).toBeInstanceOf(Buffer);
      } else {
        await expect(
          service.generateDeclarationPdf(mockData)
        ).rejects.toThrow("Template 'declaration' não encontrado");
      }
    });
  });

  describe('generateTranscriptPdf', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should call generatePdf with transcript template', async () => {
      const mockData = {
        studentName: 'Pedro Silva',
        institutionName: 'Escola Teste',
        years: [
          {
            year: 2023,
            subjects: [
              { subjectName: 'Matemática', finalGrade: 8.5, status: 'APROVADO' }
            ]
          }
        ],
      };

      // Verificar se template existe antes do teste
      const templatePath = path.join(
        process.cwd(),
        'src',
        'documents',
        'pdf',
        'templates',
        'transcript.hbs'
      );

      const templateExists = await fs.access(templatePath)
        .then(() => true)
        .catch(() => false);

      if (templateExists) {
        const pdfBuffer = await service.generateTranscriptPdf(mockData);
        expect(pdfBuffer).toBeInstanceOf(Buffer);
      } else {
        await expect(
          service.generateTranscriptPdf(mockData)
        ).rejects.toThrow("Template 'transcript' não encontrado");
      }
    });
  });
});