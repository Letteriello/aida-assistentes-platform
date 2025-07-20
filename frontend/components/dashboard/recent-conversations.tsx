'use client';

import { useAuthStore } from '@/lib/stores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Clock, User, ArrowRight, Phone, Zap } from 'lucide-react';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

// Mock data - será substituído por dados reais da API
const mockConversations = [
  {
    id: '1',
    customer_name: 'João Silva',
    customer_phone: '+5511999999999',
    last_message: 'Obrigado pela ajuda! Consegui resolver meu problema.',
    status: 'resolved' as const,
    priority: 'medium' as const,
    assistant_name: 'Assistente Vendas',
    updated_at: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
    unread_count: 0
  },
  {
    id: '2',
    customer_name: 'Maria Santos',
    customer_phone: '+5511888888888',
    last_message: 'Preciso de mais informações sobre o produto X.',
    status: 'active' as const,
    priority: 'high' as const,
    assistant_name: 'Assistente Suporte',
    updated_at: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    unread_count: 2
  },
  {
    id: '3',
    customer_name: 'Pedro Costa',
    customer_phone: '+5511777777777',
    last_message: 'Quando vocês abrem amanhã?',
    status: 'pending' as const,
    priority: 'low' as const,
    assistant_name: 'Assistente Geral',
    updated_at: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    unread_count: 1
  },
  {
    id: '4',
    customer_name: 'Ana Oliveira',
    customer_phone: '+5511666666666',
    last_message: 'Gostaria de agendar uma reunião.',
    status: 'escalated' as const,
    priority: 'high' as const,
    assistant_name: 'Assistente Comercial',
    updated_at: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    unread_count: 3
  }
];

const statusConfig = {
  active: { 
    label: 'Ativa', 
    variant: 'default' as const, 
    color: 'bg-gradient-to-r from-golden-400 to-golden-500',
    textColor: 'text-golden-900'
  },
  pending: { 
    label: 'Pendente', 
    variant: 'secondary' as const, 
    color: 'bg-gradient-to-r from-amber-400 to-amber-500',
    textColor: 'text-amber-900'
  },
  resolved: { 
    label: 'Resolvida', 
    variant: 'outline' as const, 
    color: 'bg-gradient-to-r from-slate-400 to-slate-500',
    textColor: 'text-slate-700'
  },
  escalated: { 
    label: 'Escalada', 
    variant: 'destructive' as const, 
    color: 'bg-gradient-to-r from-red-400 to-red-500',
    textColor: 'text-red-900'
  }
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-blue-500/20 text-blue-700', ring: 'ring-blue-500/30' },
  medium: { label: 'Média', color: 'bg-amber-500/20 text-amber-700', ring: 'ring-amber-500/30' },
  high: { label: 'Alta', color: 'bg-red-500/20 text-red-700', ring: 'ring-red-500/30' }
};

export function RecentConversations() {
  const { user } = useAuthStore();
  
  // TODO: Implementar query real para buscar conversas
  const { data: conversations = mockConversations, isLoading } = useQuery({
    queryKey: ['recent-conversations', user?.id],
    queryFn: async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockConversations;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card className="glass-golden border-golden-200/20 bg-gradient-to-br from-white/80 to-golden-50/30">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-golden-600" />
            <CardTitle className="text-golden-900">Conversas Recentes</CardTitle>
          </div>
          <CardDescription className="text-golden-700/70">
            Últimas interações com clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 rounded-xl bg-white/40 backdrop-blur-sm">
                <div className="h-12 w-12 bg-golden-200/30 rounded-full animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-golden-200/40 rounded-lg animate-pulse w-32" />
                  <div className="h-3 bg-golden-200/30 rounded-lg animate-pulse w-48" />
                </div>
                <div className="h-6 bg-golden-200/40 rounded-full animate-pulse w-16" />
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
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-golden-900 font-semibold">Conversas Recentes</CardTitle>
              <CardDescription className="text-golden-700/70">
                Últimas interações com clientes
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-golden-200 text-golden-700 hover:bg-golden-50 hover:border-golden-300 transition-colors"
            asChild
          >
            <Link href="/conversations">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {conversations.map((conversation, index) => {
            const status = statusConfig[conversation.status];
            const priority = priorityConfig[conversation.priority];
            const initials = conversation.customer_name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase();

            return (
              <div 
                key={conversation.id} 
                className="group relative p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-golden-200/30 hover:bg-white/80 hover:border-golden-300/50 hover:shadow-md transition-all duration-300 cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Priority Indicator */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${priority.color.split(' ')[0]} ring-2 ${priority.ring}`} />
                
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-golden-200/50 shadow-sm">
                      <AvatarImage src="" alt={conversation.customer_name} />
                      <AvatarFallback className="bg-gradient-to-br from-golden-100 to-golden-200 text-golden-800 font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full ${status.color} ring-2 ring-white shadow-sm flex items-center justify-center`}>
                      {conversation.status === 'active' && <Zap className="h-2 w-2 text-white" />}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-golden-900 truncate">
                        {conversation.customer_name}
                      </h4>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {conversation.unread_count > 0 && (
                          <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-sm">
                            {conversation.unread_count}
                          </Badge>
                        )}
                        <Badge 
                          className={`text-xs px-2 py-1 ${status.color} ${status.textColor} border-0 shadow-sm font-medium`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-golden-700/80 mb-3 line-clamp-2">
                      {truncate(conversation.last_message, 80)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center text-golden-600/70">
                          <User className="mr-1 h-3 w-3" />
                          {conversation.assistant_name}
                        </span>
                        <span className="flex items-center text-golden-600/70">
                          <Phone className="mr-1 h-3 w-3" />
                          {conversation.customer_phone.replace(/^\+55/, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                        </span>
                      </div>
                      <span className="flex items-center text-golden-600/70">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatRelativeTime(conversation.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {conversations.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-golden-400 mx-auto mb-3" />
            <p className="text-golden-700/70 font-medium">Nenhuma conversa recente</p>
            <p className="text-golden-600/60 text-sm">As conversas aparecerão aqui quando iniciadas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}