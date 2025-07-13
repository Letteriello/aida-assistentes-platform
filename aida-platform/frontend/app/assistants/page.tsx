'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  Plus, 
  Search,
  MoreVertical,
  Power,
  PowerOff,
  Settings,
  Copy,
  Trash2,
  MessageSquare,
  TrendingUp,
  Clock,
  Users,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatNumber, formatRelativeTime } from '@/lib/utils';

// Mock data - será substituído por dados reais da API
const mockAssistants = [
  {
    id: '1',
    name: 'Assistente Vendas',
    description: 'Especializado em vendas e conversões',
    status: 'active' as const,
    conversations_count: 342,
    response_rate: 98.5,
    avg_response_time: 1.2,
    last_activity: new Date(Date.now() - 1000 * 60 * 5),
    personality: 'Profissional e persuasivo',
    model: 'gpt-4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    whatsapp_connected: true,
    phone_number: '+55 11 99999-9999'
  },
  {
    id: '2',
    name: 'Assistente Suporte',
    description: 'Focado em resolver problemas técnicos',
    status: 'active' as const,
    conversations_count: 189,
    response_rate: 99.2,
    avg_response_time: 0.8,
    last_activity: new Date(Date.now() - 1000 * 60 * 15),
    personality: 'Técnico e prestativo',
    model: 'gpt-3.5-turbo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
    whatsapp_connected: true,
    phone_number: '+55 11 88888-8888'
  },
  {
    id: '3',
    name: 'Assistente Comercial',
    description: 'Atendimento comercial e agendamentos',
    status: 'inactive' as const,
    conversations_count: 67,
    response_rate: 95.8,
    avg_response_time: 2.1,
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 2),
    personality: 'Formal e organizado',
    model: 'gpt-4-turbo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    whatsapp_connected: false,
    phone_number: null
  }
];

const statusConfig = {
  active: { 
    label: 'Ativo', 
    variant: 'default' as const, 
    color: 'bg-green-500',
    icon: Power
  },
  inactive: { 
    label: 'Inativo', 
    variant: 'secondary' as const, 
    color: 'bg-gray-500',
    icon: PowerOff
  },
  training: { 
    label: 'Treinando', 
    variant: 'outline' as const, 
    color: 'bg-yellow-500',
    icon: Activity
  }
};

export default function AssistantsPage() {
  const { business } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(null);

  // TODO: Implementar query real para buscar assistentes
  const { data: assistants = mockAssistants, isLoading, error } = useQuery({
    queryKey: ['assistants', business?.id],
    queryFn: async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockAssistants;
    },
    enabled: !!business?.id,
  });

  const filteredAssistants = assistants.filter(assistant =>
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assistant.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAssistantStatus = async (assistantId: string, currentStatus: string) => {
    try {
      // TODO: Implementar toggle de status real
      console.log(`Toggling assistant ${assistantId} from ${currentStatus}`);
    } catch (error) {
      console.error('Error toggling assistant status:', error);
    }
  };

  const duplicateAssistant = async (assistantId: string) => {
    try {
      // TODO: Implementar duplicação de assistente
      console.log(`Duplicating assistant ${assistantId}`);
    } catch (error) {
      console.error('Error duplicating assistant:', error);
    }
  };

  const deleteAssistant = async (assistantId: string) => {
    if (!confirm('Tem certeza que deseja excluir este assistente?')) return;
    
    try {
      // TODO: Implementar exclusão de assistente
      console.log(`Deleting assistant ${assistantId}`);
    } catch (error) {
      console.error('Error deleting assistant:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assistentes</h1>
            <p className="text-muted-foreground">Gerencie seus assistentes de IA</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Novo Assistente
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar assistentes. Tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assistentes</h1>
          <p className="text-muted-foreground">
            Gerencie seus assistentes de IA para WhatsApp
          </p>
        </div>
        <Button asChild>
          <Link href="/assistants/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Assistente
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar assistentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredAssistants.length} assistente{filteredAssistants.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Assistants Grid */}
      {filteredAssistants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum assistente encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm 
                ? 'Tente ajustar sua busca ou criar um novo assistente.' 
                : 'Comece criando seu primeiro assistente de IA.'}
            </p>
            <Button asChild>
              <Link href="/assistants/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar Assistente
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssistants.map((assistant) => {
            const status = statusConfig[assistant.status];
            const StatusIcon = status.icon;
            const initials = assistant.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase();

            return (
              <Card key={assistant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" alt={assistant.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full ${status.color} border-2 border-background flex items-center justify-center`}>
                          <StatusIcon className="h-2 w-2 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{assistant.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {assistant.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setSelectedAssistant(
                          selectedAssistant === assistant.id ? null : assistant.id
                        )}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  {selectedAssistant === assistant.id && (
                    <div className="absolute right-4 top-16 z-10 w-48 bg-background border rounded-md shadow-lg py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => toggleAssistantStatus(assistant.id, assistant.status)}
                      >
                        {assistant.status === 'active' ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <Link href={`/assistants/${assistant.id}/settings`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => duplicateAssistant(assistant.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={() => deleteAssistant(assistant.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* WhatsApp Status */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">WhatsApp:</span>
                    <div className="flex items-center space-x-2">
                      {assistant.whatsapp_connected ? (
                        <>
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                          <span className="text-green-600">Conectado</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 bg-red-500 rounded-full" />
                          <span className="text-red-600">Desconectado</span>
                        </>
                      )}
                    </div>
                  </div>

                  {assistant.phone_number && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-mono text-xs">{assistant.phone_number}</span>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span className="text-xs">Conversas</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {formatNumber(assistant.conversations_count)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs">Taxa</span>
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {assistant.response_rate}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">Resposta</span>
                      </div>
                      <div className="text-sm font-medium">
                        {assistant.avg_response_time}s
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        <span className="text-xs">Modelo</span>
                      </div>
                      <div className="text-sm font-medium">
                        {assistant.model}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Última atividade</span>
                      <span>{formatRelativeTime(assistant.last_activity)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/conversations?assistant=${assistant.id}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Conversas
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/assistants/${assistant.id}`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Gerenciar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}