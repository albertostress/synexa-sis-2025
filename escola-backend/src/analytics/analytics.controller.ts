/**
 * Analytics Controller - Controlador de análise e dashboards
 * Endpoints REST para métricas administrativas e pedagógicas
 */
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import {
  OverviewResponse,
  AttendanceAnalyticsResponse,
  GradesAnalyticsResponse,
  FinanceAnalyticsResponse,
  MatriculationAnalyticsResponse,
} from './responses/dashboard-metrics.response';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('ADMIN', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Dashboard geral do sistema',
    description: 'Retorna métricas gerais incluindo totais de alunos, professores, turmas e indicadores principais' 
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Ano letivo para filtrar (padrão: ano atual)',
    example: 2024,
  })
  @ApiQuery({
    name: 'shift',
    required: false,
    type: String,
    description: 'Turno para filtrar (MORNING, AFTERNOON, EVENING)',
    example: 'MORNING',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas gerais retornadas com sucesso',
    type: OverviewResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar analytics (apenas ADMIN/DIRETOR)',
  })
  async getOverview(
    @Query() filters: FilterAnalyticsDto,
  ): Promise<OverviewResponse> {
    return this.analyticsService.getOverview(filters);
  }

  @Get('attendance')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Relatório de frequência geral e por turma',
    description: 'Análise detalhada de presença incluindo ranking de turmas, distribuição de faltas e tendências' 
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Ano letivo para filtrar (padrão: ano atual)',
    example: 2024,
  })
  @ApiQuery({
    name: 'classId',
    required: false,
    type: String,
    description: 'ID da turma para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Mês para filtrar (1-12)',
    example: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Análise de frequência retornada com sucesso',
    type: AttendanceAnalyticsResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar analytics de frequência',
  })
  async getAttendanceAnalytics(
    @Query() filters: FilterAnalyticsDto,
  ): Promise<AttendanceAnalyticsResponse> {
    return this.analyticsService.getAttendanceAnalytics(filters);
  }

  @Get('grades')
  @Roles('ADMIN', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Análise de desempenho escolar',
    description: 'Métricas de notas incluindo médias por disciplina, aprovação/reprovação e ranking de turmas' 
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Ano letivo para filtrar (padrão: ano atual)',
    example: 2024,
  })
  @ApiQuery({
    name: 'classId',
    required: false,
    type: String,
    description: 'ID da turma para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'disciplineId',
    required: false,
    type: String,
    description: 'ID da disciplina para filtrar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Análise de desempenho retornada com sucesso',
    type: GradesAnalyticsResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar analytics de notas (apenas ADMIN/DIRETOR)',
  })
  async getGradesAnalytics(
    @Query() filters: FilterAnalyticsDto,
  ): Promise<GradesAnalyticsResponse> {
    return this.analyticsService.getGradesAnalytics(filters);
  }

  @Get('finance')
  @Roles('ADMIN', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Indicadores financeiros',
    description: 'Análise financeira incluindo faturamento, recebimentos, inadimplência e projeções' 
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Ano letivo para filtrar (padrão: ano atual)',
    example: 2024,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Mês para filtrar (1-12)',
    example: 3,
  })
  @ApiResponse({
    status: 200,
    description: 'Análise financeira retornada com sucesso',
    type: FinanceAnalyticsResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar analytics financeiros (apenas ADMIN/DIRETOR)',
  })
  async getFinanceAnalytics(
    @Query() filters: FilterAnalyticsDto,
  ): Promise<FinanceAnalyticsResponse> {
    return this.analyticsService.getFinanceAnalytics(filters);
  }

  @Get('matriculation')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Distribuição e evolução das matrículas',
    description: 'Análise de matrículas por turno, turma, crescimento mensal e distribuições demográficas' 
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Ano letivo para filtrar (padrão: ano atual)',
    example: 2024,
  })
  @ApiQuery({
    name: 'shift',
    required: false,
    type: String,
    description: 'Turno para filtrar (MORNING, AFTERNOON, EVENING)',
    example: 'MORNING',
  })
  @ApiResponse({
    status: 200,
    description: 'Análise de matrículas retornada com sucesso',
    type: MatriculationAnalyticsResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar analytics de matrículas',
  })
  async getMatriculationAnalytics(
    @Query() filters: FilterAnalyticsDto,
  ): Promise<MatriculationAnalyticsResponse> {
    return this.analyticsService.getMatriculationAnalytics(filters);
  }
}