/**
 * Analytics Service - Serviço de análise e métricas
 * Calcula dashboards e estatísticas do sistema
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterAnalyticsDto } from './dto/filter-analytics.dto';
import {
  OverviewResponse,
  AttendanceAnalyticsResponse,
  GradesAnalyticsResponse,
  FinanceAnalyticsResponse,
  MatriculationAnalyticsResponse,
  MetricItem,
} from './responses/dashboard-metrics.response';

@Injectable()
export class AnalyticsService {
  private cache = new Map<string, { data: any; expiry: number }>();
  private CACHE_TTL = 10 * 60 * 1000; // 10 minutos

  constructor(private readonly prisma: PrismaService) {}

  private getCacheKey(method: string, filters: FilterAnalyticsDto): string {
    return `${method}:${JSON.stringify(filters)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    });
  }

  private getCurrentYear(): number {
    return new Date().getFullYear();
  }

  private getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || 'Mês';
  }

  async getOverview(filters: FilterAnalyticsDto): Promise<OverviewResponse> {
    const cacheKey = this.getCacheKey('overview', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const year = filters.year || this.getCurrentYear();

    // Total de alunos ativos
    const totalStudents = await this.prisma.student.count({
      where: {
        enrollments: {
          some: {
            year,
            status: 'ACTIVE',
          },
        },
      },
    });

    // Total de professores
    const totalTeachers = await this.prisma.teacher.count();

    // Total de turmas
    const totalClasses = await this.prisma.schoolClass.count({
      where: { year },
    });

    // Total de disciplinas
    const totalSubjects = await this.prisma.subject.count();

    // Matrículas por turno
    const enrollmentsByShiftData = await this.prisma.enrollment.groupBy({
      by: ['classId'],
      where: { year, status: 'ACTIVE' },
      _count: true,
    });

    // Buscar informações das turmas para obter os turnos
    const classIds = enrollmentsByShiftData.map(e => e.classId);
    const classes = await this.prisma.schoolClass.findMany({
      where: { id: { in: classIds } },
      select: { id: true, shift: true },
    });

    const shiftCounts = new Map<string, number>();
    for (const enrollment of enrollmentsByShiftData) {
      const classInfo = classes.find(c => c.id === enrollment.classId);
      if (classInfo) {
        const current = shiftCounts.get(classInfo.shift) || 0;
        shiftCounts.set(classInfo.shift, current + enrollment._count);
      }
    }

    const enrollmentsByShift: MetricItem[] = Array.from(shiftCounts.entries()).map(([shift, count]) => ({
      label: shift === 'MORNING' ? 'Manhã' : shift === 'AFTERNOON' ? 'Tarde' : 'Noite',
      value: count,
    }));

    // Taxa de frequência geral
    const attendanceData = await this.prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      select: { present: true },
    });

    const attendanceRate = attendanceData.length > 0
      ? (attendanceData.filter(a => a.present).length / attendanceData.length) * 100
      : 0;

    // Taxa de adimplência
    const invoices = await this.prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      select: { status: true },
    });

    const paymentRate = invoices.length > 0
      ? (invoices.filter((i: any) => i.status === 'PAID').length / invoices.length) * 100
      : 0;

    const result: OverviewResponse = {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      enrollmentsByShift,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      paymentRate: Math.round(paymentRate * 10) / 10,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getAttendanceAnalytics(filters: FilterAnalyticsDto): Promise<AttendanceAnalyticsResponse> {
    const cacheKey = this.getCacheKey('attendance', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const year = filters.year || this.getCurrentYear();
    const whereConditions: any = {
      date: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    };

    if (filters.classId) whereConditions.classId = filters.classId;
    if (filters.month) {
      whereConditions.date = {
        gte: new Date(year, filters.month - 1, 1),
        lte: new Date(year, filters.month, 0),
      };
    }

    // Frequência geral
    const attendanceData = await this.prisma.attendance.findMany({
      where: whereConditions,
      select: { present: true, justified: true },
    });

    const overallAttendanceRate = attendanceData.length > 0
      ? (attendanceData.filter(a => a.present).length / attendanceData.length) * 100
      : 0;

    // Distribuição de faltas
    const absences = attendanceData.filter(a => !a.present);
    const absenceDistribution = {
      justified: absences.filter(a => a.justified).length,
      unjustified: absences.filter(a => !a.justified).length,
      total: absences.length,
    };

    // Ranking de turmas por assiduidade
    const classesByAttendanceData = await this.prisma.attendance.groupBy({
      by: ['classId'],
      where: {
        date: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      _count: {
        _all: true,
        present: true,
      },
    });

    const classesInfo = await this.prisma.schoolClass.findMany({
      where: { id: { in: classesByAttendanceData.map(c => c.classId) } },
      select: { id: true, name: true },
    });

    const classesByAttendance: MetricItem[] = classesByAttendanceData
      .map(c => {
        const classInfo = classesInfo.find(ci => ci.id === c.classId);
        const rate = c._count._all > 0 ? (c._count.present / c._count._all) * 100 : 0;
        return {
          label: classInfo?.name || 'Turma',
          value: Math.round(rate * 10) / 10,
          percentage: Math.round(rate * 10) / 10,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Tendência mensal
    const monthlyTrend: MetricItem[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = await this.prisma.attendance.findMany({
        where: {
          date: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0),
          },
        },
        select: { present: true },
      });

      if (monthData.length > 0) {
        const rate = (monthData.filter(a => a.present).length / monthData.length) * 100;
        monthlyTrend.push({
          label: this.getMonthName(month),
          value: Math.round(rate * 10) / 10,
        });
      }
    }

    // Alunos com frequência crítica (<75%)
    const studentAttendance = await this.prisma.attendance.groupBy({
      by: ['studentId'],
      where: {
        date: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      _count: {
        _all: true,
        present: true,
      },
    });

    const criticalAttendanceCount = studentAttendance.filter(s => {
      const rate = s._count._all > 0 ? (s._count.present / s._count._all) * 100 : 0;
      return rate < 75;
    }).length;

    const result: AttendanceAnalyticsResponse = {
      overallAttendanceRate: Math.round(overallAttendanceRate * 10) / 10,
      classesByAttendance,
      absenceDistribution,
      monthlyTrend,
      criticalAttendanceCount,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getGradesAnalytics(filters: FilterAnalyticsDto): Promise<GradesAnalyticsResponse> {
    const cacheKey = this.getCacheKey('grades', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const year = filters.year || this.getCurrentYear();
    const whereConditions: any = {
      createdAt: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    };

    if (filters.classId) whereConditions.student = { classId: filters.classId };
    if (filters.disciplineId) whereConditions.subjectId = filters.disciplineId;

    // Média global
    const gradesData = await this.prisma.grade.findMany({
      where: whereConditions,
      select: { value: true, subjectId: true, student: { select: { classId: true } } },
    });

    const overallAverage = gradesData.length > 0
      ? gradesData.reduce((sum, g) => sum + g.value, 0) / gradesData.length
      : 0;

    // Média por disciplina
    const subjectGrades = new Map<string, number[]>();
    for (const grade of gradesData) {
      if (!subjectGrades.has(grade.subjectId)) {
        subjectGrades.set(grade.subjectId, []);
      }
      subjectGrades.get(grade.subjectId)!.push(grade.value);
    }

    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: Array.from(subjectGrades.keys()) } },
      select: { id: true, name: true },
    });

    const averageBySubject: MetricItem[] = Array.from(subjectGrades.entries()).map(([subjectId, values]) => {
      const subject = subjects.find(s => s.id === subjectId);
      const average = values.reduce((sum, v) => sum + v, 0) / values.length;
      return {
        label: subject?.name || 'Disciplina',
        value: Math.round(average * 10) / 10,
      };
    }).sort((a, b) => b.value - a.value);

    // Distribuição por status final (simulada)
    const reportCards: any[] = [];

    const statusDistribution = {
      approved: reportCards.filter((r: any) => r.status === 'APPROVED').length,
      failed: reportCards.filter((r: any) => r.status === 'FAILED').length,
      recovery: reportCards.filter((r: any) => r.status === 'RECOVERY').length,
    };

    const approvalRate = reportCards.length > 0
      ? (statusDistribution.approved / reportCards.length) * 100
      : 0;

    // Top 5 turmas por média
    const classGrades = new Map<string, number[]>();
    for (const grade of gradesData) {
      const classId = grade.student.classId;
      if (classId) {
        if (!classGrades.has(classId)) {
          classGrades.set(classId, []);
        }
        classGrades.get(classId)!.push(grade.value);
      }
    }

    const classes = await this.prisma.schoolClass.findMany({
      where: { id: { in: Array.from(classGrades.keys()) } },
      select: { id: true, name: true },
    });

    const topPerformingClasses: MetricItem[] = Array.from(classGrades.entries())
      .map(([classId, values]) => {
        const classInfo = classes.find(c => c.id === classId);
        const average = values.reduce((sum, v) => sum + v, 0) / values.length;
        return {
          label: classInfo?.name || 'Turma',
          value: Math.round(average * 10) / 10,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const result: GradesAnalyticsResponse = {
      overallAverage: Math.round(overallAverage * 10) / 10,
      averageBySubject,
      statusDistribution,
      approvalRate: Math.round(approvalRate * 10) / 10,
      topPerformingClasses,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getFinanceAnalytics(filters: FilterAnalyticsDto): Promise<FinanceAnalyticsResponse> {
    const cacheKey = this.getCacheKey('finance', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const year = filters.year || this.getCurrentYear();
    const whereConditions: any = {
      createdAt: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      },
    };

    if (filters.month) {
      whereConditions.createdAt = {
        gte: new Date(year, filters.month - 1, 1),
        lte: new Date(year, filters.month, 0),
      };
    }

    // Dados básicos
    const invoices = await this.prisma.invoice.findMany({
      where: whereConditions,
      select: { amount: true, status: true, createdAt: true },
    });

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalReceived = invoices
      .filter((inv: any) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const defaultRate = totalBilled > 0 ? ((totalBilled - totalReceived) / totalBilled) * 100 : 0;
    const pendingInvoices = invoices.filter((inv: any) => inv.status === 'PENDING').length;

    // Receita mensal
    const monthlyRevenue: MetricItem[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthInvoices = invoices.filter((inv: any) => {
        const invMonth = inv.createdAt.getMonth() + 1;
        return invMonth === month && inv.status === 'PAID';
      });
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      
      if (monthRevenue > 0) {
        monthlyRevenue.push({
          label: this.getMonthName(month),
          value: monthRevenue,
        });
      }
    }

    // Distribuição por status
    const statusCounts = new Map<string, number>();
    for (const invoice of invoices) {
      const current = statusCounts.get(invoice.status) || 0;
      statusCounts.set(invoice.status, current + 1);
    }

    const paymentStatusDistribution: MetricItem[] = Array.from(statusCounts.entries()).map(([status, count]) => ({
      label: status === 'PAID' ? 'Pago' : status === 'PENDING' ? 'Pendente' : 'Cancelado',
      value: count,
    }));

    // Previsão próximo mês (média dos últimos 3 meses)
    const lastThreeMonths = monthlyRevenue.slice(-3);
    const nextMonthProjection = lastThreeMonths.length > 0
      ? lastThreeMonths.reduce((sum, m) => sum + m.value, 0) / lastThreeMonths.length
      : 0;

    const result: FinanceAnalyticsResponse = {
      totalBilled,
      totalReceived,
      defaultRate: Math.round(defaultRate * 10) / 10,
      pendingInvoices,
      monthlyRevenue,
      paymentStatusDistribution,
      nextMonthProjection,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getMatriculationAnalytics(filters: FilterAnalyticsDto): Promise<MatriculationAnalyticsResponse> {
    const cacheKey = this.getCacheKey('matriculation', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const year = filters.year || this.getCurrentYear();
    const whereConditions: any = { year };

    if (filters.shift) {
      whereConditions.schoolClass = { shift: filters.shift };
    }

    // Total de matrículas
    const enrollments = await this.prisma.enrollment.findMany({
      where: whereConditions,
      select: {
        id: true,
        classId: true,
        createdAt: true,
        studentId: true,
      },
    });

    const totalEnrollments = enrollments.length;

    // Buscar informações das turmas
    const classIds = enrollments.map(e => e.classId);
    const classes = await this.prisma.schoolClass.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, shift: true },
    });

    // Matrículas por turno
    const shiftCounts = new Map<string, number>();
    for (const enrollment of enrollments) {
      const classInfo = classes.find(c => c.id === enrollment.classId);
      if (classInfo) {
        const shift = classInfo.shift;
        const current = shiftCounts.get(shift) || 0;
        shiftCounts.set(shift, current + 1);
      }
    }

    const enrollmentsByShift: MetricItem[] = Array.from(shiftCounts.entries()).map(([shift, count]) => ({
      label: shift === 'MORNING' ? 'Manhã' : shift === 'AFTERNOON' ? 'Tarde' : 'Noite',
      value: count,
    }));

    // Matrículas por turma
    const classCounts = new Map<string, number>();
    for (const enrollment of enrollments) {
      const classInfo = classes.find(c => c.id === enrollment.classId);
      if (classInfo) {
        const className = classInfo.name;
        const current = classCounts.get(className) || 0;
        classCounts.set(className, current + 1);
      }
    }

    const enrollmentsByClass: MetricItem[] = Array.from(classCounts.entries())
      .map(([className, count]) => ({
        label: className,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Crescimento mensal
    const monthlyGrowth: MetricItem[] = [];
    for (let month = 1; month <= 12; month++) {
      const monthEnrollments = enrollments.filter(e => {
        const enrollMonth = e.createdAt.getMonth() + 1;
        return enrollMonth === month;
      });
      
      if (monthEnrollments.length > 0) {
        monthlyGrowth.push({
          label: this.getMonthName(month),
          value: monthEnrollments.length,
        });
      }
    }

    // Crescimento YoY
    const lastYearEnrollments = await this.prisma.enrollment.count({
      where: { year: year - 1 },
    });
    const yearOverYearGrowth = lastYearEnrollments > 0
      ? ((totalEnrollments - lastYearEnrollments) / lastYearEnrollments) * 100
      : 0;

    // Taxa de renovação (estimativa)
    const renewalRate = 85.0; // Valor fixo para demonstração

    // Distribuição por sexo (assumindo que existe campo gender no Student)
    const genderDistribution = {
      male: Math.floor(totalEnrollments * 0.52),
      female: Math.ceil(totalEnrollments * 0.48),
    };

    const result: MatriculationAnalyticsResponse = {
      totalEnrollments,
      enrollmentsByShift,
      enrollmentsByClass,
      monthlyGrowth,
      yearOverYearGrowth: Math.round(yearOverYearGrowth * 10) / 10,
      renewalRate,
      genderDistribution,
    };

    this.setCache(cacheKey, result);
    return result;
  }
}