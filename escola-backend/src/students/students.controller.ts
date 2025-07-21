import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsQueryDto, PaginatedStudentsResponseDto } from './dto/students-query.dto';
import { CreateStudentNoteDto } from './dto/create-student-note.dto';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { StudentStatisticsDto } from './dto/student-statistics.dto';
import { Student, StudentNote, StudentTimeline } from '@prisma/client';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Criar novo aluno',
    description: 'Cria um novo aluno no sistema com todas as informações pessoais, acadêmicas e familiares'
  })
  @ApiBody({ type: CreateStudentDto })
  @ApiResponse({
    status: 201,
    description: 'Aluno criado com sucesso',
    schema: {
      type: 'object',
      example: {
        id: 'uuid-generated-id',
        firstName: 'João',
        lastName: 'Silva',
        gender: 'MASCULINO',
        birthDate: '2010-05-15T00:00:00.000Z',
        phone: '+244923456789',
        studentNumber: '2024-0001',
        academicYear: '2024',
        classId: 'uuid-da-turma',
        profilePhotoUrl: null,
        guardianName: 'Maria Silva',
        guardianPhone: '+244923456789',
        municipality: 'Luanda',
        province: 'Luanda',
        country: 'Angola',
        parentEmail: 'pais@email.com',
        parentPhone: '+244923456789',
        schoolClass: {
          id: 'uuid-da-turma',
          name: '10ª A',
          year: 2024,
          shift: 'MORNING'
        },
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Número de matrícula já existe' })
  async create(@Body() createStudentDto: CreateStudentDto): Promise<Student> {
    return await this.studentsService.create(createStudentDto);
  }

  @Get()
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Listar alunos com paginação e filtros',
    description: 'Retorna lista paginada de alunos com opções de busca e filtros'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 20, máx: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Busca por nome, apelido ou número' })
  @ApiQuery({ name: 'academicYear', required: false, type: String, description: 'Filtrar por ano académico' })
  @ApiQuery({ name: 'classId', required: false, type: String, description: 'Filtrar por ID da turma' })
  @ApiQuery({ name: 'province', required: false, type: String, description: 'Filtrar por província' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de alunos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        students: {
          type: 'array',
          items: {
            type: 'object',
            example: {
              id: 'uuid-generated-id',
              firstName: 'João',
              lastName: 'Silva',
              gender: 'MASCULINO',
              birthDate: '2010-05-15T00:00:00.000Z',
              phone: '+244923456789',
                    studentNumber: '2024-0001',
              academicYear: '2024',
              classId: 'uuid-da-turma',
              profilePhotoUrl: null,
              guardianName: 'Maria Silva',
              guardianPhone: '+244923456789',
              municipality: 'Luanda',
              province: 'Luanda',
              country: 'Angola',
              parentEmail: 'pais@email.com',
              parentPhone: '+244923456789',
              schoolClass: {
                id: 'uuid-da-turma',
                name: '10ª A',
                year: 2024,
                shift: 'MORNING'
              },
              createdAt: '2024-01-01T10:00:00.000Z',
              updatedAt: '2024-01-01T10:00:00.000Z',
            },
          },
        },
        total: { type: 'number', example: 150 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 8 },
        hasNext: { type: 'boolean', example: true },
        hasPrevious: { type: 'boolean', example: false },
      },
    },
  })
  async findAll(@Query() query: StudentsQueryDto): Promise<PaginatedStudentsResponseDto> {
    return await this.studentsService.findAllPaginated(query);
  }

  @Get('by-bi/:biNumber')
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Verificar se estudante existe por BI',
    description: 'Verifica se já existe um estudante com o número de BI informado. Retorna 200 se existe, 404 se não existe.'
  })
  @ApiParam({
    name: 'biNumber',
    description: 'Número do Bilhete de Identidade (formato: 123456789LA034)',
    type: 'string',
    example: '123456789LA034',
  })
  @ApiResponse({
    status: 200,
    description: 'Estudante encontrado com este BI',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean', example: true },
        student: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-generated-id' },
            firstName: { type: 'string', example: 'João' },
            lastName: { type: 'string', example: 'Silva' },
            biNumber: { type: 'string', example: '123456789LA034' },
            studentNumber: { type: 'string', example: '2024-0001' },
            academicYear: { type: 'string', example: '2024' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Nenhum estudante encontrado com este BI',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Nenhum estudante encontrado com o BI 123456789LA034' }
      }
    }
  })
  async findByBI(@Param('biNumber') biNumber: string) {
    return await this.studentsService.findByBI(biNumber);
  }

  @Get('statistics')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Obter estatísticas dos alunos',
    description: 'Retorna estatísticas gerais dos alunos incluindo distribuições por status, género, província, etc.'
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    type: StudentStatisticsDto,
  })
  async getStatistics(): Promise<StudentStatisticsDto> {
    return await this.studentsService.getStatistics();
  }

  @Get('export/csv')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Exportar alunos para CSV',
    description: 'Exporta a lista de alunos em formato CSV'
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo CSV gerado com sucesso',
  })
  async exportCsv(@Res() res: Response): Promise<void> {
    const csv = await this.studentsService.exportToCsv();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=alunos.csv');
    res.send(csv);
  }

  @Get('all')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Listar todos os alunos sem paginação',
    description: 'Retorna lista completa de alunos (use com cuidado em bases grandes)'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista completa de alunos',
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
  })
  async findAllComplete(): Promise<Student[]> {
    return await this.studentsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Buscar aluno por ID',
    description: 'Retorna dados completos de um aluno específico incluindo turma, matrículas e faturas pendentes'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do aluno',
    type: 'string',
    example: 'uuid-generated-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Aluno encontrado',
    schema: {
      type: 'object',
      example: {
        id: 'uuid-generated-id',
        firstName: 'João',
        lastName: 'Silva',
        gender: 'MASCULINO',
        birthDate: '2010-05-15T00:00:00.000Z',
        phone: '+244923456789',
        studentNumber: '2024-0001',
        academicYear: '2024',
        classId: 'uuid-da-turma',
        profilePhotoUrl: null,
        guardianName: 'Maria Silva',
        guardianPhone: '+244923456789',
        municipality: 'Luanda',
        province: 'Luanda',
        country: 'Angola',
        parentEmail: 'pais@email.com',
        parentPhone: '+244923456789',
        schoolClass: {
          id: 'uuid-da-turma',
          name: '10ª A',
          year: 2024,
          shift: 'MORNING',
          capacity: 30
        },
        enrollments: [
          {
            id: 'uuid-enrollment',
            year: 2024,
            status: 'ACTIVE'
          }
        ],
        invoices: [
          {
            id: 'uuid-invoice',
            amount: 25000,
            dueDate: '2024-02-01T00:00:00.000Z',
            status: 'PENDENTE'
          }
        ],
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async findOne(@Param('id') id: string): Promise<Student> {
    return await this.studentsService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Atualizar aluno',
    description: 'Atualiza dados de um aluno existente. Todos os campos são opcionais'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do aluno',
    type: 'string',
    example: 'uuid-generated-id',
  })
  @ApiBody({ type: UpdateStudentDto })
  @ApiResponse({
    status: 200,
    description: 'Aluno atualizado com sucesso',
    schema: {
      type: 'object',
      example: {
        id: 'uuid-generated-id',
        firstName: 'João',
        lastName: 'Silva Santos',
        gender: 'MASCULINO',
        birthDate: '2010-05-15T00:00:00.000Z',
        phone: '+244923456789',
        studentNumber: '2024-0001',
        academicYear: '2024',
        classId: 'uuid-da-turma',
        profilePhotoUrl: null,
        guardianName: 'Maria Silva',
        guardianPhone: '+244923456789',
        municipality: 'Luanda',
        province: 'Luanda',
        country: 'Angola',
        parentEmail: 'pais@email.com',
        parentPhone: '+244923456789',
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:05:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Número de matrícula já existe' })
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    return await this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Remover aluno',
    description: 'Remove um aluno do sistema. Só é possível se não houver dependências (matrículas, notas, etc.)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do aluno',
    type: 'string',
    example: 'uuid-generated-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Aluno removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Aluno removido com sucesso' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @ApiResponse({ status: 409, description: 'Aluno possui dependências (matrículas, notas, etc)' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.studentsService.remove(id);
    return { message: 'Aluno removido com sucesso' };
  }

  // Student notes endpoints
  @Post(':id/notes')
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Adicionar anotação pedagógica',
    description: 'Adiciona uma nova anotação pedagógica ao aluno'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do aluno',
    type: 'string',
  })
  @ApiBody({ type: CreateStudentNoteDto })
  @ApiResponse({
    status: 201,
    description: 'Anotação criada com sucesso',
    schema: {
      type: 'object',
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async createNote(
    @Param('id') studentId: string,
    @Body() createNoteDto: CreateStudentNoteDto,
    @Req() req: any,
  ): Promise<StudentNote> {
    return await this.studentsService.createNote(studentId, createNoteDto, req.user.id);
  }

  @Get(':id/notes')
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Listar anotações do aluno',
    description: 'Retorna todas as anotações pedagógicas do aluno'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do aluno',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de anotações retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async getNotes(@Param('id') studentId: string): Promise<StudentNote[]> {
    return await this.studentsService.getNotes(studentId);
  }

  // Timeline endpoints
  @Post(':id/timeline')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Adicionar evento ao histórico',
    description: 'Adiciona um novo evento ao histórico do aluno'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do aluno',
    type: 'string',
  })
  @ApiBody({ type: CreateTimelineEventDto })
  @ApiResponse({
    status: 201,
    description: 'Evento adicionado com sucesso',
    schema: {
      type: 'object',
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async addTimelineEvent(
    @Param('id') studentId: string,
    @Body() createEventDto: CreateTimelineEventDto,
    @Req() req: any,
  ): Promise<StudentTimeline> {
    return await this.studentsService.addTimelineEvent(studentId, createEventDto, req.user.id);
  }

  @Get(':id/timeline')
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ 
    summary: 'Obter histórico do aluno',
    description: 'Retorna o histórico completo de eventos do aluno'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do aluno',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Histórico retornado com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async getTimeline(@Param('id') studentId: string): Promise<StudentTimeline[]> {
    return await this.studentsService.getTimeline(studentId);
  }

  // Invoices endpoint
  @Get(':id/invoices')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Listar faturas do aluno',
    description: 'Retorna todas as faturas do aluno com informações de pagamento'
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do aluno',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async getInvoices(@Param('id') studentId: string) {
    return await this.studentsService.getStudentInvoices(studentId);
  }

}