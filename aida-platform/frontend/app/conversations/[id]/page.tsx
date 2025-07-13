'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Send,
  Bot,
  User,
  Phone,
  Clock,
  MessageSquare,
  Archive,
  Star,
  AlertTriangle,
  MoreVertical,
  Download,
  Tag,
  Info,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';

// Mock data - será substituído por dados reais da API
const mockConversation = {
  id: '1',
  customer_name: 'João Silva',
  customer_phone: '+5511999999999',
  customer_avatar: null,
  status: 'active' as const,
  priority: 'medium' as const,
  assistant_id: '1',
  assistant_name: 'Assistente Vendas',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  updated_at: new Date(Date.now() - 1000 * 60 * 15),
  tags: ['vendas', 'produto-x'],
  satisfaction_score: null,
  customer_info: {
    email: 'joao.silva@email.com',
    location: 'São Paulo, SP',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    previous_conversations: 3
  }
};

const mockMessages = [
  {
    id: '1',
    conversation_id: '1',
    sender_type: 'customer' as const,
    sender_name: 'João Silva',
    content: 'Olá! Gostaria de saber mais sobre o produto X.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    message_type: 'text' as const,
    read: true,
    delivered: true
  },
  {
    id: '2',
    conversation_id: '1',
    sender_type: 'assistant' as const,
    sender_name: 'Assistente Vendas',
    content: 'Olá João! Fico feliz em ajudá-lo com informações sobre o produto X. É um excelente produto que oferece várias funcionalidades importantes. Você gostaria de saber sobre algum aspecto específico?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 30000),
    message_type: 'text' as const,
    read: true,
    delivered: true,
    ai_confidence: 0.95
  },
  {
    id: '3',
    conversation_id: '1',
    sender_type: 'customer' as const,
    sender_name: 'João Silva',
    content: 'Sim, gostaria de saber sobre o preço e condições de pagamento.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1 - 30000),
    message_type: 'text' as const,
    read: true,
    delivered: true
  },
  {
    id: '4',
    conversation_id: '1',
    sender_type: 'assistant' as const,
    sender_name: 'Assistente Vendas',
    content: 'Claro! O produto X tem um valor de R$ 299,90 e oferecemos várias opções de pagamento:\n\n• À vista: 10% de desconto (R$ 269,91)\n• Cartão de crédito: até 12x sem juros\n• PIX: 5% de desconto (R$ 284,90)\n\nTambém temos uma garantia de 30 dias. Gostaria de mais detalhes sobre alguma dessas opções?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
    message_type: 'text' as const,
    read: true,
    delivered: true,
    ai_confidence: 0.92
  },
  {
    id: '5',
    conversation_id: '1',
    sender_type: 'customer' as const,
    sender_name: 'João Silva',
    content: 'Perfeito! Gostaria de fazer o pedido. Como procedo?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    message_type: 'text' as const,
    read: true,
    delivered: true
  },
  {
    id: '6',
    conversation_id: '1',
    sender_type: 'assistant' as const,
    sender_name: 'Assistente Vendas',
    content: 'Excelente escolha, João! Para finalizar seu pedido, vou transferir você para nossa equipe comercial que irá auxiliá-lo com todos os detalhes. Eles entrarão em contato em até 15 minutos. Obrigado pelo interesse!',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    message_type: 'text' as const,
    read: false,
    delivered: true,
    ai_confidence: 0.88,
    escalated: true
  }
];

const statusConfig = {
  active: { label: 'Ativa', variant: 'default' as const, color: 'bg-green-500' },
  pending: { label: 'Pendente', variant: 'secondary' as const, color: 'bg-yellow-500' },
  resolved: { label: 'Resolvida', variant: 'outline' as const, color: 'bg-gray-500' },
  escalated: { label: 'Escalada', variant: 'destructive' as const, color: 'bg-red-500' }
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-blue-500' },
  medium: { label: 'Média', color: 'bg-yellow-500' },
  high: { label: 'Alta', color: 'bg-red-500' }
};

