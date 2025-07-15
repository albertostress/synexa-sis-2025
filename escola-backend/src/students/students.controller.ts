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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from '@prisma/client';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo aluno' })
  @ApiBody({ type: CreateStudentDto })
  @ApiResponse({
    status: 201,
    description: 'Aluno criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-generated-id' },
        name: { type: 'string', example: 'João Silva' },
        email: { type: 'string', example: 'joao.silva@email.com' },
        birthDate: { type: 'string', example: '2000-01-15T00:00:00.000Z' },
        createdAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createStudentDto: CreateStudentDto): Promise<Student> {
    return await this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os alunos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de alunos retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-generated-id' },
          name: { type: 'string', example: 'João Silva' },
          email: { type: 'string', example: 'joao.silva@email.com' },
          birthDate: { type: 'string', example: '2000-01-15T00:00:00.000Z' },
          createdAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
        },
      },
    },
  })
  async findAll(): Promise<Student[]> {
    return await this.studentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar aluno por ID' })
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
      properties: {
        id: { type: 'string', example: 'uuid-generated-id' },
        name: { type: 'string', example: 'João Silva' },
        email: { type: 'string', example: 'joao.silva@email.com' },
        birthDate: { type: 'string', example: '2000-01-15T00:00:00.000Z' },
        createdAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async findOne(@Param('id') id: string): Promise<Student> {
    return await this.studentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar aluno' })
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
      properties: {
        id: { type: 'string', example: 'uuid-generated-id' },
        name: { type: 'string', example: 'João Silva Santos' },
        email: { type: 'string', example: 'joao.santos@email.com' },
        birthDate: { type: 'string', example: '2000-01-15T00:00:00.000Z' },
        createdAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    return await this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover aluno' })
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
        id: { type: 'string', example: 'uuid-generated-id' },
        name: { type: 'string', example: 'João Silva' },
        email: { type: 'string', example: 'joao.silva@email.com' },
        birthDate: { type: 'string', example: '2000-01-15T00:00:00.000Z' },
        createdAt: { type: 'string', example: '2024-01-01T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async remove(@Param('id') id: string): Promise<Student> {
    return await this.studentsService.remove(id);
  }
}