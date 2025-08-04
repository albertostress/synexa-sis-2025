/**
 * Documents Controller - Controle de documentos oficiais escolares
 * Referência: context7 mcp - NestJS Controllers Pattern
 */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { GenerateCertificateDto } from './dto/generate-certificate.dto';
import { GenerateDeclarationDto } from './dto/generate-declaration.dto';
import { GenerateTranscriptDto } from './dto/generate-transcript.dto';
import { CertificateData } from './templates/certificate.template';
import { DeclarationData } from './templates/declaration.template';
import { TranscriptData } from './templates/transcript.template';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PdfService } from './pdf/pdf.service';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfService: PdfService,
  ) {}

  @Post('certificate')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar certificado de conclusão' })
  @ApiResponse({
    status: 200,
    description: 'Certificado gerado com sucesso',
    type: CertificateData,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou aluno não possui matrícula no ano especificado',
  })
  @ApiResponse({
    status: 403,
    description: 'Não é possível gerar certificado para aluno não aprovado',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async generateCertificate(
    @Body() generateCertificateDto: GenerateCertificateDto,
  ): Promise<CertificateData> {
    return this.documentsService.generateCertificate(
      generateCertificateDto.studentId,
      generateCertificateDto.year,
    );
  }

  @Post('declaration')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar declaração de matrícula' })
  @ApiResponse({
    status: 200,
    description: 'Declaração gerada com sucesso',
    type: DeclarationData,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou aluno não possui matrícula ativa no ano especificado',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async generateDeclaration(
    @Body() generateDeclarationDto: GenerateDeclarationDto,
  ): Promise<DeclarationData> {
    return this.documentsService.generateDeclaration(
      generateDeclarationDto.studentId,
      generateDeclarationDto.year,
      generateDeclarationDto.purpose,
    );
  }

  @Post('transcript')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar histórico escolar' })
  @ApiResponse({
    status: 200,
    description: 'Histórico escolar gerado com sucesso',
    type: TranscriptData,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou nenhuma matrícula encontrada para o período especificado',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async generateTranscript(
    @Body() generateTranscriptDto: GenerateTranscriptDto,
  ): Promise<TranscriptData> {
    return this.documentsService.generateTranscript(
      generateTranscriptDto.studentId,
      generateTranscriptDto.startYear,
      generateTranscriptDto.endYear,
    );
  }

  @Get('pdf/health')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Verificar status do serviço de PDF com estatísticas de cache' })
  @ApiResponse({
    status: 200,
    description: 'Status do serviço de PDF e cache',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        browser: { type: 'boolean', example: true },
        mode: { type: 'string', example: 'production' },
        cache: {
          type: 'object',
          properties: {
            size: { type: 'number', example: 5 },
            maxSize: { type: 'number', example: 100 },
            maxAge: { type: 'number', example: 1800 },
          },
        },
      },
    },
  })
  async getPdfHealth(): Promise<{ 
    status: string; 
    playwrightService: boolean; 
    mode: string;
    cache: any;
  }> {
    return this.pdfService.healthCheck();
  }

  @Post('pdf/clear-cache')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpar cache de PDFs (apenas ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Cache de PDFs limpo com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cache de PDFs limpo com sucesso' },
        timestamp: { type: 'string', example: '2024-07-15T22:30:00.000Z' },
      },
    },
  })
  async clearPdfCache(): Promise<{ message: string; timestamp: string }> {
    this.pdfService.clearCache();
    return {
      message: 'Cache de PDFs limpo com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  // ============= ENDPOINTS PARA DOWNLOAD DIRETO DE PDF =============

  @Post('certificate/pdf')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Gerar e baixar certificado de conclusão em PDF' })
  @ApiResponse({
    status: 200,
    description: 'PDF do certificado gerado com sucesso',
    headers: {
      'Content-Type': { description: 'application/pdf' },
      'Content-Disposition': { description: 'attachment; filename="certificado.pdf"' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou aluno não possui matrícula no ano especificado',
  })
  @ApiResponse({
    status: 403,
    description: 'Não é possível gerar certificado para aluno não aprovado',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async downloadCertificatePdf(
    @Body() generateCertificateDto: GenerateCertificateDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.documentsService.generateCertificatePdf(
      generateCertificateDto.studentId,
      generateCertificateDto.year,
    );

    const filename = `certificado_${generateCertificateDto.studentId}_${generateCertificateDto.year}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  }

  @Post('declaration/pdf')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Gerar e baixar declaração de matrícula em PDF' })
  @ApiResponse({
    status: 200,
    description: 'PDF da declaração gerado com sucesso',
    headers: {
      'Content-Type': { description: 'application/pdf' },
      'Content-Disposition': { description: 'attachment; filename="declaracao.pdf"' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou aluno não possui matrícula ativa no ano especificado',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async downloadDeclarationPdf(
    @Body() generateDeclarationDto: GenerateDeclarationDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.documentsService.generateDeclarationPdf(
      generateDeclarationDto.studentId,
      generateDeclarationDto.year,
      generateDeclarationDto.purpose,
    );

    const filename = `declaracao_${generateDeclarationDto.studentId}_${generateDeclarationDto.year}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  }

  @Post('transcript/pdf')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Gerar e baixar histórico escolar em PDF' })
  @ApiResponse({
    status: 200,
    description: 'PDF do histórico escolar gerado com sucesso',
    headers: {
      'Content-Type': { description: 'application/pdf' },
      'Content-Disposition': { description: 'attachment; filename="historico.pdf"' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou nenhuma matrícula encontrada para o período especificado',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async downloadTranscriptPdf(
    @Body() generateTranscriptDto: GenerateTranscriptDto,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.documentsService.generateTranscriptPdf(
      generateTranscriptDto.studentId,
      generateTranscriptDto.startYear,
      generateTranscriptDto.endYear,
    );

    const filename = `historico_${generateTranscriptDto.studentId}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  }

  // ============= ENDPOINTS PARA GERAÇÃO COMBINADA (JSON + PDF) =============

  @Post('certificate/with-pdf')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar certificado com dados JSON e PDF em base64' })
  @ApiResponse({
    status: 200,
    description: 'Certificado gerado com dados e PDF',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/CertificateData' },
        pdf: { type: 'string', description: 'PDF em base64' },
        filename: { type: 'string', example: 'certificado_123_2024.pdf' },
      },
    },
  })
  async generateCertificateWithPdf(
    @Body() generateCertificateDto: GenerateCertificateDto,
  ): Promise<{
    data: CertificateData;
    pdf: string;
    filename: string;
  }> {
    const result = await this.documentsService.generateCertificateWithPdf(
      generateCertificateDto.studentId,
      generateCertificateDto.year,
    );

    const filename = `certificado_${generateCertificateDto.studentId}_${generateCertificateDto.year}.pdf`;

    return {
      data: result.data,
      pdf: result.pdf.toString('base64'),
      filename,
    };
  }

  @Post('declaration/with-pdf')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar declaração com dados JSON e PDF em base64' })
  @ApiResponse({
    status: 200,
    description: 'Declaração gerada com dados e PDF',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/DeclarationData' },
        pdf: { type: 'string', description: 'PDF em base64' },
        filename: { type: 'string', example: 'declaracao_123_2024.pdf' },
      },
    },
  })
  async generateDeclarationWithPdf(
    @Body() generateDeclarationDto: GenerateDeclarationDto,
  ): Promise<{
    data: DeclarationData;
    pdf: string;
    filename: string;
  }> {
    const result = await this.documentsService.generateDeclarationWithPdf(
      generateDeclarationDto.studentId,
      generateDeclarationDto.year,
      generateDeclarationDto.purpose,
    );

    const filename = `declaracao_${generateDeclarationDto.studentId}_${generateDeclarationDto.year}.pdf`;

    return {
      data: result.data,
      pdf: result.pdf.toString('base64'),
      filename,
    };
  }

  @Post('transcript/with-pdf')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar histórico escolar com dados JSON e PDF em base64' })
  @ApiResponse({
    status: 200,
    description: 'Histórico escolar gerado com dados e PDF',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/TranscriptData' },
        pdf: { type: 'string', description: 'PDF em base64' },
        filename: { type: 'string', example: 'historico_123.pdf' },
      },
    },
  })
  async generateTranscriptWithPdf(
    @Body() generateTranscriptDto: GenerateTranscriptDto,
  ): Promise<{
    data: TranscriptData;
    pdf: string;
    filename: string;
  }> {
    const result = await this.documentsService.generateTranscriptWithPdf(
      generateTranscriptDto.studentId,
      generateTranscriptDto.startYear,
      generateTranscriptDto.endYear,
    );

    const filename = `historico_${generateTranscriptDto.studentId}.pdf`;

    return {
      data: result.data,
      pdf: result.pdf.toString('base64'),
      filename,
    };
  }
}