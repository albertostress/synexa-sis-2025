import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Inbox, 
  Eye, 
  Search, 
  Filter,
  Plus,
  MessageSquare,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Mail,
  MailOpen,
  Trash2,
  Edit,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  communicationAPI,
  classesAPI, 
  studentsAPI,
  usersAPI 
} from '@/lib/api';
import {
  CommunicationMessage,
  CreateMessageDto,
  MessageFilters,
  MessagePriority,
  MessageAudience,
  MessagePriorityLabels,
  MessagePriorityColors,
  MessageAudienceLabels,
  CommunicationStats,
  MESSAGE_CONSTRAINTS
} from '@/types/communication';

// Schema de validação para nova mensagem
const messageSchema = z.object({
  title: z.string()
    .min(MESSAGE_CONSTRAINTS.TITLE_MIN_LENGTH, `Título deve ter pelo menos ${MESSAGE_CONSTRAINTS.TITLE_MIN_LENGTH} caracteres`)
    .max(MESSAGE_CONSTRAINTS.TITLE_MAX_LENGTH, `Título deve ter no máximo ${MESSAGE_CONSTRAINTS.TITLE_MAX_LENGTH} caracteres`),
  content: z.string()
    .min(MESSAGE_CONSTRAINTS.CONTENT_MIN_LENGTH, `Conteúdo deve ter pelo menos ${MESSAGE_CONSTRAINTS.CONTENT_MIN_LENGTH} caracteres`)
    .max(MESSAGE_CONSTRAINTS.CONTENT_MAX_LENGTH, `Conteúdo deve ter no máximo ${MESSAGE_CONSTRAINTS.CONTENT_MAX_LENGTH} caracteres`),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  audience: z.array(z.string()).min(1, 'Selecione pelo menos um público-alvo'),
  targetClassId: z.string().optional(),
  targetUsers: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function Communication() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'inbox' | 'sent'>('inbox');
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<CommunicationMessage | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Form setup
  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      title: '',
      content: '',
      priority: 'NORMAL',
      audience: [],
      targetClassId: '',
      targetUsers: [],
    },
  });

  // ==================== QUERIES ====================

  // Buscar mensagens do inbox
  const { data: inboxData, isLoading: loadingInbox } = useQuery({
    queryKey: ['inbox-messages', searchTerm, priorityFilter, statusFilter, audienceFilter, page],
    queryFn: () => {
      const filters: MessageFilters = {
        page,
        limit,
        ...(searchTerm && { searchTerm }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter as MessagePriority }),
        ...(audienceFilter !== 'all' && { audience: audienceFilter as MessageAudience }),
        ...(statusFilter === 'unread' && { isRead: false }),
        ...(statusFilter === 'read' && { isRead: true }),
        includeExpired: false,
      };
      return communicationAPI.getInboxMessages(filters);
    },
    enabled: viewMode === 'inbox',
  });

  // Buscar mensagens enviadas
  const { data: sentData, isLoading: loadingSent } = useQuery({
    queryKey: ['sent-messages', page],
    queryFn: () => communicationAPI.getSentMessages(page, limit),
    enabled: viewMode === 'sent' && communicationAPI.canCreateMessage(user?.role || ''),
  });

  // Buscar estatísticas (admin/diretor)
  const { data: stats } = useQuery({
    queryKey: ['communication-stats'],
    queryFn: communicationAPI.getStats,
    enabled: communicationAPI.canViewStats(user?.role || ''),
  });

  // Buscar turmas (para seleção)
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: classesAPI.getAll,
  });

  // Buscar usuários (para seleção individual)
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersAPI.getAll,
  });

  // ==================== MUTATIONS ====================

  // Criar nova mensagem
  const createMessageMutation = useMutation({
    mutationFn: (data: CreateMessageDto) => communicationAPI.createMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages'] });
      queryClient.invalidateQueries({ queryKey: ['sent-messages'] });
      queryClient.invalidateQueries({ queryKey: ['communication-stats'] });
      
      toast({
        title: 'Mensagem Enviada!',
        description: 'A mensagem foi enviada com sucesso.',
      });
      
      setIsNewMessageOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Enviar Mensagem',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => communicationAPI.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages'] });
    },
  });

  // Deletar mensagem
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => communicationAPI.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages'] });
      queryClient.invalidateQueries({ queryKey: ['sent-messages'] });
      
      toast({
        title: 'Mensagem Removida',
        description: 'A mensagem foi removida com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Remover Mensagem',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // ==================== HANDLERS ====================

  const handleSubmitMessage = (data: MessageFormData) => {
    const createData: CreateMessageDto = {
      title: data.title,
      content: data.content,
      priority: data.priority as MessagePriority,
      audience: data.audience as MessageAudience[],
      ...(data.targetClassId && { targetClassId: data.targetClassId }),
      ...(data.targetUsers && data.targetUsers.length > 0 && { targetUsers: data.targetUsers }),
      ...(data.expiresAt && { expiresAt: data.expiresAt }),
    };

    createMessageMutation.mutate(createData);
  };

  const handleMarkAsRead = (messageId: string) => {
    markAsReadMutation.mutate(messageId);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta mensagem?')) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const handleViewMessage = (message: CommunicationMessage) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      handleMarkAsRead(message.id);
    }
  };

  // ==================== COMPUTED VALUES ====================

  const currentMessages = viewMode === 'inbox' ? inboxData?.data || [] : sentData?.data || [];
  const currentPagination = viewMode === 'inbox' ? inboxData?.pagination : sentData?.pagination;
  const isLoading = viewMode === 'inbox' ? loadingInbox : loadingSent;

  // KPIs calculados
  const totalMessages = stats?.totalMessages || currentMessages.length;
  const unreadCount = currentMessages.filter(m => !m.isRead).length;
  const urgentCount = currentMessages.filter(m => m.priority === 'URGENT' && !m.isExpired).length;
  const averageReadRate = stats?.averageReadRate || 0;

  // Verificar permissões
  const canCreateMessage = communicationAPI.canCreateMessage(user?.role || '');
  const canViewStats = communicationAPI.canViewStats(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comunicação Escolar</h1>
          <p className="text-muted-foreground">
            Sistema de mensagens interno adaptado para escolas angolanas
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Toggle View Mode */}
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inbox">
                <div className="flex items-center space-x-2">
                  <Inbox className="w-4 h-4" />
                  <span>Caixa de Entrada</span>
                </div>
              </SelectItem>
              {canCreateMessage && (
                <SelectItem value="sent">
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Mensagens Enviadas</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {/* Nova Mensagem */}
          {canCreateMessage && (
            <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Mensagem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Mensagem</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmitMessage)} className="space-y-4">
                    {/* Título */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Assunto da mensagem..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Público-alvo */}
                    <FormField
                      control={form.control}
                      name="audience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Público-alvo</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value?.[0] || ''}
                              onValueChange={(value) => field.onChange([value])}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o público-alvo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PARENTS">👨‍👩‍👧‍👦 Todos os Pais</SelectItem>
                                <SelectItem value="TEACHERS">👩‍🏫 Todos os Professores</SelectItem>
                                <SelectItem value="ALL_STAFF">👥 Todo o Pessoal</SelectItem>
                                <SelectItem value="SPECIFIC_CLASS">🎓 Turma Específica</SelectItem>
                                <SelectItem value="INDIVIDUAL">👤 Usuários Específicos</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Turma específica (se selecionado) */}
                    {form.watch('audience')?.includes('SPECIFIC_CLASS') && (
                      <FormField
                        control={form.control}
                        name="targetClassId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Turma</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a turma" />
                                </SelectTrigger>
                                <SelectContent>
                                  {classes.map((cls: any) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                      {cls.name} - {cls.shift} - {cls.year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Prioridade */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW">🔵 Baixa</SelectItem>
                                <SelectItem value="NORMAL">⚪ Normal</SelectItem>
                                <SelectItem value="HIGH">🟡 Alta</SelectItem>
                                <SelectItem value="URGENT">🔴 Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Conteúdo */}
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagem</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Digite sua mensagem aqui..."
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Botões */}
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsNewMessageOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMessageMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createMessageMutation.isPending ? (
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Enviar Mensagem
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {viewMode === 'inbox' ? 'recebidas' : 'enviadas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              mensagens pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
            <p className="text-xs text-muted-foreground">
              prioridade alta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Leitura</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{averageReadRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              média geral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar mensagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de Prioridade */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="URGENT">🔴 Urgente</SelectItem>
                <SelectItem value="HIGH">🟡 Alta</SelectItem>
                <SelectItem value="NORMAL">⚪ Normal</SelectItem>
                <SelectItem value="LOW">🔵 Baixa</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Status (apenas inbox) */}
            {viewMode === 'inbox' && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="unread">Não lidas</SelectItem>
                  <SelectItem value="read">Lidas</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Filtro de Audiência */}
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as audiências" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as audiências</SelectItem>
                <SelectItem value="PARENTS">👨‍👩‍👧‍👦 Pais</SelectItem>
                <SelectItem value="TEACHERS">👩‍🏫 Professores</SelectItem>
                <SelectItem value="ALL_STAFF">👥 Pessoal</SelectItem>
                <SelectItem value="SPECIFIC_CLASS">🎓 Turma</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {viewMode === 'inbox' ? 'Caixa de Entrada' : 'Mensagens Enviadas'}
            </span>
            {currentPagination && (
              <span className="text-sm text-muted-foreground">
                {currentPagination.total} mensagem(s)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : currentMessages.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="w-32">Prioridade</TableHead>
                  <TableHead className="w-40">
                    {viewMode === 'inbox' ? 'Remetente' : 'Destinatários'}
                  </TableHead>
                  <TableHead className="w-32">Data</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMessages.map((message) => (
                  <TableRow 
                    key={message.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      !message.isRead && viewMode === 'inbox' ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleViewMessage(message)}
                  >
                    {/* Status Icon */}
                    <TableCell>
                      {viewMode === 'inbox' ? (
                        message.isRead ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Mail className="h-4 w-4 text-blue-600" />
                        )
                      ) : (
                        <Send className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>

                    {/* Título */}
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span className={!message.isRead && viewMode === 'inbox' ? 'font-bold' : ''}>
                          {message.title}
                        </span>
                        {message.priority === 'URGENT' && !message.isExpired && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>

                    {/* Prioridade */}
                    <TableCell>
                      <Badge className={MessagePriorityColors[message.priority]}>
                        {MessagePriorityLabels[message.priority]}
                      </Badge>
                    </TableCell>

                    {/* Remetente/Destinatários */}
                    <TableCell>
                      {viewMode === 'inbox' ? (
                        <span className="text-sm">{message.creator.name}</span>
                      ) : (
                        <div className="text-sm">
                          <div>{communicationAPI.formatAudience(message.audience, message.targetClassId)}</div>
                          <div className="text-muted-foreground text-xs">
                            {message.readCount}/{message.totalRecipients} lidas
                          </div>
                        </div>
                      )}
                    </TableCell>

                    {/* Data */}
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(message.createdAt), 'dd/MM/yy HH:mm', { locale: pt })}
                    </TableCell>

                    {/* Ações */}
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMessage(message);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {communicationAPI.canEditMessage(
                          message.createdBy, 
                          user?.id || '', 
                          user?.role || ''
                        ) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(message.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Paginação */}
          {currentPagination && currentPagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPagination.page} de {currentPagination.pages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPagination.page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPagination.page >= currentPagination.pages}
                  onClick={() => setPage(Math.min(currentPagination.pages, page + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização de Mensagem */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center space-x-2">
                  <span>{selectedMessage.title}</span>
                  <Badge className={MessagePriorityColors[selectedMessage.priority]}>
                    {MessagePriorityLabels[selectedMessage.priority]}
                  </Badge>
                </DialogTitle>
                {selectedMessage.priority === 'URGENT' && !selectedMessage.isExpired && (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Metadados */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">De:</span> {selectedMessage.creator.name}
                </div>
                <div>
                  <span className="font-medium">Data:</span> {communicationAPI.formatDate(selectedMessage.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Para:</span> {communicationAPI.formatAudience(selectedMessage.audience, selectedMessage.targetClassId)}
                </div>
                {viewMode === 'sent' && (
                  <div>
                    <span className="font-medium">Leituras:</span> {selectedMessage.readCount}/{selectedMessage.totalRecipients} ({communicationAPI.calculateReadRate(selectedMessage.readCount, selectedMessage.totalRecipients)}%)
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="whitespace-pre-wrap text-sm">
                  {selectedMessage.content}
                </div>
              </div>

              {/* Expiração (se aplicável) */}
              {selectedMessage.expiresAt && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Expira em: {format(new Date(selectedMessage.expiresAt), 'dd/MM/yyyy HH:mm', { locale: pt })}
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Informações sobre Sistema de Comunicação */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Comunicação Escolar Angola</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Funcionalidades:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="text-primary font-medium">Mensagens organizadas</span> por prioridade</li>
                <li>• <span className="text-primary font-medium">Público-alvo específico</span> (pais, professores, turmas)</li>
                <li>• <span className="text-primary font-medium">Controle de leitura</span> individual</li>
                <li>• <span className="text-primary font-medium">Busca avançada</span> e filtros</li>
                <li>• <span className="text-primary font-medium">Estatísticas de engagement</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Níveis de Prioridade:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="text-blue-600 font-medium">Baixa:</span> Informações gerais</li>
                <li>• <span className="text-gray-600 font-medium">Normal:</span> Comunicados padrão</li>
                <li>• <span className="text-yellow-600 font-medium">Alta:</span> Informações importantes</li>
                <li>• <span className="text-red-600 font-medium">Urgente:</span> Questões críticas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}