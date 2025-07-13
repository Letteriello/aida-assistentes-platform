'use client';

import { useAuth } from '@/components/providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, MessageSquare, Clock, TrendingUp, Settings, ArrowRight, Plus } from 'lucide-react';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

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
    last_activity: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
    personality: 'Profissional e persuasivo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) // 30 days ago
  },
  {
    id: '2',
    name: 'Assistente Suporte',
    description: 'Focado em resolver problemas técnicos',
    status: 'active' as const,
    conversations_count: 189,
    response_rate: 99.2,
    avg_response_time: 0.8,
    last_activity: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
    personality: 'Técnico e prestativo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20) // 20 days ago
  },
  {
    id: '3',
    name: 'Assistente Comercial',
    description: 'Atendimento comercial e agendamentos',
    status: 'inactive' as const,
    conversations_count: 67,
    response_rate: 95.8,
    avg_response_time: 2.1,
    last_activity: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    personality: 'Formal e organizado',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
  }
];

const statusConfig = {
  active: { label: 'Ativo', variant: 'default' as const, color: 'bg-green-500' },
  inactive: { label: 'Inativo', variant: 'secondary' as const, color: 'bg-gray-500' },
  training: { label: 'Treinando', variant: 'outline' as const, color: 'bg-yellow-500' }
};

export function AssistantOverview() {
  const { business } = useAuth();
  
  // TODO: Implementar query real para buscar assistentes
  const { data: assistants = mockAssistants, isLoading } = useQuery({
    queryKey: ['assistants-overview', business?.id],
    queryFn: async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 600));
      return mockAssistants;
    },
    enabled: !!business?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assistentes</CardTitle>
          <CardDescription>
            Visão geral dos seus assistentes IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse w-32" />
                  <div className="h-3 bg-muted rounded animate-pulse w-48" />
                  <div className="flex space-x-2">
                    <div className="h-3 bg-muted rounded animate-pulse w-16" />
                    <div className="h-3 bg-muted rounded animate-pulse w-20" />
                  </div>
                </div>
                <div className="h-8 bg-muted rounded animate-pulse w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Assistentes</CardTitle>
            <CardDescription>
              Visão geral dos seus assistentes IA
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/assistants">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/assistants/new">
                <Plus className="mr-2 h-4 w-4" />
                Novo
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assistants.map((assistant) => {
            const status = statusConfig[assistant.status];
            const initials = assistant.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase();

            return (
              <div key={assistant.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" alt={assistant.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full ${status.color} border-2 border-background`} />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">{assistant.name}</h4>
                      <p className="text-xs text-muted-foreground">{assistant.description}</p>
                    </div>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(assistant.conversations_count)}</span>
                      <span className="text-muted-foreground">conversas</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="font-medium">{assistant.response_rate}%</span>
                      <span className="text-muted-foreground">resposta</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{assistant.avg_response_time}s</span>
                      <span className="text-muted-foreground">média</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Última atividade: {formatRelativeTime(assistant.last_activity)}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2" asChild>
                      <Link href={`/assistants/${assistant.id}`}>
                        <Settings className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}