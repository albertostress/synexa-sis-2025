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
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
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
}