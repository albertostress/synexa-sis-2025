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
import { TransportService } from './transport.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { AssignStudentDto, AssignMultipleStudentsDto, UpdateStudentTransportDto } from './dto/assign-student.dto';
import { FilterTransportDto, FilterStudentTransportDto } from './dto/filter-transport.dto';
import { TransportRoute } from './entities/route.entity';
import { StudentTransport } from './entities/student-transport.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Transport')
@Controller('transport')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('routes')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar nova rota de transporte escolar' })
  @ApiResponse({
    status: 201,
    description: 'Rota de transporte criada com sucesso',
    type: TransportRoute,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 409, description: 'Rota com mesmo nome já existe' })
  async createRoute(@Body() createRouteDto: CreateRouteDto) {
    return this.transportService.createRoute(createRouteDto);
  }

  @Get('routes')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Listar todas as rotas de transporte com filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de rotas de transporte com paginação',
    schema: {
      type: 'object',
      properties: {
        routes: {
          type: 'array',
          items: { $ref: '#/components/schemas/TransportRoute' },
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
  async findAllRoutes(@Query() filters: FilterTransportDto) {
    return this.transportService.findAllRoutes(filters);
  }

  @Get('routes/:id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Ver detalhes da rota (paragens + alunos)' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da rota de transporte',
    type: TransportRoute,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Rota não encontrada' })
  async findRouteById(@Param('id') id: string) {
    return this.transportService.findRouteById(id);
  }

  @Patch('routes/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Editar rota (veículo, condutor, horários)' })
  @ApiResponse({
    status: 200,
    description: 'Rota de transporte atualizada com sucesso',
    type: TransportRoute,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Rota não encontrada' })
  @ApiResponse({ status: 409, description: 'Conflito com nome de rota existente' })
  async updateRoute(
    @Param('id') id: string,
    @Body() updateRouteDto: Partial<CreateRouteDto>,
  ) {
    return this.transportService.updateRoute(id, updateRouteDto);
  }

  @Delete('routes/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Apagar rota de transporte' })
  @ApiResponse({
    status: 200,
    description: 'Rota de transporte eliminada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Rota tem alunos atribuídos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Rota não encontrada' })
  async deleteRoute(@Param('id') id: string) {
    return this.transportService.deleteRoute(id);
  }

  @Post('routes/:id/students')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Atribuir alunos à rota' })
  @ApiResponse({
    status: 201,
    description: 'Alunos atribuídos à rota com sucesso',
    type: [StudentTransport],
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou paragem não existe' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Rota ou aluno não encontrado' })
  @ApiResponse({ status: 409, description: 'Aluno já tem transporte atribuído' })
  async assignStudentsToRoute(
    @Param('id') routeId: string,
    @Body() assignDto: AssignMultipleStudentsDto,
  ) {
    return this.transportService.assignStudentsToRoute(routeId, assignDto);
  }

  @Get('students/:id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Consultar rota e paragem de um aluno' })
  @ApiResponse({
    status: 200,
    description: 'Informações de transporte do aluno',
    type: StudentTransport,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Aluno não tem transporte atribuído' })
  async getStudentTransport(@Param('id') studentId: string) {
    return this.transportService.getStudentTransport(studentId);
  }

  @Put('students/:id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Atualizar transporte do aluno (paragem ou notas)' })
  @ApiResponse({
    status: 200,
    description: 'Transporte do aluno atualizado com sucesso',
    type: StudentTransport,
  })
  @ApiResponse({ status: 400, description: 'Paragem não existe na rota' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Aluno não tem transporte atribuído' })
  async updateStudentTransport(
    @Param('id') studentId: string,
    @Body() updateDto: UpdateStudentTransportDto,
  ) {
    return this.transportService.updateStudentTransport(studentId, updateDto);
  }

  @Delete('students/:id')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({ summary: 'Remover aluno do transporte' })
  @ApiResponse({
    status: 200,
    description: 'Aluno removido do transporte com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Aluno não tem transporte atribuído' })
  async removeStudentFromTransport(@Param('id') studentId: string) {
    return this.transportService.removeStudentFromTransport(studentId);
  }

  @Get('students')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({ summary: 'Listar todos os alunos com transporte atribuído' })
  @ApiResponse({
    status: 200,
    description: 'Lista de alunos com transporte e paginação',
    schema: {
      type: 'object',
      properties: {
        transports: {
          type: 'array',
          items: { $ref: '#/components/schemas/StudentTransport' },
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
  async findAllStudentTransports(@Query() filters: FilterStudentTransportDto) {
    return this.transportService.findAllStudentTransports(filters);
  }
}