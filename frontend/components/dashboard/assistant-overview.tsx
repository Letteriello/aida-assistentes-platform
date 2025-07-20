'use client';

import { useAuthStore } from '@/lib/stores';
import { useBusiness } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, MessageSquare, Clock, TrendingUp, Settings, ArrowRight, Plus, Zap, Activity, Users } from 'lucide-react';
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
  active: { 
    label: 'Ativo', 
    variant: 'default' as const, 
    color: 'bg-gradient-to-r from-golden-400 to-golden-500',
    textColor: 'text-golden-900',
    icon: Zap
  },
  inactive: { 
    label: 'Inativo', 
    variant: 'secondary' as const, 
    color: 'bg-gradient-to-r from-slate-400 to-slate-500',
    textColor: 'text-slate-700',
    icon: Clock
  },
  training: { 
    label: 'Treinando', 
    variant: 'outline' as const, 
    color: 'bg-gradient-to-r from-amber-400 to-amber-500',
    textColor: 'text-amber-900',
    icon: Activity
  }
};

export function AssistantOverview() {
  const business = useBusiness();
  const { user } = useAuthStore();
  
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
      <Card className="glass-golden border-golden-200/20 bg-gradient-to-br from-white/80 to-golden-50/30">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-golden-600" />
            <CardTitle className="text-golden-900">Assistentes</CardTitle>
          </div>
          <CardDescription className="text-golden-700/70">
            Visão geral dos seus assistentes IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-white/40 backdrop-blur-sm">
                <div className="h-14 w-14 bg-golden-200/30 rounded-xl animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-golden-200/40 rounded-lg animate-pulse w-32" />
                  <div className="h-3 bg-golden-200/30 rounded-lg animate-pulse w-48" />
                  <div className="flex space-x-2">
                    <div className="h-3 bg-golden-200/40 rounded-lg animate-pulse w-16" />
                    <div className="h-3 bg-golden-200/30 rounded-lg animate-pulse w-20" />
                  </div>
                </div>
                <div className="h-8 bg-golden-200/40 rounded-full animate-pulse w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-golden border-golden-200/20 bg-gradient-to-br from-white/80 to-golden-50/30 hover:shadow-golden-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-golden-400 to-golden-500 shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-golden-900 font-semibold">Assistentes</CardTitle>
              <CardDescription className="text-golden-700/70">
                Visão geral dos seus assistentes IA
              </CardDescription>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-golden-200 text-golden-700 hover:bg-golden-50 hover:border-golden-300 transition-colors"
              asChild
            >
              <Link href="/assistants">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-golden-500 to-golden-600 hover:from-golden-600 hover:to-golden-700 text-white shadow-lg transition-all duration-300"
              asChild
            >
              <Link href="/assistants/new">
                <Plus className="mr-2 h-4 w-4" />
                Novo
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {assistants.map((assistant, index) => {
            const status = statusConfig[assistant.status];
            const StatusIcon = status.icon;
            const initials = assistant.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase();

            return (
              <div 
                key={assistant.id} 
                className="group relative p-5 rounded-xl bg-white/60 backdrop-blur-sm border border-golden-200/30 hover:bg-white/80 hover:border-golden-300/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14 ring-2 ring-golden-200/50 shadow-md">
                      <AvatarImage src="" alt={assistant.name} />
                      <AvatarFallback className="bg-gradient-to-br from-golden-100 to-golden-200 text-golden-800">
                        <Bot className="h-7 w-7" />
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ${status.color} ring-2 ring-white shadow-sm flex items-center justify-center`}>
                      <StatusIcon className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-golden-900 text-base truncate">{assistant.name}</h4>
                        <p className="text-sm text-golden-700/70 mt-1">{assistant.description}</p>
                        <p className="text-xs text-golden-600/60 mt-1">Personalidade: {assistant.personality}</p>
                      </div>
                      <Badge 
                        className={`ml-3 text-xs px-3 py-1 ${status.color} ${status.textColor} border-0 shadow-sm font-medium flex-shrink-0`}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white/50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center mb-1">
                          <MessageSquare className="h-4 w-4 text-golden-600" />
                        </div>
                        <div className="text-lg font-bold text-golden-900">{formatNumber(assistant.conversations_count)}</div>
                        <div className="text-xs text-golden-600/70">Conversas</div>
                      </div>
                      
                      <div className="bg-white/50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center mb-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-lg font-bold text-golden-900">{assistant.response_rate}%</div>
                        <div className="text-xs text-golden-600/70">Taxa Resposta</div>
                      </div>
                      
                      <div className="bg-white/50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="h-4 w-4 text-golden-600" />
                        </div>
                        <div className="text-lg font-bold text-golden-900">{assistant.avg_response_time}s</div>
                        <div className="text-xs text-golden-600/70">Tempo Médio</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-golden-600/70">
                        Última atividade: {formatRelativeTime(assistant.last_activity)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-3 text-golden-700 hover:bg-golden-100 hover:text-golden-800 transition-colors" 
                        asChild
                      >
                        <Link href={`/assistants/${assistant.id}`}>
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {assistants.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-golden-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-golden-900 mb-2">Nenhum assistente criado</h3>
            <p className="text-golden-700/70 mb-6">Crie seu primeiro assistente IA para começar</p>
            <Button 
              className="bg-gradient-to-r from-golden-500 to-golden-600 hover:from-golden-600 hover:to-golden-700 text-white shadow-lg"
              asChild
            >
              <Link href="/assistants/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar Assistente
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}