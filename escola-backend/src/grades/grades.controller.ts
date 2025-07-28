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
import { GradesAngolaService } from './grades-angola.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { Grade, GradeWithRelations } from './entities/grade.entity';
import { 
  AngolaStudentTermGradesDto,
  AngolaClassStudentSummaryDto,
  AngolaCalculateMtDto
} from './dto/angola-grades.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('grades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grades')
export class GradesController {
  constructor(
    private readonly gradesService: GradesService,
    private readonly gradesAngolaService: GradesAngolaService,
  ) {}

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
  @ApiOperation({ summary: 'Listar todas as notas com filtros opcionais' })
  @ApiQuery({ name: 'studentId', description: 'ID do aluno', required: false })
  @ApiQuery({ name: 'subjectId', description: 'ID da disciplina', required: false })
  @ApiQuery({ name: 'teacherId', description: 'ID do professor', required: false })
  @ApiQuery({ name: 'classId', description: 'ID da turma', required: false })
  @ApiQuery({ name: 'type', description: 'Tipo de avaliação', enum: GradeType, required: false })
  @ApiQuery({ name: 'term', description: 'Trimestre (1, 2 ou 3)', type: 'number', required: false })
  @ApiQuery({ name: 'year', description: 'Ano letivo', type: 'number', required: false })
  @ApiQuery({ name: 'studentName', description: 'Nome do aluno (busca parcial)', required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de notas retornada com sucesso',
    type: [GradeWithRelations],
  })
  async findAll(
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('classId') classId?: string,
    @Query('type') type?: GradeType,
    @Query('term') termStr?: string,
    @Query('year') yearStr?: string,
    @Query('studentName') studentName?: string,
  ): Promise<GradeWithRelations[]> {
    // Construir filtros com validação de tipos
    const filters: any = {};
    
    if (studentId) filters.studentId = studentId;
    if (subjectId) filters.subjectId = subjectId;
    if (teacherId) filters.teacherId = teacherId;
    if (classId) filters.classId = classId;
    if (type) filters.type = type;
    if (studentName) filters.studentName = studentName;
    
    // Parse números com validação
    if (termStr) {
      const term = parseInt(termStr);
      if (!isNaN(term) && term >= 1 && term <= 3) {
        filters.term = term;
      }
    }
    
    if (yearStr) {
      const year = parseInt(yearStr);
      if (!isNaN(year) && year >= 2020) {
        filters.year = year;
      }
    }

    return this.gradesService.findAll(filters);
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

  // ==================== ENDPOINTS OTIMIZADOS SISTEMA ANGOLANO ====================

  @Get('angola/student/:studentId/term/:term')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Buscar notas completas de um aluno por trimestre (Otimizado)',
    description: 'Retorna as notas do aluno com MT calculada e status final. Ideal para boletim escolar.'
  })
  @ApiParam({ name: 'studentId', description: 'ID do aluno' })
  @ApiParam({ name: 'term', description: 'Trimestre (1, 2 ou 3)' })
  @ApiResponse({
    status: 200,
    description: 'Notas completas do aluno retornadas com sucesso',
    type: AngolaStudentTermGradesDto,
    example: {
      student: "Carlos Mateus Silva",
      term: "1º Trimestre", 
      subjects: [
        {
          subject: "Matemática",
          mac: 13,
          npp: 14,
          npt: 12,
          mt: 13.0,
          status: "APROVADO"
        }
      ],
      average: 14.5,
      statusGeral: "APROVADO"
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async getStudentTermGrades(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('term', ParseIntPipe) term: number,
  ): Promise<AngolaStudentTermGradesDto> {
    return this.gradesAngolaService.getStudentTermGrades(studentId, term);
  }

  @Get('angola/class/:classId/term/:term')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Resumo de notas de toda a turma por trimestre (Otimizado)',
    description: 'Retorna média e status de todos os alunos da turma. Ideal para dashboards.'
  })
  @ApiParam({ name: 'classId', description: 'ID da turma' })
  @ApiParam({ name: 'term', description: 'Trimestre (1, 2 ou 3)' })
  @ApiResponse({
    status: 200,
    description: 'Resumo da turma retornado com sucesso',
    type: [AngolaClassStudentSummaryDto],
    example: [
      { student: "Carlos Mateus", mt: 13.0, status: "APROVADO" },
      { student: "Ana Lopes", mt: 8.5, status: "REPROVADO" }
    ]
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async getClassTermSummary(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('term', ParseIntPipe) term: number,
  ): Promise<AngolaClassStudentSummaryDto[]> {
    return this.gradesAngolaService.getClassTermSummary(classId, term);
  }

  @Get('angola/calculate-mt/:studentId/:subjectId/:term')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Calcular MT isolada de uma disciplina (Otimizado)',
    description: 'Retorna cálculo isolado de MAC, NPP, NPT e MT. Ideal para feedback ao professor.'
  })
  @ApiParam({ name: 'studentId', description: 'ID do aluno' })
  @ApiParam({ name: 'subjectId', description: 'ID da disciplina' })
  @ApiParam({ name: 'term', description: 'Trimestre (1, 2 ou 3)' })
  @ApiResponse({
    status: 200,
    description: 'MT calculada com sucesso',
    type: AngolaCalculateMtDto,
    example: {
      mac: 14,
      npp: 12,
      npt: 15,
      mt: 13.7,
      status: "APROVADO"
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno ou disciplina não encontrados',
  })
  async calculateSubjectMT(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Param('term', ParseIntPipe) term: number,
  ): Promise<AngolaCalculateMtDto> {
    return this.gradesAngolaService.calculateSubjectMT(studentId, subjectId, term);
  }
}