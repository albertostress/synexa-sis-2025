/**
 * Parents Portal Controller - Endpoints para portal dos pais
 * Referência: context7 mcp - NestJS Controllers Pattern
 */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ParentsPortalService } from './parents-portal.service';
import { ParentAuthGuard } from './guards/parent-auth.guard';
import { ViewGradesDto } from './dto/view-grades.dto';
import { ViewPaymentsDto } from './dto/view-payments.dto';
import {
  ParentEntity,
  StudentGradesEntity,
  StudentPaymentsEntity,
  MessageEntity,
  DocumentEntity,
} from './entities/parent.entity';

interface AuthRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@ApiTags('parents-portal')
@Controller('parents-portal')
@UseGuards(ParentAuthGuard)
@ApiBearerAuth()
export class ParentsPortalController {
  constructor(private readonly parentsPortalService: ParentsPortalService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil do responsável e filhos' })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtido com sucesso',
    type: ParentEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Responsável não encontrado',
  })
  async getProfile(@Req() req: AuthRequest): Promise<ParentEntity> {
    const parentId = req.user.sub;
    return await this.parentsPortalService.getParentProfile(parentId);
  }

  @Get('student/:studentId/grades')
  @ApiOperation({ summary: 'Obter notas de um filho específico' })
  @ApiParam({
    name: 'studentId',
    description: 'ID do aluno/filho',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'year',
    description: 'Ano letivo (opcional)',
    example: 2024,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Notas obtidas com sucesso',
    type: StudentGradesEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado para este aluno',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async getStudentGrades(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() viewGradesDto: ViewGradesDto,
  ): Promise<StudentGradesEntity> {
    const parentId = req.user.sub;
    return await this.parentsPortalService.getStudentGrades(
      parentId,
      studentId,
      viewGradesDto,
    );
  }

  @Get('student/:studentId/payments')
  @ApiOperation({ summary: 'Obter informações financeiras de um filho específico' })
  @ApiParam({
    name: 'studentId',
    description: 'ID do aluno/filho',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'year',
    description: 'Ano letivo (opcional)',
    example: 2024,
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Status do pagamento (opcional)',
    enum: ['ALL', 'PENDENTE', 'PAGA', 'VENCIDA'],
    example: 'PENDENTE',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limite de registros (opcional, padrão: 20)',
    example: 20,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Informações de pagamento obtidas com sucesso',
    type: StudentPaymentsEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado para este aluno',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async getStudentPayments(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() viewPaymentsDto: ViewPaymentsDto,
  ): Promise<StudentPaymentsEntity> {
    const parentId = req.user.sub;
    return await this.parentsPortalService.getStudentPayments(
      parentId,
      studentId,
      viewPaymentsDto,
    );
  }

  @Get('student/:studentId/documents')
  @ApiOperation({ summary: 'Obter documentos de um filho específico' })
  @ApiParam({
    name: 'studentId',
    description: 'ID do aluno/filho',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentos obtidos com sucesso',
    type: [DocumentEntity],
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado para este aluno',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async getStudentDocuments(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<DocumentEntity[]> {
    const parentId = req.user.sub;
    return await this.parentsPortalService.getStudentDocuments(parentId, studentId);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Obter comunicados da escola' })
  @ApiResponse({
    status: 200,
    description: 'Comunicados obtidos com sucesso',
    type: [MessageEntity],
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Responsável não encontrado',
  })
  async getSchoolMessages(@Req() req: AuthRequest): Promise<MessageEntity[]> {
    const parentId = req.user.sub;
    return await this.parentsPortalService.getSchoolMessages(parentId);
  }

  @Get('student/:studentId/docs/:docId/download')
  @ApiOperation({ summary: 'Fazer download de documento específico do filho' })
  @ApiParam({
    name: 'studentId',
    description: 'ID do aluno/filho',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'docId',
    description: 'ID do documento',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Download iniciado com sucesso',
    content: {
      'application/pdf': {},
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado para este documento',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento não encontrado',
  })
  async downloadDocument(
    @Req() req: AuthRequest,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Res() res: Response,
  ): Promise<void> {
    const parentId = req.user.sub;
    return await this.parentsPortalService.downloadDocument(
      parentId,
      studentId,
      docId,
      res,
    );
  }
}