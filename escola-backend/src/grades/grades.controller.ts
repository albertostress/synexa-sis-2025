/**
 * Grades Controller - Controle de notas
 * Referência: context7 mcp - NestJS Controllers Pattern
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { GradeType } from '@prisma/client';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { Grade, GradeWithRelations } from './entities/grade.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('grades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles('PROFESSOR')
  @ApiOperation({ summary: 'Lançar nova nota' })
  @ApiResponse({
    status: 201,
    description: 'Nota lançada com sucesso',
    type: GradeWithRelations,
  })
  @ApiResponse({
    status: 403,
    description: 'Professor não ministra esta disciplina ou não tem permissão',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma nota lançada para este aluno nesta disciplina',
  })
  @ApiResponse({
    status: 400,
    description: 'Aluno não está matriculado nesta turma no ano especificado',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno, disciplina, professor ou turma não encontrados',
  })
  async create(
    @Body() createGradeDto: CreateGradeDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<GradeWithRelations> {
    return this.gradesService.create(createGradeDto, user.id);
  }

  @Get()
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Listar todas as notas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notas retornada com sucesso',
    type: [GradeWithRelations],
  })
  async findAll(): Promise<GradeWithRelations[]> {
    return this.gradesService.findAll();
  }

  @Get('by-student/:studentId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Buscar notas por aluno' })
  @ApiParam({ name: 'studentId', description: 'ID do aluno' })
  @ApiResponse({
    status: 200,
    description: 'Notas do aluno retornadas com sucesso',
    type: [GradeWithRelations],
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string): Promise<GradeWithRelations[]> {
    return this.gradesService.findByStudent(studentId);
  }

  @Get('by-class/:classId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Buscar notas por turma' })
  @ApiParam({ name: 'classId', description: 'ID da turma' })
  @ApiResponse({
    status: 200,
    description: 'Notas da turma retornadas com sucesso',
    type: [GradeWithRelations],
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async findByClass(@Param('classId', ParseUUIDPipe) classId: string): Promise<GradeWithRelations[]> {
    return this.gradesService.findByClass(classId);
  }

  @Get('by-subject/:subjectId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Buscar notas por disciplina' })
  @ApiParam({ name: 'subjectId', description: 'ID da disciplina' })
  @ApiResponse({
    status: 200,
    description: 'Notas da disciplina retornadas com sucesso',
    type: [GradeWithRelations],
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  async findBySubject(@Param('subjectId', ParseUUIDPipe) subjectId: string): Promise<GradeWithRelations[]> {
    return this.gradesService.findBySubject(subjectId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Buscar nota por ID' })
  @ApiParam({ name: 'id', description: 'ID da nota' })
  @ApiResponse({
    status: 200,
    description: 'Nota encontrada com sucesso',
    type: GradeWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Nota não encontrada',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<GradeWithRelations> {
    return this.gradesService.findOne(id);
  }

  @Patch(':id')
  @Roles('PROFESSOR')
  @ApiOperation({ summary: 'Atualizar nota' })
  @ApiParam({ name: 'id', description: 'ID da nota' })
  @ApiResponse({
    status: 200,
    description: 'Nota atualizada com sucesso',
    type: GradeWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Nota não encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'Você só pode atualizar notas que você mesmo lançou',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGradeDto: UpdateGradeDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<GradeWithRelations> {
    return this.gradesService.update(id, updateGradeDto, user.id);
  }

  @Delete(':id')
  @Roles('PROFESSOR')
  @ApiOperation({ summary: 'Remover nota' })
  @ApiParam({ name: 'id', description: 'ID da nota' })
  @ApiResponse({
    status: 200,
    description: 'Nota removida com sucesso',
    type: GradeWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Nota não encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'Você só pode remover notas que você mesmo lançou',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<GradeWithRelations> {
    return this.gradesService.remove(id, user.id);
  }

  // ==================== ENDPOINTS ESPECÍFICOS SISTEMA ANGOLANO ====================

  @Get('angola/student/:studentId/term/:term')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Buscar notas de um aluno por trimestre (Sistema Angolano)',
    description: 'Retorna todas as notas de um aluno em um trimestre específico, organizadas por disciplina e tipo (MAC, NPP, NPT, MT, FAL)'
  })
  @ApiParam({ name: 'studentId', description: 'ID do aluno' })
  @ApiParam({ name: 'term', description: 'Trimestre (1, 2 ou 3)' })
  @ApiQuery({ name: 'year', description: 'Ano letivo', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notas do aluno no trimestre retornadas com sucesso',
    type: [GradeWithRelations],
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async findByStudentAndTerm(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('term', ParseIntPipe) term: number,
    @Query('year', ParseIntPipe) year?: number,
  ): Promise<GradeWithRelations[]> {
    const currentYear = year || new Date().getFullYear();
    return this.gradesService.findByStudentAndTerm(studentId, term, currentYear);
  }

  @Get('angola/type/:type')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Buscar notas por tipo de avaliação (Sistema Angolano)',
    description: 'Retorna todas as notas de um tipo específico (MAC, NPP, NPT, MT, FAL)'
  })
  @ApiParam({ 
    name: 'type', 
    description: 'Tipo de avaliação (MAC, NPP, NPT, MT, FAL)',
    enum: GradeType
  })
  @ApiQuery({ name: 'year', description: 'Ano letivo', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notas do tipo retornadas com sucesso',
    type: [GradeWithRelations],
  })
  async findByType(
    @Param('type', new ParseEnumPipe(GradeType)) type: GradeType,
    @Query('year', ParseIntPipe) year?: number,
  ): Promise<GradeWithRelations[]> {
    return this.gradesService.findByType(type, year);
  }

  @Get('angola/class/:classId/term/:term')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Buscar notas de uma turma por trimestre (Sistema Angolano)',
    description: 'Retorna todas as notas de uma turma em um trimestre específico, organizadas por aluno e disciplina'
  })
  @ApiParam({ name: 'classId', description: 'ID da turma' })
  @ApiParam({ name: 'term', description: 'Trimestre (1, 2 ou 3)' })
  @ApiQuery({ name: 'year', description: 'Ano letivo', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notas da turma no trimestre retornadas com sucesso',
    type: [GradeWithRelations],
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async findByClassAndTerm(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('term', ParseIntPipe) term: number,
    @Query('year', ParseIntPipe) year?: number,
  ): Promise<GradeWithRelations[]> {
    const currentYear = year || new Date().getFullYear();
    return this.gradesService.findByClassAndTerm(classId, term, currentYear);
  }

  @Get('angola/calculate-mt/:studentId/:subjectId/:term')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Calcular Média Trimestral (MT) - Sistema Angolano',
    description: 'Calcula a média trimestral de um aluno em uma disciplina baseado nas notas MAC, NPP e NPT. Fórmula: (MAC + NPP + NPT) / 3'
  })
  @ApiParam({ name: 'studentId', description: 'ID do aluno' })
  @ApiParam({ name: 'subjectId', description: 'ID da disciplina' })
  @ApiParam({ name: 'term', description: 'Trimestre (1, 2 ou 3)' })
  @ApiQuery({ name: 'year', description: 'Ano letivo', required: false, type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Média trimestral calculada com sucesso',
    schema: {
      type: 'object',
      properties: {
        mt: { type: 'number', example: 16.5, description: 'Média Trimestral calculada' },
        studentId: { type: 'string', example: 'uuid' },
        subjectId: { type: 'string', example: 'uuid' },
        term: { type: 'number', example: 1 },
        year: { type: 'number', example: 2024 },
      },
    },
  })
  async calculateMT(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Param('term', ParseIntPipe) term: number,
    @Query('year', ParseIntPipe) year?: number,
  ): Promise<{ mt: number | null; studentId: string; subjectId: string; term: number; year: number }> {
    const currentYear = year || new Date().getFullYear();
    const mt = await this.gradesService.calculateMT(studentId, subjectId, term, currentYear);
    
    return {
      mt,
      studentId,
      subjectId,
      term,
      year: currentYear,
    };
  }
}