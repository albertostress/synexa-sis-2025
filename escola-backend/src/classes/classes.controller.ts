/**
 * Classes Controller - Controle de turmas
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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { SchoolClass, SchoolClassWithRelations } from './entities/class.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Criar nova turma' })
  @ApiResponse({
    status: 201,
    description: 'Turma criada com sucesso',
    type: SchoolClassWithRelations,
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma turma com este nome no mesmo ano',
  })
  @ApiResponse({
    status: 400,
    description: 'Número de alunos excede a capacidade da turma ou alunos/professores não encontrados',
  })
  async create(@Body() createClassDto: CreateClassDto): Promise<SchoolClassWithRelations> {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Listar todas as turmas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de turmas retornada com sucesso',
    type: [SchoolClassWithRelations],
  })
  async findAll(): Promise<SchoolClassWithRelations[]> {
    return this.classesService.findAll();
  }

  @Get('by-year')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar turmas por ano letivo' })
  @ApiQuery({ name: 'year', description: 'Ano letivo', example: 2024 })
  @ApiResponse({
    status: 200,
    description: 'Turmas do ano letivo retornadas com sucesso',
    type: [SchoolClass],
  })
  async findByYear(@Query('year', ParseIntPipe) year: number): Promise<SchoolClass[]> {
    return this.classesService.findClassesByYear(year);
  }

  @Get(':id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar turma por ID' })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  @ApiResponse({
    status: 200,
    description: 'Turma encontrada com sucesso',
    type: SchoolClassWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SchoolClassWithRelations> {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Atualizar turma' })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  @ApiResponse({
    status: 200,
    description: 'Turma atualizada com sucesso',
    type: SchoolClassWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Já existe uma turma com este nome no mesmo ano',
  })
  @ApiResponse({
    status: 400,
    description: 'Número de alunos excede a capacidade da turma ou alunos/professores não encontrados',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClassDto: UpdateClassDto,
  ): Promise<SchoolClassWithRelations> {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover turma' })
  @ApiParam({ name: 'id', description: 'ID da turma' })
  @ApiResponse({
    status: 200,
    description: 'Turma removida com sucesso',
    type: SchoolClassWithRelations,
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<SchoolClassWithRelations> {
    return this.classesService.remove(id);
  }
}