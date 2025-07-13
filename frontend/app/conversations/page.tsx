'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner, SkeletonTable } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MoreVertical,
  Phone,
  User,
  Clock,
  Bot,
  TrendingUp,
  Calendar,
  Archive,
  Star,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime, formatDateTime, truncate } from '@/lib/utils';
import Link from 'next/link';

// Mock data - será substituído por dados reais da API
const mockConversations = [
  {
    id: '1',
    customer_name: 'João Silva',
    customer_phone: '+5511999999999',
    customer_avatar: null,
    last_message: 'Obrigado pela ajuda! Consegui resolver meu problema.',
    last_message_timestamp: new Date(Date.now() - 1000 * 60 * 15),
    status: 'resolved' as const,
    priority: 'medium' as const,
    assistant_id: '1',
    assistant_name: 'Assistente Vendas',
    messages_count: 12,
    unread_count: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
    updated_at: new Date(Date.now() - 1000 * 60 * 15),
    tags: ['vendas', 'resolvido'],
    satisfaction_score: 5
  },
  {
    id: '2',
    customer_name: 'Maria Santos',
    customer_phone: '+5511888888888',
    customer_avatar: null,
    last_message: 'Preciso de mais informações sobre o produto X. Vocês têm disponibilidade para uma reunião?',
    last_message_timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'active' as const,
    priority: 'high' as const,
    assistant_id: '2',
    assistant_name: 'Assistente Suporte',
    messages_count: 8,
    unread_count: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3),
    updated_at: new Date(Date.now() - 1000 * 60 * 30),
    tags: ['suporte', 'urgente'],
    satisfaction_score: null
  },
  {
    id: '3',
    customer_name: 'Pedro Costa',
    customer_phone: '+5511777777777',
    customer_avatar: null,
    last_message: 'Quando vocês abrem amanhã?',
    last_message_timestamp: new Date(Date.now() - 1000 * 60 * 60),
    status: 'pending' as const,
    priority: 'low' as const,
    assistant_id: '1',
    assistant_name: 'Assistente Geral',
    messages_count: 3,
    unread_count: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4),
    updated_at: new Date(Date.now() - 1000 * 60 * 60),
    tags: ['informação'],
    satisfaction_score: null
  },
  {
    id: '4',
    customer_name: 'Ana Oliveira',
    customer_phone: '+5511666666666',
    customer_avatar: null,
    last_message: 'Gostaria de agendar uma reunião para discutir o projeto.',
    last_message_timestamp: new Date(Date.now() - 1000 * 60 * 90),
    status: 'escalated' as const,
    priority: 'high' as const,
    assistant_id: '3',
    assistant_name: 'Assistente Comercial',
    messages_count: 15,
    unread_count: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6),
    updated_at: new Date(Date.now() - 1000 * 60 * 90),
    tags: ['comercial', 'agendamento'],
    satisfaction_score: 4
  }
];

const mockAssistants = [
  { id: '1', name: 'Assistente Vendas' },
  { id: '2', name: 'Assistente Suporte' },
  { id: '3', name: 'Assistente Comercial' },
];

const statusConfig = {
  active: { 
    label: 'Ativa', 
    variant: 'default' as const, 
    color: 'bg-green-500',
    icon: MessageSquare
  },
  pending: { 
    label: 'Pendente', 
    variant: 'secondary' as const, 
    color: 'bg-yellow-500',
    icon: Clock
  },
  resolved: { 
    label: 'Resolvida', 
    variant: 'outline' as const, 
    color: 'bg-gray-500',
    icon: Archive
  },
  escalated: { 
    label: 'Escalada', 
    variant: 'destructive' as const, 
    color: 'bg-red-500',
    icon: AlertTriangle
  }
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-blue-500' },
  medium: { label: 'Média', color: 'bg-yellow-500' },
  high: { label: 'Alta', color: 'bg-red-500' }
};

