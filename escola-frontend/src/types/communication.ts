/**
 * Tipos para módulo de Comunicação - Sistema Escolar Angolano
 * Integração completa com backend NestJS
 */

// Prioridades de mensagem
export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

// Tipos de audiência 
export type MessageAudience = 
  | 'PARENTS'        // Todos os pais
  | 'TEACHERS'       // Todos os professores
  | 'ALL_STAFF'      // Todo o pessoal (admin, diretor, secretaria, professores)
  | 'SPECIFIC_CLASS' // Alunos e professores de uma turma específica
  | 'INDIVIDUAL'     // Usuários específicos por ID
  | 'GROUP';         // Grupo personalizado

// Status de leitura para interface
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

// Interface principal da mensagem
export interface CommunicationMessage {
  id: string;
  title: string;
  content: string;
  priority: MessagePriority;
  audience: MessageAudience[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creator: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  readBy?: string[]; // Array de IDs de usuários que leram
  isDeleted: boolean;
  targetUsers?: string[]; // IDs específicos (para audience INDIVIDUAL/GROUP)
  targetClassId?: string; // ID da turma (para audience SPECIFIC_CLASS)
  expiresAt?: string;
  isExpired: boolean;
  // Campos calculados pelo backend
  totalRecipients: number;
  readCount: number;
  isRead: boolean; // Se o usuário atual leu
}

// Interface para criação de mensagem
export interface CreateMessageDto {
  title: string;
  content: string;
  priority: MessagePriority;
  audience: MessageAudience[];
  targetUsers?: string[]; // Para INDIVIDUAL/GROUP
  targetClassId?: string; // Para SPECIFIC_CLASS
  expiresAt?: string; // Data de expiração (opcional)
}

// Interface para atualização de mensagem
export interface UpdateMessageDto {
  title?: string;
  content?: string;
  priority?: MessagePriority;
  audience?: MessageAudience[];
  targetUsers?: string[];
  targetClassId?: string;
  expiresAt?: string;
}

// Interface para filtros de busca
export interface MessageFilters {
  priority?: MessagePriority;
  audience?: MessageAudience;
  startDate?: string;
  endDate?: string;
  isRead?: boolean;
  searchTerm?: string; // Busca em título e conteúdo
  includeExpired?: boolean;
  page?: number;
  limit?: number;
}

// Interface para resposta paginada
export interface MessageListResponse {
  data: CommunicationMessage[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface para estatísticas (admin/diretor)
export interface CommunicationStats {
  totalMessages: number;
  activeMessages: number; // Não expiradas
  averageReadRate: number;
  messagesByPriority: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    URGENT: number;
  };
  messagesByAudience: {
    PARENTS: number;
    TEACHERS: number;
    ALL_STAFF: number;
    SPECIFIC_CLASS: number;
    INDIVIDUAL: number;
    GROUP: number;
  };
  readRateByPriority: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    URGENT: number;
  };
  recentActivity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

// Interface para inbox/caixa de entrada
export interface InboxMessage extends CommunicationMessage {
  isUrgent: boolean; // Calculado: priority === 'URGENT'
  daysUntilExpiry?: number; // Dias até expirar (se aplicável)
  audienceDisplay: string; // Texto formatado da audiência
}

// Interface para mensagens enviadas
export interface SentMessage extends CommunicationMessage {
  deliveryStatus: 'SENDING' | 'DELIVERED' | 'FAILED';
  recipientDetails: {
    total: number;
    delivered: number;
    read: number;
    pending: number;
  };
}

// Labels traduzidos para português angolano
export const MessagePriorityLabels: Record<MessagePriority, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

// Cores para badges de prioridade
export const MessagePriorityColors: Record<MessagePriority, string> = {
  LOW: 'bg-gray-100 text-gray-800 border-gray-200',
  NORMAL: 'bg-blue-100 text-blue-800 border-blue-200',
  HIGH: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  URGENT: 'bg-red-100 text-red-800 border-red-200',
};

// Labels de audiência
export const MessageAudienceLabels: Record<MessageAudience, string> = {
  PARENTS: 'Todos os Pais',
  TEACHERS: 'Todos os Professores',
  ALL_STAFF: 'Todo o Pessoal',
  SPECIFIC_CLASS: 'Turma Específica',
  INDIVIDUAL: 'Usuários Específicos',
  GROUP: 'Grupo Personalizado',
};

// Ícones para cada tipo de audiência
export const MessageAudienceIcons: Record<MessageAudience, string> = {
  PARENTS: '👨‍👩‍👧‍👦',
  TEACHERS: '👩‍🏫',
  ALL_STAFF: '👥',
  SPECIFIC_CLASS: '🎓',
  INDIVIDUAL: '👤',
  GROUP: '👫',
};

// Status calculados para interface
export const MessageStatusLabels: Record<MessageStatus, string> = {
  SENT: 'Enviada',
  DELIVERED: 'Entregue',
  READ: 'Lida',
};

export const MessageStatusColors: Record<MessageStatus, string> = {
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  DELIVERED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  READ: 'bg-green-100 text-green-800 border-green-200',
};

// Interface para seleção de usuários
export interface UserForSelection {
  id: string;
  name: string;
  email: string;
  role: string;
  isSelected?: boolean;
}

// Interface para seleção de turmas
export interface ClassForSelection {
  id: string;
  name: string;
  shift: string;
  year: number;
  studentCount: number;
  teacherCount: number;
}

// Interface para composer de mensagem
export interface MessageComposer {
  to: MessageAudience[];
  targetUsers: string[];
  targetClassId?: string;
  subject: string;
  content: string;
  priority: MessagePriority;
  expiresAt?: string;
  isDraft: boolean;
}

// Interface para thread de mensagens (futuro)
export interface MessageThread {
  id: string;
  originalMessage: CommunicationMessage;
  replies: CommunicationMessage[];
  participantCount: number;
  lastActivity: string;
}

// Constantes para validação
export const MESSAGE_CONSTRAINTS = {
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  CONTENT_MIN_LENGTH: 10,
  CONTENT_MAX_LENGTH: 2000,
  MAX_TARGET_USERS: 100,
  MAX_EXPIRY_DAYS: 365,
} as const;

// Helper para determinar status visual
export const getMessageStatus = (message: CommunicationMessage): MessageStatus => {
  if (message.isRead) return 'READ';
  if (message.readCount > 0) return 'DELIVERED';
  return 'SENT';
};

// Helper para verificar se mensagem é urgente
export const isUrgentMessage = (message: CommunicationMessage): boolean => {
  return message.priority === 'URGENT' && !message.isExpired;
};

// Helper para calcular taxa de leitura
export const calculateReadRate = (message: CommunicationMessage): number => {
  if (message.totalRecipients === 0) return 0;
  return Math.round((message.readCount / message.totalRecipients) * 100);
};

// Helper para formatear audiência
export const formatAudience = (message: CommunicationMessage): string => {
  if (message.audience.length === 1) {
    const audience = message.audience[0];
    if (audience === 'SPECIFIC_CLASS') {
      return `Turma: ${message.targetClassId || 'Não especificada'}`;
    }
    return MessageAudienceLabels[audience];
  }
  
  if (message.audience.length <= 2) {
    return message.audience.map(a => MessageAudienceLabels[a]).join(', ');
  }
  
  return `${message.audience.length} grupos selecionados`;
};