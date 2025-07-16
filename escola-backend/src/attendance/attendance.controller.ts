/**
 * Attendance Controller - Endpoints para controle de presença
 * Referência: context7 mcp - NestJS Controllers Pattern
 */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
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
  ApiBody,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ListAttendanceDto } from './dto/list-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import {
  AttendanceEntity,
  StudentAttendanceSummary,
  AttendanceListResponse,
  ClassAttendanceReport,
} from './entities/attendance.entity';

interface AuthRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('mark')
  @Roles('PROFESSOR', 'SECRETARIA', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar presenças da turma' })
  @ApiBody({ type: MarkAttendanceDto })
  @ApiResponse({
    status: 201,
    description: 'Presenças registradas com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Chamada registrada com sucesso' },
        created: { type: 'number', example: 20 },
        updated: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou data futura',
  })
  @ApiResponse({
    status: 403,
    description: 'Professor não leciona esta disciplina/turma',
  })
  @ApiResponse({
    status: 404,
    description: 'Turma, disciplina ou alunos não encontrados',
  })
  @ApiResponse({
    status: 409,
    description: 'Chamada já registrada para esta data/turma/disciplina',
  })
  async markAttendance(
    @Body() markAttendanceDto: MarkAttendanceDto,
    @Req() req: AuthRequest,
  ): Promise<{ message: string; created: number; updated: number }> {
    return await this.attendanceService.markAttendance(
      markAttendanceDto,
      req.user.sub,
      req.user.role,
    );
  }

  @Get('class/:classId')
  @Roles('PROFESSOR', 'SECRETARIA', 'ADMIN', 'DIRETOR')
  @ApiOperation({ summary: 'Ver presenças da turma' })
  @ApiParam({
    name: 'classId',
    description: 'ID da turma',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'date',
    description: 'Data da chamada',
    example: '2024-08-15',
    required: true,
  })
  @ApiQuery({
    name: 'subjectId',
    description: 'ID da disciplina (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório de presenças da turma',
    type: ClassAttendanceReport,
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  async getClassAttendance(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('date') date: string,
    @Query('subjectId') subjectId?: string,
  ): Promise<ClassAttendanceReport> {
    return await this.attendanceService.getClassAttendance(classId, date, subjectId);
  }

  @Get('student/:studentId')
  @Roles('PROFESSOR', 'SECRETARIA', 'ADMIN', 'DIRETOR')
  @ApiOperation({ summary: 'Ver frequência do aluno' })
  @ApiParam({
    name: 'studentId',
    description: 'ID do aluno',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Data inicial (opcional)',
    example: '2024-08-01',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Data final (opcional)',
    example: '2024-08-31',
    required: false,
  })
  @ApiQuery({
    name: 'subjectId',
    description: 'ID da disciplina (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo de frequência do aluno',
    type: StudentAttendanceSummary,
  })
  @ApiResponse({
    status: 404,
    description: 'Aluno não encontrado',
  })
  async getStudentAttendance(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() filters: ListAttendanceDto,
  ): Promise<StudentAttendanceSummary> {
    return await this.attendanceService.getStudentAttendance(studentId, filters);
  }

  @Get()
  @Roles('SECRETARIA', 'ADMIN', 'DIRETOR')
  @ApiOperation({ summary: 'Listar registros de presença' })
  @ApiQuery({
    name: 'startDate',
    description: 'Data inicial (opcional)',
    example: '2024-08-01',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Data final (opcional)',
    example: '2024-08-31',
    required: false,
  })
  @ApiQuery({
    name: 'subjectId',
    description: 'ID da disciplina (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @ApiQuery({
    name: 'studentId',
    description: 'ID do aluno (opcional)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    description: 'Página (opcional)',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limite por página (opcional)',
    example: 20,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros de presença',
    type: AttendanceListResponse,
  })
  async listAttendances(
    @Query() filters: ListAttendanceDto,
  ): Promise<AttendanceListResponse> {
    return await this.attendanceService.listAttendances(filters);
  }

  @Patch(':attendanceId')
  @Roles('SECRETARIA', 'ADMIN')
  @ApiOperation({ summary: 'Editar uma chamada' })
  @ApiParam({
    name: 'attendanceId',
    description: 'ID do registro de presença',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateAttendanceDto })
  @ApiResponse({
    status: 200,
    description: 'Registro de presença atualizado com sucesso',
    type: AttendanceEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas ADMIN e SECRETARIA podem editar',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de presença não encontrado',
  })
  async updateAttendance(
    @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @Req() req: AuthRequest,
  ): Promise<AttendanceEntity> {
    return await this.attendanceService.updateAttendance(
      attendanceId,
      updateAttendanceDto,
      req.user.role,
    );
  }

  @Delete(':attendanceId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apagar uma chamada (ADMIN only)' })
  @ApiParam({
    name: 'attendanceId',
    description: 'ID do registro de presença',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Registro de presença deletado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Registro de presença deletado com sucesso' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas ADMIN pode deletar',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de presença não encontrado',
  })
  async deleteAttendance(
    @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
    @Req() req: AuthRequest,
  ): Promise<{ message: string }> {
    return await this.attendanceService.deleteAttendance(
      attendanceId,
      req.user.role,
    );
  }
}