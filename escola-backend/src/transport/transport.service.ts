import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { AssignStudentDto, AssignMultipleStudentsDto, UpdateStudentTransportDto } from './dto/assign-student.dto';
import { FilterTransportDto, FilterStudentTransportDto } from './dto/filter-transport.dto';

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  async createRoute(createRouteDto: CreateRouteDto) {
    const { name, driverName, vehicle, departure, returnTime, stops } = createRouteDto;

    // Validar se não há paragens duplicadas
    const stopNames = stops.map(stop => stop.name);
    const uniqueStopNames = [...new Set(stopNames)];
    if (stopNames.length !== uniqueStopNames.length) {
      throw new BadRequestException('Não é possível ter paragens duplicadas na mesma rota');
    }

    // Validar se não há ordens duplicadas
    const stopOrders = stops.map(stop => stop.order);
    const uniqueStopOrders = [...new Set(stopOrders)];
    if (stopOrders.length !== uniqueStopOrders.length) {
      throw new BadRequestException('Não é possível ter ordens duplicadas na mesma rota');
    }

    // Validar horários
    if (departure >= returnTime) {
      throw new BadRequestException('Horário de saída deve ser anterior ao horário de retorno');
    }

    // Verificar se já existe uma rota com o mesmo nome
    const existingRoute = await this.prisma.transportRoute.findFirst({
      where: { name },
    });

    if (existingRoute) {
      throw new ConflictException('Já existe uma rota com este nome');
    }

    const route = await this.prisma.transportRoute.create({
      data: {
        name,
        driverName,
        vehicle,
        departure,
        returnTime,
        stops: stops.sort((a, b) => a.order - b.order) as any, // Garantir ordem correta
      },
    });

    return route;
  }

  async findAllRoutes(filters: FilterTransportDto) {
    const { routeName, driverName, vehicle, departure, returnTime, stopName, page = 1, limit = 10 } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (routeName) {
      where.name = {
        contains: routeName,
        mode: 'insensitive',
      };
    }

    if (driverName) {
      where.driverName = {
        contains: driverName,
        mode: 'insensitive',
      };
    }

    if (vehicle) {
      where.vehicle = {
        contains: vehicle,
        mode: 'insensitive',
      };
    }

    if (departure) {
      where.departure = departure;
    }

    if (returnTime) {
      where.returnTime = returnTime;
    }

    if (stopName) {
      where.stops = {
        path: '$[*].name',
        string_contains: stopName,
      };
    }

    const [routes, total] = await Promise.all([
      this.prisma.transportRoute.findMany({
        where,
        skip,
        take: limit,
        include: {
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  parentEmail: true,
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
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.transportRoute.count({ where }),
    ]);

    return {
      routes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findRouteById(id: string) {
    const route = await this.prisma.transportRoute.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                parentEmail: true,
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

    if (!route) {
      throw new NotFoundException('Rota de transporte não encontrada');
    }

    return route;
  }

  async updateRoute(id: string, updateRouteDto: Partial<CreateRouteDto>) {
    const route = await this.findRouteById(id);

    const { name, driverName, vehicle, departure, returnTime, stops } = updateRouteDto;

    // Se está atualizando paragens, validar
    if (stops) {
      const stopNames = stops.map(stop => stop.name);
      const uniqueStopNames = [...new Set(stopNames)];
      if (stopNames.length !== uniqueStopNames.length) {
        throw new BadRequestException('Não é possível ter paragens duplicadas na mesma rota');
      }

      const stopOrders = stops.map(stop => stop.order);
      const uniqueStopOrders = [...new Set(stopOrders)];
      if (stopOrders.length !== uniqueStopOrders.length) {
        throw new BadRequestException('Não é possível ter ordens duplicadas na mesma rota');
      }
    }

    // Validar horários se estão sendo atualizados
    const newDeparture = departure || route.departure;
    const newReturnTime = returnTime || route.returnTime;
    
    if (newDeparture >= newReturnTime) {
      throw new BadRequestException('Horário de saída deve ser anterior ao horário de retorno');
    }

    // Verificar se nome não conflita com outra rota
    if (name && name !== route.name) {
      const existingRoute = await this.prisma.transportRoute.findFirst({
        where: { name, id: { not: id } },
      });

      if (existingRoute) {
        throw new ConflictException('Já existe uma rota com este nome');
      }
    }

    const updatedRoute = await this.prisma.transportRoute.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(driverName && { driverName }),
        ...(vehicle && { vehicle }),
        ...(departure && { departure }),
        ...(returnTime && { returnTime }),
        ...(stops && { stops: stops.sort((a, b) => a.order - b.order) as any }),
      },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                parentEmail: true,
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

    return updatedRoute;
  }

  async deleteRoute(id: string) {
    const route = await this.findRouteById(id);

    // Verificar se há alunos atribuídos à rota
    const studentsCount = await this.prisma.studentTransport.count({
      where: { routeId: id },
    });

    if (studentsCount > 0) {
      throw new BadRequestException('Não é possível eliminar uma rota com alunos atribuídos');
    }

    await this.prisma.transportRoute.delete({
      where: { id },
    });

    return { message: 'Rota de transporte eliminada com sucesso' };
  }

  async assignStudentsToRoute(routeId: string, assignDto: AssignMultipleStudentsDto) {
    const route = await this.findRouteById(routeId);

    // Verificar se todas as paragens existem na rota
    const routeStops = route.stops as { name: string; order: number }[];
    const routeStopNames = routeStops.map(stop => stop.name);

    for (const studentAssignment of assignDto.students) {
      if (!routeStopNames.includes(studentAssignment.stopName)) {
        throw new BadRequestException(
          `Paragem "${studentAssignment.stopName}" não existe na rota "${route.name}"`
        );
      }
    }

    // Verificar se todos os alunos existem
    const studentIds = assignDto.students.map(s => s.studentId);
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
    });

    if (students.length !== studentIds.length) {
      throw new NotFoundException('Um ou mais alunos não foram encontrados');
    }

    // Verificar se algum aluno já tem transporte atribuído
    const existingTransports = await this.prisma.studentTransport.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        route: { select: { name: true } },
        student: { select: { firstName: true, lastName: true } },
      },
    });

    if (existingTransports.length > 0) {
      const conflictMessages = existingTransports.map(
        t => `${t.student.firstName} ${t.student.lastName} já está atribuído à rota "${t.route.name}"`
      );
      throw new ConflictException(
        `Conflitos encontrados: ${conflictMessages.join(', ')}`
      );
    }

    // Criar as atribuições
    const assignments = await Promise.all(
      assignDto.students.map(studentAssignment =>
        this.prisma.studentTransport.create({
          data: {
            studentId: studentAssignment.studentId,
            routeId,
            stopName: studentAssignment.stopName,
            notes: studentAssignment.notes,
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                parentEmail: true,
                schoolClass: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            route: {
              select: {
                id: true,
                name: true,
                driverName: true,
                vehicle: true,
                departure: true,
                returnTime: true,
                stops: true,
              },
            },
          },
        })
      )
    );

    return assignments;
  }

  async getStudentTransport(studentId: string) {
    const studentTransport = await this.prisma.studentTransport.findFirst({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            schoolClass: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        route: {
          select: {
            id: true,
            name: true,
            driverName: true,
            vehicle: true,
            departure: true,
            returnTime: true,
            stops: true,
          },
        },
      },
    });

    if (!studentTransport) {
      throw new NotFoundException('Aluno não tem transporte atribuído');
    }

    return studentTransport;
  }

  async updateStudentTransport(studentId: string, updateDto: UpdateStudentTransportDto) {
    const studentTransport = await this.prisma.studentTransport.findFirst({
      where: { studentId },
      include: { route: true },
    });

    if (!studentTransport) {
      throw new NotFoundException('Aluno não tem transporte atribuído');
    }

    // Se está atualizando a paragem, verificar se existe na rota
    if (updateDto.stopName) {
      const routeStops = studentTransport.route.stops as { name: string; order: number }[];
      const routeStopNames = routeStops.map(stop => stop.name);

      if (!routeStopNames.includes(updateDto.stopName)) {
        throw new BadRequestException(
          `Paragem "${updateDto.stopName}" não existe na rota "${studentTransport.route.name}"`
        );
      }
    }

    const updatedTransport = await this.prisma.studentTransport.update({
      where: { id: studentTransport.id },
      data: {
        ...(updateDto.stopName && { stopName: updateDto.stopName }),
        ...(updateDto.notes !== undefined && { notes: updateDto.notes }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            schoolClass: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        route: {
          select: {
            id: true,
            name: true,
            driverName: true,
            vehicle: true,
            departure: true,
            returnTime: true,
            stops: true,
          },
        },
      },
    });

    return updatedTransport;
  }

  async removeStudentFromTransport(studentId: string) {
    const studentTransport = await this.prisma.studentTransport.findFirst({
      where: { studentId },
    });

    if (!studentTransport) {
      throw new NotFoundException('Aluno não tem transporte atribuído');
    }

    await this.prisma.studentTransport.delete({
      where: { id: studentTransport.id },
    });

    return { message: 'Aluno removido do transporte com sucesso' };
  }

  async findAllStudentTransports(filters: FilterStudentTransportDto) {
    const { studentName, className, routeName, stopName, page = 1, limit = 10 } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

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

    if (routeName) {
      where.route = {
        name: {
          contains: routeName,
          mode: 'insensitive',
        },
      };
    }

    if (stopName) {
      where.stopName = {
        contains: stopName,
        mode: 'insensitive',
      };
    }

    const [transports, total] = await Promise.all([
      this.prisma.studentTransport.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              parentEmail: true,
              schoolClass: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          route: {
            select: {
              id: true,
              name: true,
              driverName: true,
              vehicle: true,
              departure: true,
              returnTime: true,
              stops: true,
            },
          },
        },
        orderBy: {
          student: {
            firstName: 'asc',
          },
        },
      }),
      this.prisma.studentTransport.count({ where }),
    ]);

    return {
      transports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}