export default function ConversationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { business, apiKey } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('messages');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = params.id as string;

  // TODO: Implementar query real para buscar conversa
  const { data: conversation = mockConversation, isLoading: loadingConversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockConversation;
    },
    enabled: !!conversationId,
  });

  // TODO: Implementar query real para buscar mensagens
  const { data: messages = mockMessages, isLoading: loadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockMessages;
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      // TODO: Implementar envio real de mensagem
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate adding message to the list
      const newMsg = {
        id: String(Date.now()),
        conversation_id: conversationId,
        sender_type: 'human' as const,
        sender_name: 'Operador',
        content: newMessage,
        timestamp: new Date(),
        message_type: 'text' as const,
        read: false,
        delivered: true
      };
      
      setNewMessage('');
      refetchMessages();
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const updateConversationStatus = async (newStatus: string) => {
    try {
      // TODO: Implementar atualização real de status
      console.log(`Updating conversation ${conversationId} to status: ${newStatus}`);
    } catch (error) {
      console.error('Error updating conversation status:', error);
    }
  };

  const addTag = async (tag: string) => {
    try {
      // TODO: Implementar adição real de tag
      console.log(`Adding tag ${tag} to conversation ${conversationId}`);
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  if (loadingConversation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Carregando conversa..." />
      </div>
    );
  }

  const status = statusConfig[conversation.status];
  const priority = priorityConfig[conversation.priority];
  const initials = conversation.customer_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/conversations">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.customer_avatar || ''} alt={conversation.customer_name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full ${status.color} border-2 border-background`} />
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold">{conversation.customer_name}</h2>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{conversation.customer_phone}</span>
                    <span>•</span>
                    <Bot className="h-3 w-3" />
                    <span>{conversation.assistant_name}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={status.variant}>
                {status.label}
              </Badge>
              <div className={`h-2 w-2 rounded-full ${priority.color}`} title={`Prioridade ${priority.label}`} />
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner text="Carregando mensagens..." />
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[70%] ${message.sender_type === 'customer' ? 'order-2' : 'order-1'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {message.sender_type === 'customer' && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="" alt={message.sender_name} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                      )}
                      {message.sender_type === 'assistant' && (
                        <Bot className="h-5 w-5 text-primary" />
                      )}
                      {message.sender_type === 'human' && (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(message.timestamp)}
                      </span>
                      {message.escalated && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" title="Conversa escalada" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${
                      message.sender_type === 'customer' 
                        ? 'bg-muted' 
                        : message.sender_type === 'assistant'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-blue-600 text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.ai_confidence && (
                        <div className="mt-2 flex items-center space-x-1 text-xs opacity-75">
                          <CheckCircle className="h-3 w-3" />
                          <span>Confiança: {Math.round(message.ai_confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={sending}
              />
            </div>
            <Button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim()}
              size="icon"
              className="self-end mb-1"
            >
              {sending ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
            <span>
              {conversation.status === 'active' ? 'Cliente online' : 'Cliente offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l bg-muted/50">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="actions">Ações</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Nome:</span>
                  <span>{conversation.customer_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Telefone:</span>
                  <span className="font-mono">{conversation.customer_phone}</span>
                </div>
                {conversation.customer_info.email && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="truncate">{conversation.customer_info.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Localização:</span>
                  <span>{conversation.customer_info.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Conversas anteriores:</span>
                  <span>{conversation.customer_info.previous_conversations}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prioridade:</span>
                  <div className="flex items-center space-x-1">
                    <div className={`h-2 w-2 rounded-full ${priority.color}`} />
                    <span>{priority.label}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assistente:</span>
                  <span>{conversation.assistant_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Iniciada:</span>
                  <span>{formatRelativeTime(conversation.created_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Última mensagem:</span>
                  <span>{formatRelativeTime(conversation.updated_at)}</span>
                </div>
              </CardContent>
            </Card>

            {conversation.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {conversation.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="actions" className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status da Conversa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={conversation.status} onValueChange={updateConversationStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="escalated">Escalada</SelectItem>
                    <SelectItem value="resolved">Resolvida</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar Conversa
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Star className="mr-2 h-4 w-4" />
                  Marcar como Favorita
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Conversa
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Tag className="mr-2 h-4 w-4" />
                  Adicionar Tag
                </Button>
              </CardContent>
            </Card>

            {conversation.satisfaction_score && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Avaliação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="text-lg font-semibold">{conversation.satisfaction_score}/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avaliação do cliente
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}