import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';
import { RegisterParticipationDto, RegisterMultipleParticipationsDto, RegisterClassParticipationDto, UpdateParticipationDto, BatchUpdatePresenceDto } from './dto/register-participation.dto';
import { FilterEventsDto, FilterParticipantsDto } from './dto/filter-events.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async createEvent(createEventDto: CreateEventDto) {
    const { title, description, date, location, type } = createEventDto;

    // Validar se a data não é no passado
    const eventDate = new Date(date);
    const now = new Date();
    if (eventDate < now) {
      throw new BadRequestException('Não é possível criar evento com data no passado');
    }

    // Verificar se já existe um evento com o mesmo título na mesma data
    const existingEvent = await this.prisma.event.findFirst({
      where: {
        title,
        date: eventDate,
      },
    });

    if (existingEvent) {
      throw new ConflictException('Já existe um evento com este título na mesma data');
    }

    const event = await this.prisma.event.create({
      data: {
        title,
        description,
        date: eventDate,
        location,
        type,
      },
    });

    return event;
  }

  async findAllEvents(filters: FilterEventsDto) {
    const { title, type, location, startDate, endDate, futureOnly, pastOnly, page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (title) {
      where.title = {
        contains: title,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.type = type;
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    // Filtros de data
    if (startDate || endDate || futureOnly || pastOnly) {
      where.date = {};

      if (startDate) {
        where.date.gte = new Date(startDate);
      }

      if (endDate) {
        where.date.lte = new Date(endDate);
      }

      if (futureOnly) {
        where.date.gte = new Date();
      }

      if (pastOnly) {
        where.date.lt = new Date();
      }
    }

    // Definir ordenação
    const orderBy: any = {};
    if (sortBy === 'date') {
      orderBy.date = sortOrder;
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'type') {
      orderBy.type = sortOrder;
    } else {
      orderBy.date = sortOrder;
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          participants: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  schoolClass: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy,
      }),
      this.prisma.event.count({ where }),
    ]);

    // Adicionar estatísticas para cada evento
    const eventsWithStats = events.map(event => ({
      ...event,
      totalParticipants: event.participants.length,
      totalPresent: event.participants.filter(p => p.presence).length,
    }));

    return {
      events: eventsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findEventById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                schoolClass: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            student: {
              name: 'asc',
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado');
    }

    return {
      ...event,
      totalParticipants: event.participants.length,
      totalPresent: event.participants.filter(p => p.presence).length,
    };
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto) {
    const event = await this.findEventById(id);

    const { title, description, date, location, type } = updateEventDto;

    // Se está atualizando a data, validar se não é no passado
    if (date) {
      const eventDate = new Date(date);
      const now = new Date();
      if (eventDate < now) {
        throw new BadRequestException('Não é possível atualizar evento para data no passado');
      }
    }

    // Verificar se o novo título não conflita com outro evento
    if (title && title !== event.title) {
      const eventDate = date ? new Date(date) : event.date;
      const existingEvent = await this.prisma.event.findFirst({
        where: {
          title,
          date: eventDate,
          id: { not: id },
        },
      });

      if (existingEvent) {
        throw new ConflictException('Já existe um evento com este título na mesma data');
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(location && { location }),
        ...(type && { type }),
      },
      include: {
        participants: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                schoolClass: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      ...updatedEvent,
      totalParticipants: updatedEvent.participants.length,
      totalPresent: updatedEvent.participants.filter(p => p.presence).length,
    };
  }

  async deleteEvent(id: string) {
    const event = await this.findEventById(id);

    // Verificar se o evento já passou
    const now = new Date();
    if (event.date < now) {
      throw new BadRequestException('Não é possível eliminar evento que já ocorreu');
    }

    // Verificar se há participantes
    if (event.participants.length > 0) {
      throw new BadRequestException('Não é possível eliminar evento com participantes registados');
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return { message: 'Evento eliminado com sucesso' };
  }

  async registerParticipations(eventId: string, registerDto: RegisterMultipleParticipationsDto) {
    const event = await this.findEventById(eventId);

    const studentIds = registerDto.participations.map(p => p.studentId);

    // Verificar se todos os alunos existem
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
    });

    if (students.length !== studentIds.length) {
      throw new NotFoundException('Um ou mais alunos não foram encontrados');
    }

    // Verificar se algum aluno já está registado no evento
    const existingParticipations = await this.prisma.eventParticipation.findMany({
      where: {
        eventId,
        studentId: { in: studentIds },
      },
      include: {
        student: { select: { name: true } },
      },
    });

    if (existingParticipations.length > 0) {
      const alreadyRegistered = existingParticipations.map(p => p.student.name);
      throw new ConflictException(
        `Os seguintes alunos já estão registados no evento: ${alreadyRegistered.join(', ')}`
      );
    }

    // Criar as participações
    const participations = await Promise.all(
      registerDto.participations.map(participation =>
        this.prisma.eventParticipation.create({
          data: {
            eventId,
            studentId: participation.studentId,
            note: participation.note,
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                schoolClass: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                date: true,
                location: true,
                type: true,
              },
            },
          },
        })
      )
    );

    return participations;
  }

  async registerClassParticipation(eventId: string, registerDto: RegisterClassParticipationDto) {
    const event = await this.findEventById(eventId);

    // Verificar se a turma existe
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: registerDto.classId },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!schoolClass) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (schoolClass.students.length === 0) {
      throw new BadRequestException('Turma não possui alunos');
    }

    const studentIds = schoolClass.students.map(s => s.id);

    // Verificar se algum aluno já está registado no evento
    const existingParticipations = await this.prisma.eventParticipation.findMany({
      where: {
        eventId,
        studentId: { in: studentIds },
      },
      include: {
        student: { select: { name: true } },
      },
    });

    if (existingParticipations.length > 0) {
      const alreadyRegistered = existingParticipations.map(p => p.student.name);
      throw new ConflictException(
        `Os seguintes alunos da turma já estão registados no evento: ${alreadyRegistered.join(', ')}`
      );
    }

    // Criar participações para todos os alunos da turma
    const participations = await Promise.all(
      studentIds.map(studentId =>
        this.prisma.eventParticipation.create({
          data: {
            eventId,
            studentId,
            note: registerDto.note,
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                schoolClass: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                date: true,
                location: true,
                type: true,
              },
            },
          },
        })
      )
    );

    return participations;
  }

  async getEventParticipants(eventId: string, filters: FilterParticipantsDto) {
    const event = await this.findEventById(eventId);

    const { studentName, className, presentOnly, absentOnly, page = 1, limit = 10 } = filters;

    const skip = (page - 1) * limit;

    const where: any = { eventId };

    if (studentName) {
      where.student = {
        name: {
          contains: studentName,
          mode: 'insensitive',
        },
      };
    }

    if (className) {
      where.student = {
        ...where.student,
        schoolClass: {
          name: {
            contains: className,
            mode: 'insensitive',
          },
        },
      };
    }

    if (presentOnly) {
      where.presence = true;
    }

    if (absentOnly) {
      where.presence = false;
    }

    const [participants, total] = await Promise.all([
      this.prisma.eventParticipation.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              schoolClass: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              date: true,
              location: true,
              type: true,
            },
          },
        },
        orderBy: {
          student: {
            name: 'asc',
          },
        },
      }),
      this.prisma.eventParticipation.count({ where }),
    ]);

    return {
      participants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalParticipants: total,
        totalPresent: participants.filter(p => p.presence).length,
        totalAbsent: participants.filter(p => !p.presence).length,
      },
    };
  }

  async updateParticipation(participationId: string, updateDto: UpdateParticipationDto) {
    const participation = await this.prisma.eventParticipation.findUnique({
      where: { id: participationId },
      include: {
        event: true,
        student: true,
      },
    });

    if (!participation) {
      throw new NotFoundException('Participação não encontrada');
    }

    const updatedParticipation = await this.prisma.eventParticipation.update({
      where: { id: participationId },
      data: {
        presence: updateDto.presence,
        note: updateDto.note,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            schoolClass: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            type: true,
          },
        },
      },
    });

    return updatedParticipation;
  }

  async batchUpdatePresence(eventId: string, batchUpdateDto: BatchUpdatePresenceDto) {
    const event = await this.findEventById(eventId);

    const participationIds = batchUpdateDto.updates.map(u => u.participationId);

    // Verificar se todas as participações existem e pertencem ao evento
    const participations = await this.prisma.eventParticipation.findMany({
      where: {
        id: { in: participationIds },
        eventId,
      },
    });

    if (participations.length !== participationIds.length) {
      throw new NotFoundException('Uma ou mais participações não foram encontradas');
    }

    // Atualizar em lote
    const updates = await Promise.all(
      batchUpdateDto.updates.map(update =>
        this.prisma.eventParticipation.update({
          where: { id: update.participationId },
          data: {
            presence: update.presence,
            note: update.note,
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                schoolClass: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        })
      )
    );

    return updates;
  }

  async removeParticipation(participationId: string) {
    const participation = await this.prisma.eventParticipation.findUnique({
      where: { id: participationId },
      include: {
        event: true,
        student: { select: { name: true } },
      },
    });

    if (!participation) {
      throw new NotFoundException('Participação não encontrada');
    }

    // Não permitir remover participação de evento que já ocorreu
    const now = new Date();
    if (participation.event.date < now) {
      throw new BadRequestException('Não é possível remover participação de evento que já ocorreu');
    }

    await this.prisma.eventParticipation.delete({
      where: { id: participationId },
    });

    return {
      message: `Participação de ${participation.student.name} removida com sucesso`,
    };
  }

  async getStudentEvents(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const participations = await this.prisma.eventParticipation.findMany({
      where: { studentId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            location: true,
            type: true,
          },
        },
      },
      orderBy: {
        event: {
          date: 'desc',
        },
      },
    });

    return {
      student,
      participations,
      totalEvents: participations.length,
      totalPresent: participations.filter(p => p.presence).length,
    };
  }
}