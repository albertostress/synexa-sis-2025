/**
 * Attendance Service - Lógica de negócio para controle de presença
 * Referência: context7 mcp - NestJS Services Pattern
 */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { ListAttendanceDto } from './dto/list-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import {
  AttendanceEntity,
  StudentAttendanceSummary,
  AttendanceListResponse,
  ClassAttendanceReport,
} from './entities/attendance.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async markAttendance(
    markAttendanceDto: MarkAttendanceDto,
    userId: string,
    userRole: string,
  ): Promise<{ message: string; created: number; updated: number }> {
    const { date, classId, subjectId, attendances } = markAttendanceDto;

    // Verificar se a data não é futura
    const attendanceDate = new Date(date);
    if (attendanceDate > new Date()) {
      throw new BadRequestException('Não é possível registrar presença para datas futuras');
    }

    // Buscar informações do professor se for PROFESSOR
    let teacherId: string | null = null;
    if (userRole === 'PROFESSOR') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId },
        include: {
          subjects: { where: { id: subjectId } },
          schoolClasses: { where: { id: classId } },
        },
      });

      if (!teacher) {
        throw new NotFoundException('Professor não encontrado');
      }

      if (teacher.subjects.length === 0) {
        throw new ForbiddenException('Professor não leciona esta disciplina');
      }

      if (teacher.schoolClasses.length === 0) {
        throw new ForbiddenException('Professor não leciona para esta turma');
      }

      teacherId = teacher.id;
    } else {
      // Para outros roles, buscar um professor qualquer que lecione a disciplina na turma
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          subjects: { some: { id: subjectId } },
          schoolClasses: { some: { id: classId } },
        },
      });

      if (!teacher) {
        throw new BadRequestException(
          'Nenhum professor encontrado para esta disciplina e turma',
        );
      }

      teacherId = teacher.id;
    }

    // Verificar se a turma existe
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
    });

    if (!schoolClass) {
      throw new NotFoundException('Turma não encontrada');
    }

    // Verificar se a disciplina existe
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    // Verificar se todos os alunos estão matriculados na turma
    const studentIds = attendances.map((a) => a.studentId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: { in: studentIds },
        classId,
        status: 'ACTIVE',
      },
    });

    if (enrollments.length !== studentIds.length) {
      throw new BadRequestException(
        'Alguns alunos não estão matriculados ativamente nesta turma',
      );
    }

    // Processar presenças
    let created = 0;
    let updated = 0;

    for (const attendance of attendances) {
      // Verificar se já existe presença para este aluno/data/disciplina
      const existing = await this.prisma.attendance.findFirst({
        where: {
          date: attendanceDate,
          studentId: attendance.studentId,
          subjectId,
        },
      });

      if (existing) {
        // Atualizar presença existente
        await this.prisma.attendance.update({
          where: { id: existing.id },
          data: {
            present: attendance.present,
            justified: attendance.justified || false,
            note: attendance.note || undefined,
            classId,
            teacherId,
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        // Criar nova presença
        await this.prisma.attendance.create({
          data: {
            date: attendanceDate,
            studentId: attendance.studentId,
            classId,
            subjectId,
            teacherId,
            present: attendance.present,
            justified: attendance.justified || false,
            note: attendance.note || undefined,
            createdBy: userId,
          },
        });
        created++;
      }
    }

    return {
      message: 'Chamada registrada com sucesso',
      created,
      updated,
    };
  }

  async getClassAttendance(
    classId: string,
    date: string,
    subjectId?: string,
  ): Promise<ClassAttendanceReport> {
    const attendanceDate = new Date(date);

    // Buscar turma
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      include: {
        students: {
          orderBy: { firstName: 'asc' },
        },
      },
    });

    if (!schoolClass) {
      throw new NotFoundException('Turma não encontrada');
    }

    // Construir where clause
    const whereClause: Prisma.AttendanceWhereInput = {
      classId,
      date: attendanceDate,
    };

    if (subjectId) {
      whereClause.subjectId = subjectId;
    }

    // Buscar presenças
    const attendances = await this.prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: true,
        subject: true,
      },
    });

    // Mapear presenças por aluno
    const attendanceMap = new Map(
      attendances.map((a) => [a.studentId, a]),
    );

    // Construir lista de presenças para todos os alunos
    const attendanceList = schoolClass.students.map((student) => {
      const attendance = attendanceMap.get(student.id);
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        present: attendance?.present ?? false,
        justified: attendance?.justified ?? false,
        note: attendance?.note || undefined,
      };
    });

    // Calcular resumo
    const summary = {
      totalStudents: schoolClass.students.length,
      totalPresent: attendanceList.filter((a) => a.present === true).length,
      totalAbsent: attendanceList.filter((a) => a.present === false).length,
      totalJustified: attendanceList.filter((a) => a.justified === true).length,
    };

    // Buscar informações da disciplina se especificada
    let subjectInfo: { id: string; name: string } | undefined = undefined;
    if (subjectId && attendances.length > 0) {
      subjectInfo = {
        id: attendances[0]?.subject?.id || '',
        name: attendances[0]?.subject?.name || '',
      };
    }

    return {
      class: {
        id: schoolClass.id,
        name: schoolClass.name,
        shift: schoolClass.shift,
      },
      date: date,
      subject: subjectInfo,
      attendances: attendanceList,
      summary,
    };
  }

  async getStudentAttendance(
    studentId: string,
    filters?: ListAttendanceDto,
  ): Promise<StudentAttendanceSummary> {
    // Verificar se o aluno existe
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true, parentEmail: true },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Construir filtros
    const whereClause: Prisma.AttendanceWhereInput = {
      studentId,
    };

    if (filters?.startDate && filters?.endDate) {
      whereClause.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters?.startDate) {
      whereClause.date = {
        gte: new Date(filters.startDate),
      };
    } else if (filters?.endDate) {
      whereClause.date = {
        lte: new Date(filters.endDate),
      };
    }

    if (filters?.subjectId) {
      whereClause.subjectId = filters.subjectId;
    }

    // Buscar todas as presenças
    const attendances = await this.prisma.attendance.findMany({
      where: whereClause,
      include: {
        subject: true,
      },
    });

    // Agrupar por disciplina
    const bySubjectMap = new Map<string, {
      subjectName: string;
      totalClasses: number;
      totalPresent: number;
    }>();

    attendances.forEach((attendance) => {
      const key = attendance.subjectId;
      const existing = bySubjectMap.get(key) || {
        subjectName: attendance.subject.name,
        totalClasses: 0,
        totalPresent: 0,
      };

      existing.totalClasses++;
      if (attendance.present) {
        existing.totalPresent++;
      }

      bySubjectMap.set(key, existing);
    });

    // Converter para array e calcular percentuais
    const bySubject = Array.from(bySubjectMap.entries()).map(([subjectId, data]) => ({
      subjectId,
      subjectName: data.subjectName,
      totalClasses: data.totalClasses,
      totalPresent: data.totalPresent,
      attendancePercentage: data.totalClasses > 0
        ? Math.round((data.totalPresent / data.totalClasses) * 1000) / 10
        : 0,
    }));

    // Calcular totais gerais
    const totalClasses = attendances.length;
    const totalPresent = attendances.filter((a) => a.present).length;
    const totalAbsent = totalClasses - totalPresent;
    const totalJustified = attendances.filter((a) => a.justified).length;
    const attendancePercentage = totalClasses > 0
      ? Math.round((totalPresent / totalClasses) * 1000) / 10
      : 0;

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.parentEmail,
      },
      totalClasses,
      totalPresent,
      totalAbsent,
      totalJustified,
      attendancePercentage,
      bySubject,
    };
  }

  async listAttendances(
    filters: ListAttendanceDto,
  ): Promise<AttendanceListResponse> {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Construir where clause
    const whereClause: Prisma.AttendanceWhereInput = {};

    if (filters.startDate && filters.endDate) {
      whereClause.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters.startDate) {
      whereClause.date = {
        gte: new Date(filters.startDate),
      };
    } else if (filters.endDate) {
      whereClause.date = {
        lte: new Date(filters.endDate),
      };
    }

    if (filters.subjectId) {
      whereClause.subjectId = filters.subjectId;
    }

    if (filters.studentId) {
      whereClause.studentId = filters.studentId;
    }

    // Buscar registros com paginação
    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where: whereClause,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, parentEmail: true },
          },
          class: true,
          subject: true,
          teacher: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          { date: 'desc' },
          { class: { name: 'asc' } },
          { student: { firstName: 'asc' } },
        ],
        skip,
        take: limit,
      }),
      this.prisma.attendance.count({ where: whereClause }),
    ]);

    // Mapear para entities
    const data: AttendanceEntity[] = attendances.map((attendance) => ({
      id: attendance.id,
      date: attendance.date.toISOString().split('T')[0] || '',
      student: {
        id: attendance.student.id,
        name: `${attendance.student.firstName} ${attendance.student.lastName}`,
        email: attendance.student.parentEmail,
      },
      class: {
        id: attendance.class.id,
        name: attendance.class.name,
        shift: attendance.class.shift,
      },
      subject: {
        id: attendance.subject.id,
        name: attendance.subject.name,
      },
      teacher: {
        id: attendance.teacher.id,
        name: attendance.teacher.user.name,
      },
      present: attendance.present,
      justified: attendance.justified,
      note: attendance.note || undefined,
      createdBy: attendance.createdBy,
      createdAt: attendance.createdAt.toISOString(),
      updatedAt: attendance.updatedAt.toISOString(),
    }));

    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  async updateAttendance(
    attendanceId: string,
    updateAttendanceDto: UpdateAttendanceDto,
    userRole: string,
  ): Promise<AttendanceEntity> {
    // Verificar se o registro existe
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        student: true,
        class: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Registro de presença não encontrado');
    }

    // Verificar permissões
    if (!['ADMIN', 'SECRETARIA'].includes(userRole)) {
      throw new ForbiddenException(
        'Apenas ADMIN e SECRETARIA podem editar registros de presença',
      );
    }

    // Atualizar registro
    const updated = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        present: updateAttendanceDto.present ?? attendance.present,
        justified: updateAttendanceDto.justified ?? attendance.justified,
        note: updateAttendanceDto.note !== undefined
          ? updateAttendanceDto.note
          : attendance.note,
        updatedAt: new Date(),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, parentEmail: true },
        },
        class: true,
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      date: updated.date.toISOString().split('T')[0] || '',
      student: {
        id: updated.student.id,
        name: `${updated.student.firstName} ${updated.student.lastName}`,
        email: updated.student.parentEmail,
      },
      class: {
        id: updated.class.id,
        name: updated.class.name,
        shift: updated.class.shift,
      },
      subject: {
        id: updated.subject.id,
        name: updated.subject.name,
      },
      teacher: {
        id: updated.teacher.id,
        name: updated.teacher.user.name,
      },
      present: updated.present,
      justified: updated.justified,
      note: updated.note || undefined,
      createdBy: updated.createdBy,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteAttendance(
    attendanceId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    // Verificar se o registro existe
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      throw new NotFoundException('Registro de presença não encontrado');
    }

    // Apenas ADMIN pode deletar
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas ADMIN pode deletar registros de presença');
    }

    // Deletar registro
    await this.prisma.attendance.delete({
      where: { id: attendanceId },
    });

    return { message: 'Registro de presença deletado com sucesso' };
  }
}