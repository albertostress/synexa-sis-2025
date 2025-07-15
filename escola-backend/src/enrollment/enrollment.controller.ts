/**
 * Enrollment Controller - Controle de matrículas
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
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
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

  @Post()
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Criar nova matrícula' })
  @ApiResponse({
    status: 201,
    description: 'Matrícula criada com sucesso',
    type: EnrollmentWithRelations,
  })
  @ApiResponse({
    status: 409,
    description: 'Aluno já possui matrícula ativa neste ano letivo',
  })
  @ApiResponse({
    status: 400,
    description: 'Turma já atingiu a capacidade máxima',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno ou turma não encontrados',
  })
  async create(@Body() createEnrollmentDto: CreateEnrollmentDto): Promise<EnrollmentWithRelations> {
    return this.enrollmentService.create(createEnrollmentDto);
  }

  @Get()
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Listar todas as matrículas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de matrículas retornada com sucesso',
    type: [EnrollmentWithRelations],
  })
  async findAll(): Promise<EnrollmentWithRelations[]> {
    return this.enrollmentService.findAll();
  }

  @Get('by-year')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar matrículas por ano letivo' })
  @ApiQuery({ name: 'year', description: 'Ano letivo', example: 2024 })
  @ApiResponse({
    status: 200,
    description: 'Matrículas do ano letivo retornadas com sucesso',
    type: [EnrollmentWithRelations],
  })
  async findByYear(@Query('year', ParseIntPipe) year: number): Promise<EnrollmentWithRelations[]> {
    return this.enrollmentService.findByYear(year);
  }

  @Get('by-class/:classId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar matrículas por turma' })
  @ApiParam({ name: 'classId', description: 'ID da turma' })
  @ApiResponse({
    status: 200,
    description: 'Matrículas da turma retornadas com sucesso',
    type: [EnrollmentWithRelations],
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async findByClass(@Param('classId', ParseUUIDPipe) classId: string): Promise<EnrollmentWithRelations[]> {
    return this.enrollmentService.findByClass(classId);
  }

  @Get('by-student/:studentId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar matrículas por aluno' })
  @ApiParam({ name: 'studentId', description: 'ID do aluno' })
  @ApiResponse({
    status: 200,
    description: 'Matrículas do aluno retornadas com sucesso',
    type: [EnrollmentWithRelations],
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string): Promise<EnrollmentWithRelations[]> {
    return this.enrollmentService.findByStudent(studentId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar matrícula por ID' })
  @ApiParam({ name: 'id', description: 'ID da matrícula' })
  @ApiResponse({
    status: 200,
    description: 'Matrícula encontrada com sucesso',
    type: EnrollmentWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Matrícula não encontrada',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EnrollmentWithRelations> {
    return this.enrollmentService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Atualizar matrícula (status ou transferir turma)' })
  @ApiParam({ name: 'id', description: 'ID da matrícula' })
  @ApiResponse({
    status: 200,
    description: 'Matrícula atualizada com sucesso',
    type: EnrollmentWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Matrícula ou turma não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Turma já atingiu a capacidade máxima',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<EnrollmentWithRelations> {
    return this.enrollmentService.update(id, updateEnrollmentDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Cancelar matrícula (status = CANCELLED)' })
  @ApiParam({ name: 'id', description: 'ID da matrícula' })
  @ApiResponse({
    status: 200,
    description: 'Matrícula cancelada com sucesso',
    type: EnrollmentWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Matrícula não encontrada',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<EnrollmentWithRelations> {
    return this.enrollmentService.remove(id);
  }
}