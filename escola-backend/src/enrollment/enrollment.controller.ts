/**
 * Enrollment Controller - Controle de matrículas
 * Sistema Synexa-SIS Angola
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { CreateEnrollmentWithStudentDto } from './dto/create-enrollment-with-student.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { Enrollment, EnrollmentWithRelations } from './entities/enrollment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('enrollment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // ===== ENDPOINT PRINCIPAL =====
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Criar nova matrícula com estudante',
    description: 'Endpoint principal para matricular estudantes. Verifica duplicação por BI ou nome+data de nascimento, cria o estudante se necessário e executa a matrícula no sistema escolar.'
  })
  @ApiBody({ 
    type: CreateEnrollmentWithStudentDto,
    description: 'Dados completos do estudante e matrícula'
  })
  @ApiResponse({
    status: 201,
    description: 'Matrícula criada com sucesso',
    type: EnrollmentWithRelations,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito - Estudante duplicado ou já matriculado',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou turma sem capacidade disponível',
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada no sistema',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado - Token inválido ou expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Proibido - Sem permissão para esta operação',
  })
  async create(@Body() createEnrollmentDto: CreateEnrollmentWithStudentDto) {
    return this.enrollmentService.createWithStudent(createEnrollmentDto);
  }

  @Post('existing-student')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Matricular estudante existente',
    description: 'Cria matrícula para um estudante já cadastrado no sistema. Requer o ID do estudante.'
  })
  @ApiBody({ 
    type: CreateEnrollmentDto,
    description: 'Dados da matrícula com ID do estudante existente'
  })
  @ApiResponse({
    status: 201,
    description: 'Matrícula criada com sucesso',
    type: EnrollmentWithRelations,
  })
  @ApiResponse({
    status: 409,
    description: 'Estudante já possui matrícula activa neste ano lectivo',
  })
  @ApiResponse({
    status: 400,
    description: 'Turma já atingiu a capacidade máxima',
  })
  @ApiResponse({
    status: 404,
    description: 'Estudante ou turma não encontrados',
  })
  async createForExistingStudent(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentService.create(createEnrollmentDto);
  }

  @Get()
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Listar todas as matrículas',
    description: 'Retorna lista completa de matrículas com dados dos estudantes e turmas'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de matrículas retornada com sucesso',
    type: [EnrollmentWithRelations],
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para visualizar matrículas',
  })
  async findAll() {
    return this.enrollmentService.findAll();
  }

  @Get('by-year')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Buscar matrículas por ano lectivo',
    description: 'Filtra todas as matrículas de um ano lectivo específico'
  })
  @ApiQuery({ 
    name: 'year', 
    description: 'Ano lectivo para filtrar as matrículas', 
    example: 2025,
    required: true,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Matrículas do ano lectivo retornadas com sucesso',
    type: [EnrollmentWithRelations],
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetro year inválido',
  })
  async findByYear(@Query('year', ParseIntPipe) year: number) {
    return this.enrollmentService.findByYear(year);
  }

  @Get('by-class/:classId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Buscar matrículas por turma',
    description: 'Lista todos os estudantes matriculados numa turma específica'
  })
  @ApiParam({ 
    name: 'classId', 
    description: 'ID único da turma',
    type: String,
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Matrículas da turma retornadas com sucesso',
    type: [EnrollmentWithRelations],
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada no sistema',
  })
  @ApiResponse({
    status: 400,
    description: 'ID da turma inválido',
  })
  async findByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.enrollmentService.findByClass(classId);
  }

  @Get('by-student/:studentId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Buscar histórico de matrículas do estudante',
    description: 'Retorna todas as matrículas (actuais e anteriores) de um estudante específico'
  })
  @ApiParam({ 
    name: 'studentId', 
    description: 'ID único do estudante',
    type: String,
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico de matrículas do estudante retornado com sucesso',
    type: [EnrollmentWithRelations],
  })
  @ApiResponse({
    status: 404,
    description: 'Estudante não encontrado no sistema',
  })
  @ApiResponse({
    status: 400,
    description: 'ID do estudante inválido',
  })
  async findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.enrollmentService.findByStudent(studentId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Buscar matrícula específica',
    description: 'Retorna dados completos de uma matrícula através do seu ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único da matrícula',
    type: String,
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Matrícula encontrada com sucesso',
    type: EnrollmentWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Matrícula não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'ID da matrícula inválido',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Actualizar matrícula',
    description: 'Permite actualizar o status da matrícula ou transferir o estudante para outra turma'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único da matrícula a actualizar',
    type: String,
    format: 'uuid'
  })
  @ApiBody({ 
    type: UpdateEnrollmentDto,
    description: 'Dados a actualizar na matrícula'
  })
  @ApiResponse({
    status: 200,
    description: 'Matrícula actualizada com sucesso',
    type: EnrollmentWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Matrícula ou turma não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou turma sem capacidade',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para actualizar matrículas',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentService.update(id, updateEnrollmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Cancelar matrícula do estudante',
    description: 'Cancela a matrícula alterando o status para CANCELLED. A matrícula não é removida fisicamente do sistema.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único da matrícula a cancelar',
    type: String,
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Matrícula cancelada com sucesso',
    type: EnrollmentWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Matrícula não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'ID da matrícula inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para cancelar matrículas',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentService.remove(id);
  }
}