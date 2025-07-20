/**
 * AIDA Assistentes - Conversations Page
 * Pagina de gerenciamento de conversas dos assistentes
 * PATTERN: Real-time chat interface with filtering
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores';
import { withAuth } from '@/lib/auth';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Search, Filter, Bot, User, Clock, Phone, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface Conversation {
  id: string;
  customer_phone: string;
  customer_name?: string;
  status: 'active' | 'resolved' | 'pending';
  last_message_at: string;
  created_at: string;
  assistant: {
    id: string;
    name: string;
  };
  _count: {
    messages: number;
  };
  messages?: Message[];
}

interface Assistant {
  id: string;
  name: string;
}

function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assistantFilter, setAssistantFilter] = useState<string>('all');
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load conversations and assistants in parallel
      const [conversationsResponse, assistantsResponse] = await Promise.all([
        apiClient.get<{ conversations: Conversation[] }>('/api/conversations'),
        apiClient.get<{ assistants: Assistant[] }>('/api/assistants')
      ]);
      
      if (conversationsResponse.success && conversationsResponse.data) {
        setConversations(conversationsResponse.data.conversations);
      }
      
      if (assistantsResponse.success && assistantsResponse.data) {
        setAssistants(assistantsResponse.data.assistants);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      
      const response = await apiClient.get<{ messages: Message[] }>(
        `/api/conversations/${conversationId}/messages`
      );
      
      if (response.success && response.data) {
        setSelectedConversation(prev => 
          prev ? { ...prev, messages: response.data!.messages } : null
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (!conversation.messages) {
      loadConversationMessages(conversation.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'resolved': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'resolved': return 'Resolvida';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = 
      conversation.customer_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.assistant.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
    const matchesAssistant = assistantFilter === 'all' || conversation.assistant.id === assistantFilter;
    
    return matchesSearch && matchesStatus && matchesAssistant;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversacoes</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as conversas dos seus assistentes de IA
          </p>
        </div>
        
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por telefone, nome ou assistente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="resolved">Resolvida</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={assistantFilter} onValueChange={setAssistantFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assistente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Assistentes</SelectItem>
                {assistants.map((assistant) => (
                  <SelectItem key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conversa encontrada</h3>
            <p className="text-muted-foreground text-center">
              {conversations.length === 0 
                ? 'Suas conversas aparecerao aqui quando os clientes comecarao a interagir com seus assistentes'
                : 'Tente ajustar os filtros para encontrar as conversas que procura'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredConversations.map((conversation) => (
            <Card 
              key={conversation.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleConversationClick(conversation)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">
                        {conversation.customer_name || conversation.customer_phone}
                      </CardTitle>
                      {conversation.customer_name && (
                        <CardDescription className="text-sm">
                          {conversation.customer_phone}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(conversation.status)} text-white text-xs`}
                  >
                    {getStatusLabel(conversation.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="font-medium">{conversation.assistant.name}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{conversation._count.messages} mensagens</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conversation Detail Dialog */}
      <Dialog 
        open={!!selectedConversation} 
        onOpenChange={(open: boolean) => !open && setSelectedConversation(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {selectedConversation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>
                    {selectedConversation.customer_name || selectedConversation.customer_phone}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(selectedConversation.status)} text-white`}
                  >
                    {getStatusLabel(selectedConversation.status)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Conversa com {selectedConversation.assistant.name} • {selectedConversation._count.messages} mensagens
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="h-[500px] w-full border rounded-lg p-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : selectedConversation.messages ? (
                  <div className="space-y-4">
                    {selectedConversation.messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            {message.role === 'user' ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Bot className="h-3 w-3" />
                            )}
                            <span className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(message.timestamp), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Clique para carregar as mensagens</p>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(ConversationsPage);