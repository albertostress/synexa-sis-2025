import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Criar novo horário' })
  @ApiResponse({ status: 201, description: 'Horário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get()
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ summary: 'Listar todos os horários' })
  @ApiResponse({ status: 200, description: 'Lista de horários' })
  @ApiQuery({ name: 'teacherId', required: false, description: 'Filtrar por professor' })
  @ApiQuery({ name: 'weekday', required: false, description: 'Filtrar por dia da semana' })
  @ApiQuery({ name: 'subjectId', required: false, description: 'Filtrar por disciplina' })
  findAll(
    @Query('teacherId') teacherId?: string,
    @Query('weekday') weekday?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.schedulesService.findAll(teacherId, weekday, subjectId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ summary: 'Buscar horário por ID' })
  @ApiResponse({ status: 200, description: 'Horário encontrado' })
  @ApiResponse({ status: 404, description: 'Horário não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do horário' })
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Atualizar horário' })
  @ApiResponse({ status: 200, description: 'Horário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Horário não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  @ApiParam({ name: 'id', description: 'ID do horário' })
  update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Remover horário' })
  @ApiResponse({ status: 200, description: 'Horário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Horário não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do horário' })
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }

  @Get('teacher/:teacherId')
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ summary: 'Buscar horários de um professor específico' })
  @ApiResponse({ status: 200, description: 'Horários do professor' })
  @ApiResponse({ status: 404, description: 'Professor não encontrado' })
  @ApiParam({ name: 'teacherId', description: 'ID do professor' })
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.schedulesService.findByTeacher(teacherId);
  }

  @Get('conflicts/:teacherId')
  @Roles('ADMIN', 'SECRETARIA', 'PROFESSOR')
  @ApiOperation({ summary: 'Verificar conflitos de horário para um professor' })
  @ApiResponse({ status: 200, description: 'Lista de conflitos' })
  @ApiParam({ name: 'teacherId', description: 'ID do professor' })
  @ApiQuery({ name: 'weekday', required: true, description: 'Dia da semana' })
  @ApiQuery({ name: 'startTime', required: true, description: 'Horário de início' })
  @ApiQuery({ name: 'endTime', required: true, description: 'Horário de fim' })
  checkConflicts(
    @Param('teacherId') teacherId: string,
    @Query('weekday') weekday: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.schedulesService.checkConflicts(teacherId, weekday, startTime, endTime);
  }
}