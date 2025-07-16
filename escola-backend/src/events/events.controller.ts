import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';
import { RegisterParticipationDto, RegisterMultipleParticipationsDto, RegisterClassParticipationDto, UpdateParticipationDto, BatchUpdatePresenceDto } from './dto/register-participation.dto';
import { FilterEventsDto, FilterParticipantsDto } from './dto/filter-events.dto';
import { Event } from './entities/event.entity';
import { EventParticipation } from './entities/event-participation.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar novo evento' })
  @ApiResponse({
    status: 201,
    description: 'Evento criado com sucesso',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou data no passado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 409, description: 'Evento com mesmo título na mesma data já existe' })
  async createEvent(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.createEvent(createEventDto);
  }

  @Get()
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Listar eventos com filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos com paginação e estatísticas',
    schema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: { $ref: '#/components/schemas/Event' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async findAllEvents(@Query() filters: FilterEventsDto) {
    return this.eventsService.findAllEvents(filters);
  }

  @Get(':id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Ver detalhes de um evento' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do evento com participantes',
    type: Event,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  async findEventById(@Param('id') id: string) {
    return this.eventsService.findEventById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Editar evento' })
  @ApiResponse({
    status: 200,
    description: 'Evento atualizado com sucesso',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou data no passado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito com evento existente' })
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(id, updateEventDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Apagar evento' })
  @ApiResponse({
    status: 200,
    description: 'Evento eliminado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Evento já ocorreu ou tem participantes' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  async deleteEvent(@Param('id') id: string) {
    return this.eventsService.deleteEvent(id);
  }

  @Post(':id/participate')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Registar alunos no evento' })
  @ApiResponse({
    status: 201,
    description: 'Alunos registados no evento com sucesso',
    type: [EventParticipation],
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Evento ou aluno não encontrado' })
  @ApiResponse({ status: 409, description: 'Aluno já está registado no evento' })
  async registerParticipations(
    @Param('id') eventId: string,
    @Body() registerDto: RegisterMultipleParticipationsDto,
  ) {
    return this.eventsService.registerParticipations(eventId, registerDto);
  }

  @Post(':id/participate/class')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Registar turma inteira no evento' })
  @ApiResponse({
    status: 201,
    description: 'Turma registada no evento com sucesso',
    type: [EventParticipation],
  })
  @ApiResponse({ status: 400, description: 'Turma não tem alunos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Evento ou turma não encontrado' })
  @ApiResponse({ status: 409, description: 'Alunos já estão registados no evento' })
  async registerClassParticipation(
    @Param('id') eventId: string,
    @Body() registerDto: RegisterClassParticipationDto,
  ) {
    return this.eventsService.registerClassParticipation(eventId, registerDto);
  }

  @Get(':id/participants')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Ver lista de participantes do evento' })
  @ApiResponse({
    status: 200,
    description: 'Lista de participantes com paginação e estatísticas',
    schema: {
      type: 'object',
      properties: {
        participants: {
          type: 'array',
          items: { $ref: '#/components/schemas/EventParticipation' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
          },
        },
        stats: {
          type: 'object',
          properties: {
            totalParticipants: { type: 'number' },
            totalPresent: { type: 'number' },
            totalAbsent: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  async getEventParticipants(
    @Param('id') eventId: string,
    @Query() filters: FilterParticipantsDto,
  ) {
    return this.eventsService.getEventParticipants(eventId, filters);
  }

  @Put('participation/:id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Atualizar participação (presença e notas)' })
  @ApiResponse({
    status: 200,
    description: 'Participação atualizada com sucesso',
    type: EventParticipation,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Participação não encontrada' })
  async updateParticipation(
    @Param('id') participationId: string,
    @Body() updateDto: UpdateParticipationDto,
  ) {
    return this.eventsService.updateParticipation(participationId, updateDto);
  }

  @Put(':id/presence/batch')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Atualizar presença em lote' })
  @ApiResponse({
    status: 200,
    description: 'Presenças atualizadas com sucesso',
    type: [EventParticipation],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Evento ou participação não encontrado' })
  async batchUpdatePresence(
    @Param('id') eventId: string,
    @Body() batchUpdateDto: BatchUpdatePresenceDto,
  ) {
    return this.eventsService.batchUpdatePresence(eventId, batchUpdateDto);
  }

  @Delete('participation/:id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Remover participação do evento' })
  @ApiResponse({
    status: 200,
    description: 'Participação removida com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Evento já ocorreu' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Participação não encontrada' })
  async removeParticipation(@Param('id') participationId: string) {
    return this.eventsService.removeParticipation(participationId);
  }

  @Get('student/:id/events')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({ summary: 'Ver eventos de um aluno específico' })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos do aluno com estatísticas',
    schema: {
      type: 'object',
      properties: {
        student: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        participations: {
          type: 'array',
          items: { $ref: '#/components/schemas/EventParticipation' },
        },
        totalEvents: { type: 'number' },
        totalPresent: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  async getStudentEvents(@Param('id') studentId: string) {
    return this.eventsService.getStudentEvents(studentId);
  }
}