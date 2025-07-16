/**
 * Communication Service - Serviço de comunicação interna
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, MessageAudience, MessagePriority } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(createMessageDto: CreateMessageDto, createdBy: string) {
    const { targetUsers, classId, audience, ...messageData } = createMessageDto;

    // Determinar destinatários baseado no público-alvo
    let finalTargetUsers: string[] = [];

    for (const audienceType of audience) {
      switch (audienceType) {
        case MessageAudience.PARENTS:
          const parents = await this.prisma.user.findMany({
            where: { role: 'PARENT' },
            select: { id: true },
          });
          finalTargetUsers.push(...parents.map(p => p.id));
          break;

        case MessageAudience.TEACHERS:
          const teachers = await this.prisma.user.findMany({
            where: { role: 'PROFESSOR' },
            select: { id: true },
          });
          finalTargetUsers.push(...teachers.map(t => t.id));
          break;

        case MessageAudience.ALL_STAFF:
          const staff = await this.prisma.user.findMany({
            where: { 
              role: { in: ['ADMIN', 'DIRETOR', 'SECRETARIA', 'PROFESSOR'] }
            },
            select: { id: true },
          });
          finalTargetUsers.push(...staff.map(s => s.id));
          break;

        case MessageAudience.SPECIFIC_CLASS:
          if (!classId) {
            throw new BadRequestException('Class ID é obrigatório para público SPECIFIC_CLASS');
          }

          // Buscar alunos da turma
          const classStudents = await this.prisma.student.findMany({
            where: { classId },
            include: { parents: true },
          });

          // Adicionar pais dos alunos
          const classParents = classStudents
            .flatMap(s => s.parents)
            .map(p => p.id);
          finalTargetUsers.push(...classParents);

          // Buscar professores da turma através da relação com a classe
          const schoolClass = await this.prisma.schoolClass.findUnique({
            where: { id: classId },
            include: { teachers: { include: { user: true } } },
          });
          
          if (schoolClass) {
            const teacherIds = schoolClass.teachers.map(t => t.user.id);
            finalTargetUsers.push(...teacherIds);
          }
          break;

        case MessageAudience.INDIVIDUAL:
        case MessageAudience.GROUP:
          if (!targetUsers || targetUsers.length === 0) {
            throw new BadRequestException('Target users é obrigatório para público INDIVIDUAL ou GROUP');
          }
          finalTargetUsers.push(...targetUsers);
          break;
      }
    }

    // Remover duplicatas
    finalTargetUsers = [...new Set(finalTargetUsers)];

    if (finalTargetUsers.length === 0) {
      throw new BadRequestException('Nenhum destinatário encontrado para os critérios especificados');
    }

    // Criar mensagem
    const message = await this.prisma.communicationMessage.create({
      data: {
        ...messageData,
        audience,
        targetUsers: finalTargetUsers,
        createdBy,
        readBy: [],
      },
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return {
      ...message,
      totalRecipients: finalTargetUsers.length,
      readCount: 0,
      isRead: false,
      isExpired: message.expiresAt ? new Date() > message.expiresAt : false,
    };
  }

  async findUserMessages(userId: string, filters: FilterMessagesDto) {
    const {
      priority,
      audience,
      startDate,
      endDate,
      unread,
      search,
      includeExpired = false,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;
    const now = new Date();

    // Construir condições de filtro
    const where: any = {
      targetUsers: { has: userId },
      isDeleted: false,
    };

    if (priority) {
      where.priority = priority;
    }

    if (audience) {
      where.audience = { has: audience };
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ];
    }

    // Buscar mensagens
    const [messages, total] = await Promise.all([
      this.prisma.communicationMessage.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.communicationMessage.count({ where }),
    ]);

    // Processar mensagens para incluir status de leitura
    const processedMessages = messages.map(message => {
      const readBy = (message.readBy as string[]) || [];
      const isRead = readBy.includes(userId);
      const isExpired = message.expiresAt ? now > message.expiresAt : false;

      return {
        id: message.id,
        title: message.title,
        preview: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        priority: message.priority,
        senderName: message.creator.name,
        createdAt: message.createdAt.toISOString(),
        isRead,
        isExpired,
      };
    });

    // Filtrar por status de leitura se especificado
    let filteredMessages = processedMessages;
    if (unread !== undefined) {
      filteredMessages = processedMessages.filter(msg => msg.isRead !== unread);
    }

    // Calcular estatísticas
    const allUserMessages = await this.prisma.communicationMessage.findMany({
      where: {
        targetUsers: { has: userId },
        isDeleted: false,
      },
      select: { id: true, priority: true, readBy: true, expiresAt: true },
    });

    const totalMessages = allUserMessages.length;
    const unreadMessages = allUserMessages.filter(msg => {
      const readBy = (msg.readBy as string[]) || [];
      return !readBy.includes(userId);
    }).length;
    
    const urgentMessages = allUserMessages.filter(msg => msg.priority === MessagePriority.URGENT).length;
    const expiredMessages = allUserMessages.filter(msg => msg.expiresAt && now > msg.expiresAt).length;

    const pages = Math.ceil(total / limit);

    return {
      data: filteredMessages,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
      summary: {
        totalMessages,
        unreadMessages,
        urgentMessages,
        expiredMessages,
      },
    };
  }

  async findMessage(id: string, userId?: string) {
    const message = await this.prisma.communicationMessage.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    const readBy = (message.readBy as string[]) || [];
    const isRead = userId ? readBy.includes(userId) : false;
    const isExpired = message.expiresAt ? new Date() > message.expiresAt : false;

    return {
      ...message,
      createdBy: message.creator,
      isRead,
      totalRecipients: message.targetUsers.length,
      readCount: readBy.length,
      isExpired,
    };
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.communicationMessage.findFirst({
      where: {
        id: messageId,
        targetUsers: { has: userId },
        isDeleted: false,
      },
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada ou usuário sem acesso');
    }

    const readBy = (message.readBy as string[]) || [];

    if (!readBy.includes(userId)) {
      readBy.push(userId);

      await this.prisma.communicationMessage.update({
        where: { id: messageId },
        data: { readBy },
      });
    }

    return { success: true, message: 'Mensagem marcada como lida' };
  }

  async updateMessage(id: string, updateMessageDto: UpdateMessageDto, userId: string, userRole: string) {
    const message = await this.prisma.communicationMessage.findFirst({
      where: { id, isDeleted: false },
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Verificar permissões
    if (message.createdBy !== userId && !['ADMIN', 'DIRETOR'].includes(userRole)) {
      throw new ForbiddenException('Sem permissão para editar esta mensagem');
    }

    const updatedMessage = await this.prisma.communicationMessage.update({
      where: { id },
      data: updateMessageDto,
      include: {
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    const readBy = (updatedMessage.readBy as string[]) || [];
    const isExpired = updatedMessage.expiresAt ? new Date() > updatedMessage.expiresAt : false;

    return {
      ...updatedMessage,
      createdBy: updatedMessage.creator,
      isRead: readBy.includes(userId),
      totalRecipients: updatedMessage.targetUsers.length,
      readCount: readBy.length,
      isExpired,
    };
  }

  async deleteMessage(id: string, userId: string, userRole: string) {
    const message = await this.prisma.communicationMessage.findFirst({
      where: { id, isDeleted: false },
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Verificar permissões
    if (message.createdBy !== userId && !['ADMIN', 'DIRETOR'].includes(userRole)) {
      throw new ForbiddenException('Sem permissão para deletar esta mensagem');
    }

    await this.prisma.communicationMessage.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { success: true, message: 'Mensagem deletada com sucesso' };
  }

  async getMessageStats(userRole: string) {
    // Apenas admins e diretores podem ver estatísticas
    if (!['ADMIN', 'DIRETOR'].includes(userRole)) {
      throw new ForbiddenException('Sem permissão para acessar estatísticas');
    }

    const messages = await this.prisma.communicationMessage.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        priority: true,
        audience: true,
        readBy: true,
        targetUsers: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    const now = new Date();
    const totalSent = messages.length;
    const activeMessages = messages.filter(msg => !msg.expiresAt || msg.expiresAt > now).length;

    // Calcular taxa de leitura média
    const totalReads = messages.reduce((acc, msg) => {
      const readBy = (msg.readBy as string[]) || [];
      return acc + readBy.length;
    }, 0);

    const totalRecipients = messages.reduce((acc, msg) => acc + msg.targetUsers.length, 0);
    const averageReadRate = totalRecipients > 0 ? (totalReads / totalRecipients) * 100 : 0;

    // Estatísticas por prioridade
    const byPriority = {
      LOW: messages.filter(msg => msg.priority === MessagePriority.LOW).length,
      NORMAL: messages.filter(msg => msg.priority === MessagePriority.NORMAL).length,
      HIGH: messages.filter(msg => msg.priority === MessagePriority.HIGH).length,
      URGENT: messages.filter(msg => msg.priority === MessagePriority.URGENT).length,
    };

    // Estatísticas por público
    const byAudience = {
      PARENTS: 0,
      TEACHERS: 0,
      ALL_STAFF: 0,
      SPECIFIC_CLASS: 0,
      INDIVIDUAL: 0,
      GROUP: 0,
    };

    messages.forEach(msg => {
      msg.audience.forEach(aud => {
        if (byAudience[aud] !== undefined) {
          byAudience[aud]++;
        }
      });
    });

    return {
      totalSent,
      activeMessages,
      averageReadRate: Math.round(averageReadRate * 100) / 100,
      byPriority,
      byAudience,
    };
  }

  async findSentMessages(userId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.communicationMessage.findMany({
        where: {
          createdBy: userId,
          isDeleted: false,
        },
        include: {
          creator: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.communicationMessage.count({
        where: {
          createdBy: userId,
          isDeleted: false,
        },
      }),
    ]);

    const now = new Date();
    const processedMessages = messages.map(message => {
      const readBy = (message.readBy as string[]) || [];
      const isExpired = message.expiresAt ? now > message.expiresAt : false;

      return {
        id: message.id,
        title: message.title,
        preview: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        priority: message.priority,
        senderName: message.creator.name,
        createdAt: message.createdAt.toISOString(),
        isRead: false, // N/A para mensagens enviadas
        isExpired,
        totalRecipients: message.targetUsers.length,
        readCount: readBy.length,
      };
    });

    const pages = Math.ceil(total / limit);

    return {
      data: processedMessages,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
      summary: {
        totalMessages: total,
        unreadMessages: 0, // N/A para mensagens enviadas
        urgentMessages: messages.filter(msg => msg.priority === MessagePriority.URGENT).length,
        expiredMessages: messages.filter(msg => msg.expiresAt && now > msg.expiresAt).length,
      },
    };
  }
}