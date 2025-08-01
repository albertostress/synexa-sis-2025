/**
 * Communication Controller - Controlador de comunicação interna
 * Referência: context7 mcp - NestJS Controllers Pattern
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { ReplyThreadDto } from './dto/reply-thread.dto';
import { FilterThreadsDto } from './dto/filter-threads.dto';
import {
  MessageEntity,
  MessageListResponse,
  MessageStatsEntity,
} from './entities/message.entity';
import {
  ThreadEntity,
  ThreadDetailEntity,
  ThreadListResponse,
  ThreadParticipantEntity,
  ThreadMessageEntity,
} from './entities/thread.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Communication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('messages')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Criar nova mensagem',
    description: 'Cria uma nova mensagem interna para envio aos destinatários especificados' 
  })
  @ApiResponse({
    status: 201,
    description: 'Mensagem criada com sucesso',
    type: MessageEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou nenhum destinatário encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para criar mensagens',
  })
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: any,
  ) {
    return this.communicationService.createMessage(createMessageDto, req.user.id);
  }

  @Get('inbox')
  @ApiOperation({ 
    summary: 'Listar mensagens da caixa de entrada',
    description: 'Retorna as mensagens destinadas ao usuário autenticado com filtros opcionais' 
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensagens retornada com sucesso',
    type: MessageListResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  async getInboxMessages(
    @Query() filters: FilterMessagesDto,
    @Request() req: any,
  ) {
    return this.communicationService.findUserMessages(req.user.id, filters);
  }

  @Get('messages/:id')
  @ApiOperation({ 
    summary: 'Buscar mensagem específica',
    description: 'Retorna os detalhes completos de uma mensagem específica' 
  })
  @ApiParam({
    name: 'id',
    description: 'ID da mensagem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem encontrada com sucesso',
    type: MessageEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Mensagem não encontrada',
  })
  async getMessage(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.communicationService.findMessage(id, req.user.id);
  }

  @Post('messages/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Marcar mensagem como lida',
    description: 'Marca uma mensagem específica como lida pelo usuário autenticado' 
  })
  @ApiParam({
    name: 'id',
    description: 'ID da mensagem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem marcada como lida com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Mensagem marcada como lida' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Mensagem não encontrada ou usuário sem acesso',
  })
  async markMessageAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.communicationService.markAsRead(id, req.user.id);
  }

  @Put('messages/:id')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Atualizar mensagem',
    description: 'Atualiza uma mensagem existente (apenas criador, admin ou diretor)' 
  })
  @ApiParam({
    name: 'id',
    description: 'ID da mensagem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem atualizada com sucesso',
    type: MessageEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar esta mensagem',
  })
  @ApiResponse({
    status: 404,
    description: 'Mensagem não encontrada',
  })
  async updateMessage(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req: any,
  ) {
    return this.communicationService.updateMessage(
      id,
      updateMessageDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('messages/:id')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Deletar mensagem',
    description: 'Deleta uma mensagem (soft delete - apenas criador, admin ou diretor)' 
  })
  @ApiParam({
    name: 'id',
    description: 'ID da mensagem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem deletada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Mensagem deletada com sucesso' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar esta mensagem',
  })
  @ApiResponse({
    status: 404,
    description: 'Mensagem não encontrada',
  })
  async deleteMessage(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.communicationService.deleteMessage(id, req.user.id, req.user.role);
  }

  @Get('stats')
  @Roles('ADMIN', 'DIRETOR')
  @ApiOperation({ 
    summary: 'Obter estatísticas de mensagens',
    description: 'Retorna estatísticas gerais sobre mensagens (apenas admin e diretor)' 
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    type: MessageStatsEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar estatísticas',
  })
  async getMessageStats(@Request() req: any) {
    return this.communicationService.getMessageStats(req.user.role);
  }

  // Endpoint auxiliar para buscar mensagens enviadas pelo usuário
  @Get('sent')
  @Roles('ADMIN', 'DIRETOR', 'SECRETARIA')
  @ApiOperation({ 
    summary: 'Listar mensagens enviadas',
    description: 'Retorna as mensagens enviadas pelo usuário autenticado' 
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página para paginação',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de itens por página',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensagens enviadas retornada com sucesso',
    type: MessageListResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para acessar mensagens enviadas',
  })
  async getSentMessages(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Request() req: any,
  ) {
    return this.communicationService.findSentMessages(req.user.id, { page, limit });
  }

  // =============================================
  // ENDPOINTS PARA SISTEMA DE THREADS/CONVERSAS
  // =============================================

  @Post('threads')
  @ApiOperation({ 
    summary: 'Criar nova conversa/thread',
    description: 'Cria uma nova conversa entre múltiplos participantes com a primeira mensagem' 
  })
  @ApiResponse({
    status: 201,
    description: 'Conversa criada com sucesso',
    type: ThreadEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou participantes não encontrados',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  async createThread(
    @Body() createThreadDto: CreateThreadDto,
    @Request() req: any,
  ) {
    return this.communicationService.createThread(createThreadDto, req.user.id);
  }

  @Get('threads')
  @ApiOperation({ 
    summary: 'Listar conversas do usuário',
    description: 'Retorna todas as conversas/threads do usuário autenticado com filtros opcionais' 
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversas retornada com sucesso',
    type: ThreadListResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  async getUserThreads(
    @Query() filters: FilterThreadsDto,
    @Request() req: any,
  ) {
    return this.communicationService.getUserThreads(req.user.id, filters);
  }

  @Get('threads/:id')
  @ApiOperation({ 
    summary: 'Buscar conversa específica',
    description: 'Retorna os detalhes completos de uma conversa com todas as mensagens' 
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conversa',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversa encontrada com sucesso',
    type: ThreadDetailEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversa não encontrada ou usuário sem acesso',
  })
  async getThread(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.communicationService.getThreadById(id, req.user.id);
  }

  @Post('threads/:id/reply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Responder em conversa',
    description: 'Envia uma nova mensagem de resposta em uma conversa existente' 
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conversa',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Resposta enviada com sucesso',
    type: ThreadMessageEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversa não encontrada ou usuário sem acesso',
  })
  async replyToThread(
    @Param('id') id: string,
    @Body() replyThreadDto: ReplyThreadDto,
    @Request() req: any,
  ) {
    return this.communicationService.replyToThread(id, replyThreadDto, req.user.id);
  }

  @Post('threads/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Marcar conversa como lida',
    description: 'Marca todas as mensagens não lidas de uma conversa como lidas pelo usuário autenticado' 
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conversa',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversa marcada como lida com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '3 mensagens marcadas como lidas' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversa não encontrada ou usuário sem acesso',
  })
  async markThreadAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.communicationService.markThreadAsRead(id, req.user.id);
  }

  @Get('threads/:id/participants')
  @ApiOperation({ 
    summary: 'Listar participantes da conversa',
    description: 'Retorna todos os participantes de uma conversa específica' 
  })
  @ApiParam({
    name: 'id',
    description: 'ID da conversa',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de participantes retornada com sucesso',
    type: [ThreadParticipantEntity],
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversa não encontrada ou usuário sem acesso',
  })
  async getThreadParticipants(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.communicationService.getThreadParticipants(id, req.user.id);
  }
}