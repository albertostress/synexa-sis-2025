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
} from '@nestjs/common';
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

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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
}