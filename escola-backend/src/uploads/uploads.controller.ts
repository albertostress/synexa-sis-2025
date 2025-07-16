/**
 * Uploads Controller - Controlador para upload de arquivos
 * Endpoints REST para upload, download e gestão de arquivos
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Body,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';

// Type for Multer file
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
import { UploadsService } from './uploads.service';
import { FilterUploadsDto, FileListResponse } from './dto/filter-uploads.dto';
import { UploadFileDto, UploadResponse } from './dto/upload-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('student/:id')
  @Roles('ADMIN', 'SECRETARIA')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload de arquivo associado a aluno',
    description: 'Permite upload de arquivos (PDF, JPG, PNG, DOCX) para aluno específico. Máximo 10MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo para upload (PDF, JPG, PNG, DOCX)',
        },
        type: {
          type: 'string',
          enum: ['MATRICULA', 'ATESTADO', 'AVALIACAO', 'HISTORICO', 'EXAME_MEDICO', 'OUTRO'],
          description: 'Tipo/categoria do arquivo',
        },
        description: {
          type: 'string',
          description: 'Descrição opcional do arquivo',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiParam({
    name: 'id',
    description: 'ID do aluno',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivo enviado com sucesso',
    type: UploadResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou dados incorretos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para upload (apenas ADMIN/SECRETARIA)',
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async uploadStudentFile(
    @Param('id', ParseUUIDPipe) studentId: string,
    @UploadedFile() file: MulterFile,
    @Body() uploadData: UploadFileDto,
    @Request() req: any,
  ): Promise<UploadResponse> {
    const uploaderId = req.user.id;
    return this.uploadsService.uploadStudentFile(studentId, file, uploadData, uploaderId);
  }

  @Post('teacher/:id')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload de arquivo associado a professor',
    description: 'Permite upload de arquivos (PDF, JPG, PNG, DOCX) para professor específico. Máximo 10MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo para upload (PDF, JPG, PNG, DOCX)',
        },
        type: {
          type: 'string',
          enum: ['MATRICULA', 'ATESTADO', 'AVALIACAO', 'HISTORICO', 'EXAME_MEDICO', 'OUTRO'],
          description: 'Tipo/categoria do arquivo',
        },
        description: {
          type: 'string',
          description: 'Descrição opcional do arquivo',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiParam({
    name: 'id',
    description: 'ID do professor',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivo enviado com sucesso',
    type: UploadResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou dados incorretos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para upload (apenas ADMIN)',
  })
  @ApiResponse({
    status: 404,
    description: 'Professor não encontrado',
  })
  async uploadTeacherFile(
    @Param('id', ParseUUIDPipe) teacherId: string,
    @UploadedFile() file: MulterFile,
    @Body() uploadData: UploadFileDto,
    @Request() req: any,
  ): Promise<UploadResponse> {
    const uploaderId = req.user.id;
    return this.uploadsService.uploadTeacherFile(teacherId, file, uploadData, uploaderId);
  }

  @Get(':entity/:id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({
    summary: 'Listar arquivos por aluno ou professor',
    description: 'Retorna lista paginada de arquivos associados a aluno ou professor específico',
  })
  @ApiParam({
    name: 'entity',
    description: 'Tipo de entidade (student ou teacher)',
    enum: ['student', 'teacher'],
  })
  @ApiParam({
    name: 'id',
    description: 'ID da entidade',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['MATRICULA', 'ATESTADO', 'AVALIACAO', 'HISTORICO', 'EXAME_MEDICO', 'OUTRO'],
    description: 'Filtrar por tipo de arquivo',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nome do arquivo',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data de início (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data de fim (ISO string)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de arquivos retornada com sucesso',
    type: FileListResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para listar arquivos',
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos',
  })
  async listFiles(
    @Param('entity') entity: 'student' | 'teacher',
    @Param('id', ParseUUIDPipe) entityId: string,
    @Query() filters: FilterUploadsDto,
  ): Promise<FileListResponse> {
    if (entity !== 'student' && entity !== 'teacher') {
      throw new Error('Entidade deve ser "student" ou "teacher"');
    }

    return this.uploadsService.listFiles(entity, entityId, filters);
  }

  @Get('file/:fileId/download')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({
    summary: 'Download de arquivo',
    description: 'Faz download do arquivo específico com Content-Disposition apropriado',
  })
  @ApiParam({
    name: 'fileId',
    description: 'ID do arquivo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo retornado com sucesso',
    headers: {
      'Content-Type': {
        description: 'Tipo MIME do arquivo',
      },
      'Content-Disposition': {
        description: 'Attachment com nome original do arquivo',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para download',
  })
  @ApiResponse({
    status: 404,
    description: 'Arquivo não encontrado',
  })
  async downloadFile(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { file, originalName, mimeType } = await this.uploadsService.getFileForDownload(fileId);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.send(file);
  }

  @Delete('file/:fileId')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Apagar arquivo',
    description: 'Remove arquivo do servidor e do banco de dados',
  })
  @ApiParam({
    name: 'fileId',
    description: 'ID do arquivo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo deletado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Arquivo deletado com sucesso',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para deletar (apenas ADMIN)',
  })
  @ApiResponse({
    status: 404,
    description: 'Arquivo não encontrado',
  })
  async deleteFile(
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<{ message: string }> {
    return this.uploadsService.deleteFile(fileId);
  }

  @Get('file/:fileId')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR')
  @ApiOperation({
    summary: 'Obter informações do arquivo',
    description: 'Retorna metadados do arquivo sem fazer download',
  })
  @ApiParam({
    name: 'fileId',
    description: 'ID do arquivo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações do arquivo retornadas com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para visualizar arquivo',
  })
  @ApiResponse({
    status: 404,
    description: 'Arquivo não encontrado',
  })
  async getFileInfo(@Param('fileId', ParseUUIDPipe) fileId: string) {
    return this.uploadsService.getFileById(fileId);
  }
}