/**
 * Report Cards Controller - Controle de boletins escolares
 * Referência: context7 mcp - NestJS Controllers Pattern
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Res,
  Header,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportCardsService } from './report-cards.service';
import { GetReportCardDto } from './dto/get-report-card.dto';
import { ReportCard, StudentInfo } from './entities/report-card.entity';
import { AngolaReportCard } from './entities/angola-report-card.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportCardsPdfService } from './pdf/report-cards-pdf.service';

@ApiTags('report-cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report-cards')
export class ReportCardsController {
  constructor(
    private readonly reportCardsService: ReportCardsService,
    private readonly reportCardsPdfService: ReportCardsPdfService,
  ) {}

  @Get(':studentId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Boletim Escolar - Angola (MINED)',
    description: 'Gera boletim escolar completo seguindo padrões do Ministério da Educação de Angola. Inclui MAC, NPP, NPT, MT, classificações textuais e situação final.'
  })
  @ApiParam({ 
    name: 'studentId', 
    description: 'ID do aluno (UUID)',
    example: 'EST20250715'
  })
  @ApiQuery({ 
    name: 'year', 
    description: 'Ano letivo para consulta do boletim', 
    example: 2024 
  })
  @ApiQuery({ 
    name: 'term', 
    description: 'Trimestre específico (1, 2, 3). Omitir para boletim anual completo', 
    required: false, 
    example: 1 
  })
  @ApiResponse({
    status: 200,
    description: 'Boletim escolar angolano gerado com sucesso. Inclui dados do aluno, notas por disciplina com MAC/NPP/NPT/MT, classificações e situação final.',
    type: AngolaReportCard,
    schema: {
      example: {
        student: {
          name: 'João Silva Santos',
          fatherName: 'António Silva',
          className: '12ª Classe - Turma A',
          shift: 'Manhã',
          birthDate: '15/03/2006',
          academicYear: 2024
        },
        subjects: [
          {
            subjectName: 'Matemática',
            teacherName: 'Prof. Maria Santos',
            mac: 14.0,
            npp: 16.0,
            npt: 15.0,
            mt: 15.0,
            fal: 2,
            classification: 'Muito Bom'
          },
          {
            subjectName: 'Português',
            teacherName: 'Prof. Carlos Costa',
            mac: 13.0,
            npp: 14.0,
            npt: 12.0,
            mt: 13.0,
            fal: 1,
            classification: 'Bom'
          }
        ],
        averageGrade: 14.0,
        finalStatus: 'Aprovado',
        attendancePercentage: 95.5,
        term: 1,
        year: 2024,
        generatedAt: '2024-07-22T14:30:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado no sistema',
  })
  @ApiResponse({
    status: 400,
    description: 'Aluno não possui matrícula ativa no ano especificado ou nenhuma nota lançada no período solicitado',
  })
  async getReportCard(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: GetReportCardDto,
  ): Promise<AngolaReportCard> {
    return this.reportCardsService.generateAngolaReportCard(studentId, query.year, query.term);
  }

  @Get('class/:classId/students')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Listar alunos de uma turma para seleção de boletim' })
  @ApiParam({ name: 'classId', description: 'ID da turma' })
  @ApiQuery({ name: 'year', description: 'Ano letivo', example: 2024 })
  @ApiResponse({
    status: 200,
    description: 'Lista de alunos da turma retornada com sucesso',
    type: [StudentInfo],
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async getStudentsByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query() query: GetReportCardDto,
  ): Promise<StudentInfo[]> {
    return this.reportCardsService.getStudentsByClass(classId, query.year);
  }

  @Get('class/:classId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Gerar boletins de todos os alunos de uma turma (Sistema Angolano)' })
  @ApiParam({ name: 'classId', description: 'ID da turma' })
  @ApiQuery({ name: 'year', description: 'Ano letivo', example: 2024 })
  @ApiQuery({ name: 'term', description: 'Trimestre específico (1, 2, 3) ou omitir para boletim final', required: false, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Boletins da turma gerados com sucesso',
    type: [ReportCard],
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async getClassReportCards(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query() query: GetReportCardDto,
  ): Promise<ReportCard[]> {
    return this.reportCardsService.generateClassReportCards(classId, query.year, query.term);
  }

  // ============= ENDPOINT PARA PDF DO BOLETIM ANGOLANO =============

  @Post(':studentId/pdf')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @Header('Content-Type', 'application/pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Gerar e baixar boletim escolar em PDF (Sistema Angolano)',
    description: 'Gera um boletim escolar em PDF seguindo o padrão do MINED Angola com MAC, NPP, NPT, MT e FAL'
  })
  @ApiParam({ name: 'studentId', description: 'ID do aluno' })
  @ApiResponse({
    status: 200,
    description: 'PDF do boletim gerado com sucesso',
    headers: {
      'Content-Type': { description: 'application/pdf' },
      'Content-Disposition': { description: 'attachment; filename="boletim.pdf"' },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Aluno não possui matrícula ativa no ano especificado ou nenhuma nota encontrada',
  })
  async downloadReportCardPdf(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() query: GetReportCardDto,
    @Res() res: Response,
  ): Promise<void> {
    // Gerar dados do boletim no formato angolano melhorado
    const reportCard = await this.reportCardsService.generateAngolaReportCard(
      studentId, 
      query.year, 
      query.term
    );

    // Gerar PDF usando o serviço de PDFs de boletins
    const pdfBuffer = await this.reportCardsPdfService.generateReportCardPdf(reportCard);

    // Definir nome do arquivo
    const termText = query.term ? `_${query.term}trimestre` : '_final';
    const studentName = reportCard.student.name.replace(/\s+/g, '_');
    const filename = `boletim_angola_${studentName}_${query.year}${termText}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  }
}