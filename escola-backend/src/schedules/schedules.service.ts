import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(createScheduleDto: CreateScheduleDto) {
    const { teacherId, weekday, startTime, endTime, subjectId } = createScheduleDto;

    // 1. Verificar se o professor existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new BadRequestException('Professor não encontrado.');
    }

    // 2. Verificar se a disciplina existe
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new BadRequestException('Disciplina não encontrada.');
    }

    // 3. Validar horários
    if (!this.isValidTimeRange(startTime, endTime)) {
      throw new BadRequestException('Horário de fim deve ser posterior ao horário de início.');
    }

    // 4. Verificar conflitos de horário
    const hasConflict = await this.hasTimeConflict(teacherId, weekday, startTime, endTime);
    if (hasConflict) {
      throw new ConflictException('Professor já possui um horário conflitante neste período.');
    }

    // 5. Criar o horário
    return this.prisma.schedule.create({
      data: {
        teacherId,
        weekday: weekday as any,
        startTime,
        endTime,
        subjectId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        subject: true,
      },
    });
  }

  async findAll(teacherId?: string, weekday?: string, subjectId?: string) {
    const where: any = {};

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (weekday) {
      where.weekday = weekday as any;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    return this.prisma.schedule.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        subject: true,
      },
      orderBy: [
        { weekday: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        subject: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Horário não encontrado.');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto) {
    // 1. Verificar se o horário existe
    const existingSchedule = await this.prisma.schedule.findUnique({
      where: { id },
    });
    if (!existingSchedule) {
      throw new NotFoundException('Horário não encontrado.');
    }

    const { weekday, startTime, endTime, subjectId } = updateScheduleDto;

    // 2. Se a disciplina está sendo alterada, verificar se existe
    if (subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });
      if (!subject) {
        throw new BadRequestException('Disciplina não encontrada.');
      }
    }

    // 3. Validar horários se estão sendo alterados
    const newStartTime = startTime || existingSchedule.startTime;
    const newEndTime = endTime || existingSchedule.endTime;
    
    if (!this.isValidTimeRange(newStartTime, newEndTime)) {
      throw new BadRequestException('Horário de fim deve ser posterior ao horário de início.');
    }

    // 4. Verificar conflitos apenas se horário ou dia estão sendo alterados
    if (weekday || startTime || endTime) {
      const newWeekday = weekday || existingSchedule.weekday;
      const hasConflict = await this.hasTimeConflict(
        existingSchedule.teacherId,
        newWeekday as string,
        newStartTime,
        newEndTime,
        id // Excluir o próprio horário da verificação
      );
      
      if (hasConflict) {
        throw new ConflictException('Professor já possui um horário conflitante neste período.');
      }
    }

    // 5. Atualizar o horário
    return this.prisma.schedule.update({
      where: { id },
      data: updateScheduleDto,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        subject: true,
      },
    });
  }

  async remove(id: string) {
    // 1. Verificar se o horário existe
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });
    if (!schedule) {
      throw new NotFoundException('Horário não encontrado.');
    }

    // 2. Remover o horário
    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  async findByTeacher(teacherId: string) {
    // 1. Verificar se o professor existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Professor não encontrado.');
    }

    // 2. Buscar horários do professor
    return this.prisma.schedule.findMany({
      where: { teacherId },
      include: {
        subject: true,
      },
      orderBy: [
        { weekday: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async checkConflicts(
    teacherId: string,
    weekday: string,
    startTime: string,
    endTime: string,
  ) {
    // 1. Verificar se o professor existe
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Professor não encontrado.');
    }

    // 2. Validar horários
    if (!this.isValidTimeRange(startTime, endTime)) {
      throw new BadRequestException('Horário de fim deve ser posterior ao horário de início.');
    }

    // 3. Buscar conflitos
    const conflicts = await this.prisma.schedule.findMany({
      where: {
        teacherId,
        weekday: weekday as any,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
      include: {
        subject: true,
      },
    });

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  }

  // Métodos auxiliares privados
  private isValidTimeRange(startTime: string, endTime: string): boolean {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return end > start;
  }

  private timeToMinutes(time: string): number {
    const parts = time.split(':').map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    return hours * 60 + minutes;
  }

  private async hasTimeConflict(
    teacherId: string,
    weekday: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = {
      teacherId,
      weekday: weekday as any,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const conflicts = await this.prisma.schedule.findMany({ where });
    return conflicts.length > 0;
  }
}