export default function ConversationsPage() {
  const { business } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Trigger refetch of conversations
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // TODO: Implementar query real para buscar conversas
  const { data: conversations = mockConversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations', business?.id, selectedStatus, selectedAssistant, selectedPriority],
    queryFn: async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockConversations;
    },
    enabled: !!business?.id,
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  const { data: assistants = mockAssistants } = useQuery({
    queryKey: ['assistants-list', business?.id],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockAssistants;
    },
    enabled: !!business?.id,
  });

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.customer_phone.includes(searchTerm) ||
                         conversation.last_message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || conversation.status === selectedStatus;
    const matchesAssistant = selectedAssistant === 'all' || conversation.assistant_id === selectedAssistant;
    const matchesPriority = selectedPriority === 'all' || conversation.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesAssistant && matchesPriority;
  });

  // Statistics
  const stats = {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'active').length,
    pending: conversations.filter(c => c.status === 'pending').length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
    escalated: conversations.filter(c => c.status === 'escalated').length,
    unread: conversations.reduce((sum, c) => sum + c.unread_count, 0)
  };

  const exportConversations = async (format: 'csv' | 'json') => {
    try {
      // TODO: Implementar exportação real
      console.log(`Exporting conversations as ${format}`);
      alert(`Exportação ${format.toUpperCase()} iniciada! Você receberá um email quando estiver pronta.`);
    } catch (error) {
      console.error('Error exporting conversations:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Conversas</h1>
            <p className="text-muted-foreground">Monitore todas as conversas</p>
          </div>
        </div>
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversas</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie todas as conversas dos seus assistentes
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          
          <Button variant="outline" onClick={() => exportConversations('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Conversas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <div className="h-2 w-2 bg-yellow-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escaladas</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.escalated}</div>
            <p className="text-xs text-muted-foreground">Precisam atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
            <div className="h-2 w-2 bg-gray-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Finalizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não lidas</CardTitle>
            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
              {stats.unread}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">Mensagens</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle>Filtros</CardTitle>
              <Badge variant="outline">
                {filteredConversations.length} de {conversations.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cliente, telefone, mensagem..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="escalated">Escaladas</SelectItem>
                    <SelectItem value="resolved">Resolvidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assistente</Label>
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os assistentes</SelectItem>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as prioridades</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visualização</Label>
                <Select value={viewMode} onValueChange={(value: 'list' | 'grid') => setViewMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">Lista</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Conversations List/Grid */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma conversa encontrada</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || selectedStatus !== 'all' || selectedAssistant !== 'all' || selectedPriority !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'As conversas aparecerão aqui quando os clientes começarem a interagir com seus assistentes.'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>Conversas ({filteredConversations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredConversations.map((conversation) => {
                const status = statusConfig[conversation.status];
                const priority = priorityConfig[conversation.priority];
                const StatusIcon = status.icon;
                const initials = conversation.customer_name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div 
                    key={conversation.id} 
                    className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.customer_avatar || ''} alt={conversation.customer_name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${status.color}`} />
                      {conversation.unread_count > 0 && (
                        <div className="absolute -bottom-1 -right-1">
                          <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {conversation.unread_count}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{conversation.customer_name}</h4>
                          <Badge variant={status.variant} className="text-xs">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                          <div className={`h-2 w-2 rounded-full ${priority.color}`} title={`Prioridade ${priority.label}`} />
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(conversation.last_message_timestamp)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {truncate(conversation.last_message, 80)}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Bot className="h-3 w-3" />
                            <span>{conversation.assistant_name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{conversation.messages_count}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{conversation.customer_phone}</span>
                          </div>
                        </div>
                      </div>
                      
                      {conversation.satisfaction_score && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-muted-foreground">
                            Satisfação: {conversation.satisfaction_score}/5
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/conversations/${conversation.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredConversations.map((conversation) => {
            const status = statusConfig[conversation.status];
            const priority = priorityConfig[conversation.priority];
            const initials = conversation.customer_name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase();

            return (
              <Card key={conversation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.customer_avatar || ''} alt={conversation.customer_name} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${status.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{conversation.customer_name}</CardTitle>
                        <CardDescription className="text-xs">
                          {conversation.customer_phone}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {truncate(conversation.last_message, 60)}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                    <div className={`h-2 w-2 rounded-full ${priority.color}`} />
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Assistente:</span>
                      <span>{conversation.assistant_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mensagens:</span>
                      <span>{conversation.messages_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Última mensagem:</span>
                      <span>{formatRelativeTime(conversation.last_message_timestamp)}</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/conversations/${conversation.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Conversa
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}