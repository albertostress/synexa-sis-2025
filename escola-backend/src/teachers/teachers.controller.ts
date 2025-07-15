/**
 * Teachers Controller - Endpoints de gerenciamento de professores
 * Referência: context7 mcp - NestJS Controllers Pattern
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherWithUser } from './entities/teacher.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('teachers')
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Criar novo professor' })
  @ApiResponse({
    status: 201,
    description: 'Professor criado com sucesso',
    type: TeacherWithUser,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou usuário não é PROFESSOR' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Professor já existe para este usuário' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - role insuficiente' })
  async create(@Body() createTeacherDto: CreateTeacherDto): Promise<TeacherWithUser> {
    return await this.teachersService.create(createTeacherDto);
  }

  @Get()
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Listar todos os professores' })
  @ApiResponse({
    status: 200,
    description: 'Lista de professores retornada com sucesso',
    type: [TeacherWithUser],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - role insuficiente' })
  async findAll(): Promise<TeacherWithUser[]> {
    return await this.teachersService.findAll();
  }

  @Get('profile')
  @Roles('PROFESSOR')
  @ApiOperation({ summary: 'Ver perfil do professor logado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do professor retornado com sucesso',
    type: TeacherWithUser,
  })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas professores' })
  async getProfile(@CurrentUser() user: CurrentUserData): Promise<TeacherWithUser> {
    const teacher = await this.teachersService.findByUserId(user.id);
    if (!teacher) {
      throw new Error('Professor não encontrado para este usuário');
    }
    return teacher;
  }

  @Get(':id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Buscar professor por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID único do professor',
    type: 'string',
    example: 'teacher-uuid-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Professor encontrado',
    type: TeacherWithUser,
  })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - role insuficiente' })
  async findOne(@Param('id') id: string): Promise<TeacherWithUser> {
    return await this.teachersService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Atualizar professor' })
  @ApiParam({
    name: 'id',
    description: 'ID único do professor',
    type: 'string',
    example: 'teacher-uuid-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Professor atualizado com sucesso',
    type: TeacherWithUser,
  })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - role insuficiente' })
  async update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ): Promise<TeacherWithUser> {
    return await this.teachersService.update(id, updateTeacherDto);
  }

  @Put('profile')
  @Roles('PROFESSOR')
  @ApiOperation({ summary: 'Atualizar perfil do professor logado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: TeacherWithUser,
  })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas professores' })
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ): Promise<TeacherWithUser> {
    const teacher = await this.teachersService.findByUserId(user.id);
    if (!teacher) {
      throw new Error('Professor não encontrado para este usuário');
    }
    return await this.teachersService.update(teacher.id, updateTeacherDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover professor' })
  @ApiParam({
    name: 'id',
    description: 'ID único do professor',
    type: 'string',
    example: 'teacher-uuid-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Professor removido com sucesso',
    type: TeacherWithUser,
  })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas ADMIN' })
  async remove(@Param('id') id: string): Promise<TeacherWithUser> {
    return await this.teachersService.remove(id);
  }
}