'use client';

import React from 'react';
import { AidaCard } from './aida-card';
import { AidaButton } from './aida-button';
import { StatusIndicator } from './status-indicator';
import { Bot, Settings, Play, Pause, Trash2, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';

interface AssistantData {
  id: string;
  name: string;
  description?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  instanceName: string;
  performance: {
    totalConversations: number;
    totalMessages: number;
    avgResponseTime: number;
    satisfactionRating: number;
  };
  settings: {
    maxResponseLength: number;
    confidenceThreshold: number;
    enableEmojis: boolean;
    enableMemory: boolean;
    responseStyle: string;
  };
  createdAt: Date;
  lastActivity?: Date;
}

interface AssistantCardProps {
  assistant: AssistantData;
  onEdit?: (id: string) => void;
  onTest?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, action: 'start' | 'stop') => void;
  className?: string;
  showActions?: boolean;
}

export function AssistantCard({
  assistant,
  onEdit,
  onTest,
  onDelete,
  onToggleStatus,
  className,
  showActions = true
}: AssistantCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isActive = assistant.status === 'connected';

  return (
    <AidaCard
      className={cn(
        'transition-all duration-200 hover:shadow-lg',
        assistant.status === 'connected' ? 'ring-1 ring-green-200' : '',
        className
      )}
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              assistant.status === 'connected' ? 'bg-green-100' : 'bg-gray-100'
            )}>
              <Bot className={cn(
                'w-5 h-5',
                assistant.status === 'connected' ? 'text-green-600' : 'text-gray-600'
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{assistant.name}</h3>
              {assistant.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {assistant.description}
                </p>
              )}
            </div>
          </div>
          
          <StatusIndicator status={assistant.status} size="md" />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Instance info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Instância WhatsApp:</span>
          <Badge variant="outline" className="font-mono">
            {assistant.instanceName}
          </Badge>
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-medium">{assistant.performance.totalConversations}</p>
                <p className="text-xs text-muted-foreground">Conversas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <div>
                <p className="font-medium">{assistant.performance.totalMessages}</p>
                <p className="text-xs text-muted-foreground">Mensagens</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium">{assistant.performance.avgResponseTime}s</p>
                <p className="text-xs text-muted-foreground">Resp. média</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-amber-500">⭐</span>
              <div>
                <p className={cn('font-medium', getPerformanceColor(assistant.performance.satisfactionRating))}>
                  {assistant.performance.satisfactionRating.toFixed(1)}/5
                </p>
                <p className="text-xs text-muted-foreground">Satisfação</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Configurações:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {assistant.settings.responseStyle}
            </Badge>
            {assistant.settings.enableEmojis && (
              <Badge variant="secondary" className="text-xs">😊 Emojis</Badge>
            )}
            {assistant.settings.enableMemory && (
              <Badge variant="secondary" className="text-xs">🧠 Memória</Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {assistant.settings.confidenceThreshold}% confiança
            </Badge>
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Criado em: {formatDate(assistant.createdAt)}</p>
          {assistant.lastActivity && (
            <p>Última atividade: {formatDate(assistant.lastActivity)}</p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t">
            <AidaButton
              variant="outline"
              size="sm"
              onClick={() => onTest?.(assistant.id)}
              icon={<MessageSquare className="w-4 h-4" />}
              className="flex-1"
            >
              Testar
            </AidaButton>
            
            <AidaButton
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(assistant.id)}
              icon={<Settings className="w-4 h-4" />}
              className="flex-1"
            >
              Editar
            </AidaButton>
            
            <AidaButton
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus?.(assistant.id, isActive ? 'stop' : 'start')}
              icon={isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              className={cn(
                'flex-1',
                isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
              )}
            >
              {isActive ? 'Pausar' : 'Iniciar'}
            </AidaButton>
            
            <AidaButton
              variant="outline"
              size="sm"
              onClick={() => onDelete?.(assistant.id)}
              icon={<Trash2 className="w-4 h-4" />}
              className="text-red-600 hover:text-red-700"
            >
              Excluir
            </AidaButton>
          </div>
        )}
      </div>
    </AidaCard>
  );
}