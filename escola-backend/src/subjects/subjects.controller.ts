/**
 * Subjects Controller - Controle de disciplinas
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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Subject, SubjectWithTeachers } from './entities/subject.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Criar nova disciplina' })
  @ApiResponse({
    status: 201,
    description: 'Disciplina criada com sucesso',
    type: SubjectWithTeachers,
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma disciplina com este nome',
  })
  @ApiResponse({
    status: 400,
    description: 'Um ou mais professores não foram encontrados',
  })
  async create(@Body() createSubjectDto: CreateSubjectDto): Promise<SubjectWithTeachers> {
    return this.subjectsService.create(createSubjectDto);
  }

  @Get()
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Listar todas as disciplinas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de disciplinas retornada com sucesso',
    type: [SubjectWithTeachers],
  })
  async findAll(): Promise<SubjectWithTeachers[]> {
    return this.subjectsService.findAll();
  }

  @Get('my-subjects')
  @Roles('PROFESSOR')
  @ApiOperation({ summary: 'Ver disciplinas do professor logado' })
  @ApiResponse({
    status: 200,
    description: 'Disciplinas do professor retornadas com sucesso',
    type: [Subject],
  })
  async getMySubjects(@CurrentUser() user: CurrentUserData): Promise<Subject[]> {
    // Primeiro, precisamos buscar o teacher pelo userId
    const teacher = await this.subjectsService['prisma'].teacher.findUnique({
      where: { userId: user.id },
    });

    if (!teacher) {
      throw new Error('Professor não encontrado para este usuário');
    }

    return this.subjectsService.findSubjectsByTeacher(teacher.id);
  }

  @Get(':id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Buscar disciplina por ID' })
  @ApiParam({ name: 'id', description: 'ID da disciplina' })
  @ApiResponse({
    status: 200,
    description: 'Disciplina encontrada com sucesso',
    type: SubjectWithTeachers,
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SubjectWithTeachers> {
    return this.subjectsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Atualizar disciplina' })
  @ApiParam({ name: 'id', description: 'ID da disciplina' })
  @ApiResponse({
    status: 200,
    description: 'Disciplina atualizada com sucesso',
    type: SubjectWithTeachers,
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma disciplina com este nome',
  })
  @ApiResponse({
    status: 400,
    description: 'Um ou mais professores não foram encontrados',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ): Promise<SubjectWithTeachers> {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'DIRETOR')
  @ApiOperation({ summary: 'Remover disciplina' })
  @ApiParam({ name: 'id', description: 'ID da disciplina' })
  @ApiResponse({
    status: 200,
    description: 'Disciplina removida com sucesso',
    type: SubjectWithTeachers,
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<SubjectWithTeachers> {
    return this.subjectsService.remove(id);
  }
}