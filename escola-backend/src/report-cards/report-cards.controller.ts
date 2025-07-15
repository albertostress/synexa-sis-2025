/**
 * Report Cards Controller - Controle de boletins escolares
 * Referência: context7 mcp - NestJS Controllers Pattern
 */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('report-cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report-cards')
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Get(':studentId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Gerar boletim escolar de um aluno' })
  @ApiParam({ name: 'studentId', description: 'ID do aluno' })
  @ApiQuery({ name: 'year', description: 'Ano letivo', example: 2024 })
  @ApiResponse({
    status: 200,
    description: 'Boletim escolar gerado com sucesso',
    type: ReportCard,
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Aluno não possui matrícula ativa no ano especificado ou nenhuma nota encontrada',
  })
  async getReportCard(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: GetReportCardDto,
  ): Promise<ReportCard> {
    return this.reportCardsService.generateReportCard(studentId, query.year);
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
  @ApiOperation({ summary: 'Gerar boletins de todos os alunos de uma turma' })
  @ApiParam({ name: 'classId', description: 'ID da turma' })
  @ApiQuery({ name: 'year', description: 'Ano letivo', example: 2024 })
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
    return this.reportCardsService.generateClassReportCards(classId, query.year);
  }
}