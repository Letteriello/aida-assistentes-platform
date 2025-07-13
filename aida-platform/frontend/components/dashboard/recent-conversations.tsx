'use client';

import { useAuth } from '@/components/providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Clock, User, ArrowRight } from 'lucide-react';
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

export function RecentConversations() {
  const { business } = useAuth();
  
  // TODO: Implementar query real para buscar conversas
  const { data: conversations = mockConversations, isLoading } = useQuery({
    queryKey: ['recent-conversations', business?.id],
    queryFn: async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockConversations;
    },
    enabled: !!business?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversas Recentes</CardTitle>
          <CardDescription>
            Últimas interações com clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse w-32" />
                  <div className="h-3 bg-muted rounded animate-pulse w-48" />
                </div>
                <div className="h-6 bg-muted rounded animate-pulse w-16" />
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
            <CardTitle>Conversas Recentes</CardTitle>
            <CardDescription>
              Últimas interações com clientes
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/conversations">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => {
            const status = statusConfig[conversation.status];
            const priority = priorityConfig[conversation.priority];
            const initials = conversation.customer_name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase();

            return (
              <div key={conversation.id} className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={conversation.customer_name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${status.color}`} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {conversation.customer_name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {truncate(conversation.last_message, 60)}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <User className="mr-1 h-3 w-3" />
                      {conversation.assistant_name}
                    </span>
                    <span className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatRelativeTime(conversation.updated_at)}
                    </span>
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