/**
 * Communication Service - Serviço de comunicação interna
 * Referência: context7 mcp - NestJS Services Pattern
 */
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, MessageAudience, MessagePriority } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { ReplyThreadDto } from './dto/reply-thread.dto';
import { FilterThreadsDto } from './dto/filter-threads.dto';

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

  // =============================================
  // MÉTODOS PARA SISTEMA DE THREADS/CONVERSAS
  // =============================================

  async createThread(createThreadDto: CreateThreadDto, createdById: string) {
    const { subject, content, participantIds } = createThreadDto;

    // Validar que os participantes existem
    const participants = await this.prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, name: true, role: true },
    });

    if (participants.length !== participantIds.length) {
      throw new BadRequestException('Um ou mais participantes não foram encontrados');
    }

    // Adicionar o criador à lista de participantes se não estiver incluído
    const allParticipantIds = [...new Set([createdById, ...participantIds])];
    
    // Buscar dados do criador
    const creator = await this.prisma.user.findUnique({
      where: { id: createdById },
      select: { id: true, name: true, role: true },
    });

    if (!creator) {
      throw new BadRequestException('Criador da conversa não encontrado');
    }

    // Criar conversa com primeira mensagem
    const conversation = await this.prisma.conversation.create({
      data: {
        subject,
        participants: {
          create: allParticipantIds.map(userId => ({
            userId,
            role: userId === createdById ? creator.role : 
                  participants.find(p => p.id === userId)?.role || 'PROFESSOR',
          })),
        },
        messages: {
          create: {
            content,
            senderId: createdById,
            readBy: [createdById], // Criador já leu automaticamente
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Formatar resposta
    const lastMessage = conversation.messages[0];
    const currentUserParticipant = conversation.participants.find(p => p.userId === createdById);

    return {
      id: conversation.id,
      subject: conversation.subject,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      participants: conversation.participants.map(p => ({
        id: p.user.id,
        name: p.user.name,
        role: p.user.role,
        isMuted: p.isMuted,
        isArchived: p.isArchived,
        joinedAt: p.joinedAt.toISOString(),
      })),
      messageCount: 1,
      unreadCount: 0, // Criador já leu
      lastMessage: {
        id: lastMessage.id,
        content: lastMessage.content,
        senderId: lastMessage.senderId,
        sender: lastMessage.sender,
        readBy: lastMessage.readBy,
        isRead: lastMessage.readBy.includes(createdById),
        createdAt: lastMessage.createdAt.toISOString(),
        updatedAt: lastMessage.updatedAt.toISOString(),
      },
      isArchived: currentUserParticipant?.isArchived || false,
      isMuted: currentUserParticipant?.isMuted || false,
    };
  }

  async getUserThreads(userId: string, filters: FilterThreadsDto) {
    const {
      search,
      unread,
      archived = false,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Construir condições de filtro
    const where: any = {
      participants: {
        some: {
          userId,
          isArchived: archived,
        },
      },
    };

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        {
          messages: {
            some: {
              content: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // Buscar conversas
    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, role: true },
              },
            },
          },
          messages: {
            include: {
              sender: {
                select: { id: true, name: true, role: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    // Processar conversas para incluir estatísticas do usuário
    const processedThreads = conversations.map(conversation => {
      const userParticipant = conversation.participants.find(p => p.userId === userId);
      const lastMessage = conversation.messages[0];
      
      // Calcular mensagens não lidas
      const unreadMessages = conversation.messages.filter(msg => 
        !msg.readBy.includes(userId) && msg.senderId !== userId
      );
      const unreadCount = unreadMessages.length;

      return {
        id: conversation.id,
        subject: conversation.subject,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        participants: conversation.participants.map(p => ({
          id: p.user.id,
          name: p.user.name,
          role: p.user.role,
          isMuted: p.isMuted,
          isArchived: p.isArchived,
          joinedAt: p.joinedAt.toISOString(),
        })),
        messageCount: conversation._count.messages,
        unreadCount,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          sender: lastMessage.sender,
          readBy: lastMessage.readBy,
          isRead: lastMessage.readBy.includes(userId),
          createdAt: lastMessage.createdAt.toISOString(),
          updatedAt: lastMessage.updatedAt.toISOString(),
        } : null,
        isArchived: userParticipant?.isArchived || false,
        isMuted: userParticipant?.isMuted || false,
      };
    });

    // Filtrar por status de leitura se especificado
    let filteredThreads = processedThreads;
    if (unread !== undefined) {
      filteredThreads = processedThreads.filter(thread => {
        const hasUnread = thread.unreadCount > 0;
        return unread ? hasUnread : !hasUnread;
      });
    }

    // Calcular estatísticas gerais do usuário
    const allUserThreads = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          where: { userId },
        },
        messages: {
          select: { readBy: true, senderId: true },
        },
      },
    });

    const totalThreads = allUserThreads.length;
    const unreadThreads = allUserThreads.filter(thread => 
      thread.messages.some(msg => !msg.readBy.includes(userId) && msg.senderId !== userId)
    ).length;
    const archivedThreads = allUserThreads.filter(thread => 
      thread.participants[0]?.isArchived
    ).length;
    const mutedThreads = allUserThreads.filter(thread => 
      thread.participants[0]?.isMuted
    ).length;

    const pages = Math.ceil(total / limit);

    return {
      data: filteredThreads,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
      summary: {
        totalThreads,
        unreadThreads,
        archivedThreads,
        mutedThreads,
      },
    };
  }

  async getThreadById(threadId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: threadId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada ou usuário sem acesso');
    }

    const userParticipant = conversation.participants.find(p => p.userId === userId);
    const unreadCount = conversation.messages.filter(msg => 
      !msg.readBy.includes(userId) && msg.senderId !== userId
    ).length;

    return {
      id: conversation.id,
      subject: conversation.subject,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      participants: conversation.participants.map(p => ({
        id: p.user.id,
        name: p.user.name,
        role: p.user.role,
        isMuted: p.isMuted,
        isArchived: p.isArchived,
        joinedAt: p.joinedAt.toISOString(),
      })),
      messageCount: conversation.messages.length,
      unreadCount,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        sender: msg.sender,
        readBy: msg.readBy,
        isRead: msg.readBy.includes(userId),
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
      })),
      isArchived: userParticipant?.isArchived || false,
      isMuted: userParticipant?.isMuted || false,
    };
  }

  async replyToThread(threadId: string, replyDto: ReplyThreadDto, userId: string) {
    const { content } = replyDto;

    // Verificar se o usuário é participante da conversa
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: threadId,
        participants: {
          some: { userId },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada ou usuário sem acesso');
    }

    // Criar nova mensagem
    const message = await this.prisma.conversationMessage.create({
      data: {
        content,
        senderId: userId,
        conversationId: threadId,
        readBy: [userId], // Remetente já leu automaticamente
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Atualizar timestamp da conversa
    await this.prisma.conversation.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      sender: message.sender,
      readBy: message.readBy,
      isRead: true, // Remetente sempre leu
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    };
  }

  async markThreadAsRead(threadId: string, userId: string) {
    // Verificar se o usuário é participante da conversa
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: threadId,
        participants: {
          some: { userId },
        },
      },
      include: {
        messages: {
          where: {
            AND: [
              { NOT: { readBy: { has: userId } } },
              { NOT: { senderId: userId } },
            ],
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada ou usuário sem acesso');
    }

    // Marcar todas as mensagens não lidas como lidas
    const messagesToUpdate = conversation.messages.map(msg => {
      const readBy = [...msg.readBy];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
      }
      return { id: msg.id, readBy };
    });

    if (messagesToUpdate.length > 0) {
      await Promise.all(
        messagesToUpdate.map(msg =>
          this.prisma.conversationMessage.update({
            where: { id: msg.id },
            data: { readBy: msg.readBy },
          })
        )
      );
    }

    return { 
      success: true, 
      message: `${messagesToUpdate.length} mensagens marcadas como lidas`
    };
  }

  async getThreadParticipants(threadId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: threadId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada ou usuário sem acesso');
    }

    return conversation.participants.map(p => ({
      id: p.user.id,
      name: p.user.name,
      role: p.user.role,
      isMuted: p.isMuted,
      isArchived: p.isArchived,
      joinedAt: p.joinedAt.toISOString(),
    }));
  }
}