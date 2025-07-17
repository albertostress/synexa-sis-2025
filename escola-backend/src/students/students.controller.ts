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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from '@prisma/client';
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
        bloodType: 'O+',
        studentNumber: 'STD2024001',
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
    summary: 'Listar todos os alunos',
    description: 'Retorna lista completa de alunos com informações da turma'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alunos retornada com sucesso',
    schema: {
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
          bloodType: 'O+',
          studentNumber: 'STD2024001',
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
  })
  async findAll(): Promise<Student[]> {
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
        bloodType: 'O+',
        studentNumber: 'STD2024001',
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
        bloodType: 'O+',
        studentNumber: 'STD2024001',
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
}