/**
 * Parents Portal Service - Lógica de negócio para portal dos pais
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { ViewGradesDto } from './dto/view-grades.dto';
import { ViewPaymentsDto, PaymentStatusFilter } from './dto/view-payments.dto';
import {
  StudentGradesEntity,
  StudentPaymentsEntity,
  ParentEntity,
  MessageEntity,
  DocumentEntity,
} from './entities/parent.entity';

@Injectable()
export class ParentsPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async getParentProfile(parentId: string): Promise<ParentEntity> {
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parentEmail: true,
            birthDate: true,
            schoolClass: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Responsável não encontrado');
    }

    return {
      id: parent.id,
      name: parent.name,
      email: parent.email,
      phone: parent.phone || undefined,
      students: parent.students.map((student) => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.parentEmail,
        birthDate: student.birthDate.toISOString().split('T')[0] || '',
        schoolClass: student.schoolClass
          ? {
              id: student.schoolClass.id,
              name: student.schoolClass.name,
              shift: student.schoolClass.shift,
            }
          : undefined,
      })),
      createdAt: parent.createdAt.toISOString(),
    };
  }

  async getStudentGrades(
    parentId: string,
    studentId: string,
    viewGradesDto: ViewGradesDto,
  ): Promise<StudentGradesEntity> {
    // Verificar se o pai tem acesso a este aluno
    await this.validateParentAccess(parentId, studentId);

    const currentYear = viewGradesDto.year || new Date().getFullYear();

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        schoolClass: true,
        grades: {
          where: { year: currentYear },
          include: {
            subject: true,
            teacher: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const grades = student.grades.map((grade) => ({
      subjectName: grade.subject.name,
      grade: grade.value,
      teacherName: grade.teacher.user?.name || 'Professor',
      createdAt: grade.createdAt.toISOString().split('T')[0] || '',
    }));

    const averageGrade = grades.length > 0
      ? grades.reduce((sum, g) => sum + g.grade, 0) / grades.length
      : 0;

    let status = 'EM_RECUPERACAO';
    if (averageGrade >= 7) status = 'APROVADO';
    else if (averageGrade < 5) status = 'REPROVADO';

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.parentEmail,
        birthDate: student.birthDate.toISOString().split('T')[0] || '',
        schoolClass: student.schoolClass
          ? {
              id: student.schoolClass.id,
              name: student.schoolClass.name,
              shift: student.schoolClass.shift,
            }
          : undefined,
      },
      year: currentYear,
      grades,
      averageGrade: Math.round(averageGrade * 100) / 100,
      status,
    };
  }

  async getStudentPayments(
    parentId: string,
    studentId: string,
    viewPaymentsDto: ViewPaymentsDto,
  ): Promise<StudentPaymentsEntity> {
    // Verificar se o pai tem acesso a este aluno
    await this.validateParentAccess(parentId, studentId);

    const currentYear = viewPaymentsDto.year || new Date().getFullYear();
    const statusFilter = viewPaymentsDto.status || PaymentStatusFilter.ALL;
    const limit = viewPaymentsDto.limit || 20;

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        schoolClass: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Buscar faturas relacionadas ao aluno
    const whereClause: any = {
      studentId,
      year: currentYear,
    };

    if (statusFilter !== PaymentStatusFilter.ALL) {
      whereClause.status = statusFilter;
    }

    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        payments: true,
      },
      orderBy: { dueDate: 'desc' },
      take: limit,
    });

    const payments = invoices.map((invoice) => {
      const totalPaid = invoice.payments
.filter((p) => p.paidAt !== null)
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        id: invoice.id,
        description: invoice.description,
        amount: invoice.amount,
        dueDate: invoice.dueDate.toISOString().split('T')[0] || '',
        status: invoice.status,
        totalPaid,
        remainingBalance: invoice.amount - totalPaid,
        period: `${invoice.dueDate.getMonth() + 1}/${invoice.dueDate.getFullYear()}`,
      };
    });

    // Calcular resumo financeiro
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.totalPaid, 0);
    const totalPending = totalAmount - totalPaid;
    const overdueCount = payments.filter(
      (p) => p.status === 'VENCIDA' && p.remainingBalance > 0,
    ).length;

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.parentEmail,
        birthDate: student.birthDate.toISOString().split('T')[0] || '',
        schoolClass: student.schoolClass
          ? {
              id: student.schoolClass.id,
              name: student.schoolClass.name,
              shift: student.schoolClass.shift,
            }
          : undefined,
      },
      payments,
      summary: {
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalPending: Math.round(totalPending * 100) / 100,
        overdueCount,
      },
    };
  }

  async getSchoolMessages(parentId: string): Promise<MessageEntity[]> {
    // Verificar se o responsável existe
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException('Responsável não encontrado');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        published: true,
        OR: [
          { targetRole: null }, // Mensagens gerais
          { targetRole: 'PARENT' }, // Mensagens específicas para pais
        ],
        AND: [
          {
            OR: [
              { expiresAt: null }, // Sem data de expiração
              { expiresAt: { gte: new Date() } }, // Não expiradas
            ],
          },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: 50,
    });

    return messages.map((message) => ({
      id: message.id,
      title: message.title,
      content: message.content,
      type: message.type,
      priority: message.priority,
      author: message.author.name,
      publishedAt: message.publishedAt?.toISOString() || '',
      expiresAt: message.expiresAt?.toISOString(),
    }));
  }

  async getStudentDocuments(
    parentId: string,
    studentId: string,
  ): Promise<DocumentEntity[]> {
    // Verificar se o pai tem acesso a este aluno
    await this.validateParentAccess(parentId, studentId);

    const documents = await this.prisma.document.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return documents.map((doc) => ({
      type: doc.type,
      filename: doc.filename,
      description: doc.description,
      createdAt: doc.createdAt.toISOString(),
      downloadUrl: `/parents-portal/student/${studentId}/docs/${doc.id}/download`,
    }));
  }

  async downloadDocument(
    parentId: string,
    studentId: string,
    docId: string,
    res: Response,
  ): Promise<void> {
    // Verificar se o pai tem acesso a este aluno
    await this.validateParentAccess(parentId, studentId);

    // Buscar o documento
    const document = await this.prisma.document.findFirst({
      where: {
        id: docId,
        studentId,
      },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    // Construir caminho do arquivo
    const filePath = path.join(process.cwd(), 'storage', 'documents', document.filename);

    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Arquivo não encontrado no sistema');
    }

    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);

    // Enviar arquivo
    res.sendFile(filePath);
  }

  private async validateParentAccess(parentId: string, studentId: string): Promise<void> {
    const relationship = await this.prisma.parent.findFirst({
      where: {
        id: parentId,
        students: {
          some: {
            id: studentId,
          },
        },
      },
    });

    if (!relationship) {
      throw new ForbiddenException(
        'Acesso negado: você não tem permissão para ver informações deste aluno',
      );
    }
  }
}