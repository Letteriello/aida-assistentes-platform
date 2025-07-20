/**
 * AIDA Platform - Empty States Components
 * User-friendly empty states with guidance and actions
 */

'use client';

import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  FileText, 
  Bot, 
  MessageSquare, 
  Users, 
  Settings, 
  Upload,
  Zap,
  Target,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent } from './card';

// Base Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const iconSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size],
        className
      )}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'text-muted-foreground mb-4',
            iconSizes[size]
          )}
        >
          {icon}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="space-y-2 mb-6"
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      </motion.div>

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className="min-w-[120px]"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className="min-w-[120px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Specific Empty States

// No Assistants
export function NoAssistants({ onCreateAssistant }: { onCreateAssistant: () => void }) {
  return (
    <EmptyState
      icon={<Bot className="h-16 w-16" />}
      title="Nenhum assistente criado"
      description="Crie seu primeiro assistente de IA para começar a automatizar conversas no WhatsApp."
      action={{
        label: 'Criar Assistente',
        onClick: onCreateAssistant
      }}
      secondaryAction={{
        label: 'Ver Tutorial',
        onClick: () => console.log('Open tutorial')
      }}
    />
  );
}

// No Conversations
export function NoConversations({ onStartConversation }: { onStartConversation?: () => void }) {
  return (
    <EmptyState
      icon={<MessageSquare className="h-16 w-16" />}
      title="Nenhuma conversa ainda"
      description="Suas conversas com clientes aparecerão aqui. Compartilhe o link do seu assistente para começar."
      action={onStartConversation ? {
        label: 'Iniciar Conversa',
        onClick: onStartConversation
      } : undefined}
      secondaryAction={{
        label: 'Compartilhar Link',
        onClick: () => console.log('Share link')
      }}
    />
  );
}

// No Documents
export function NoDocuments({ onUploadDocument }: { onUploadDocument: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-16 w-16" />}
      title="Base de conhecimento vazia"
      description="Adicione documentos para que seu assistente possa responder perguntas com base no seu conteúdo."
      action={{
        label: 'Adicionar Documento',
        onClick: onUploadDocument
      }}
      secondaryAction={{
        label: 'Ver Formatos Suportados',
        onClick: () => console.log('Show supported formats')
      }}
    />
  );
}

// Search No Results
export function SearchNoResults({ 
  query, 
  onClearSearch 
}: { 
  query: string; 
  onClearSearch: () => void;
}) {
  return (
    <EmptyState
      icon={<Search className="h-16 w-16" />}
      title="Nenhum resultado encontrado"
      description={`Não encontramos resultados para "${query}". Tente usar termos diferentes ou verifique a ortografia.`}
      action={{
        label: 'Limpar Busca',
        onClick: onClearSearch,
        variant: 'outline'
      }}
      size="sm"
    />
  );
}

// Error State
export function ErrorState({ 
  onRetry, 
  onGoBack 
}: { 
  onRetry?: () => void; 
  onGoBack?: () => void;
}) {
  return (
    <EmptyState
      icon={<Zap className="h-16 w-16 text-red-500" />}
      title="Algo deu errado"
      description="Ocorreu um erro inesperado. Tente novamente ou volte para a página anterior."
      action={onRetry ? {
        label: 'Tentar Novamente',
        onClick: onRetry
      } : undefined}
      secondaryAction={onGoBack ? {
        label: 'Voltar',
        onClick: onGoBack
      } : undefined}
    />
  );
}

// Loading State with Empty Fallback
export function LoadingEmptyState({ 
  isLoading, 
  emptyComponent 
}: { 
  isLoading: boolean; 
  emptyComponent: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <EmptyState
        icon={
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="h-16 w-16" />
          </motion.div>
        }
        title="Carregando..."
        description="Aguarde enquanto buscamos seus dados."
      />
    );
  }

  return <>{emptyComponent}</>;
}

// Onboarding Empty State
export function OnboardingEmptyState({ 
  step, 
  onNext, 
  onSkip 
}: { 
  step: number; 
  onNext: () => void; 
  onSkip: () => void;
}) {
  const steps = [
    {
      icon: <Bot className="h-16 w-16" />,
      title: 'Bem-vindo ao AIDA!',
      description: 'Vamos configurar seu primeiro assistente de IA em poucos passos.',
      actionLabel: 'Começar'
    },
    {
      icon: <Upload className="h-16 w-16" />,
      title: 'Adicione conhecimento',
      description: 'Faça upload de documentos para que seu assistente possa responder perguntas.',
      actionLabel: 'Adicionar Documentos'
    },
    {
      icon: <MessageSquare className="h-16 w-16" />,
      title: 'Teste seu assistente',
      description: 'Faça algumas perguntas para ver como seu assistente responde.',
      actionLabel: 'Testar Agora'
    }
  ];

  const currentStep = steps[step] || steps[0];

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-8">
        <EmptyState
          icon={currentStep.icon}
          title={currentStep.title}
          description={currentStep.description}
          action={{
            label: currentStep.actionLabel,
            onClick: onNext
          }}
          secondaryAction={{
            label: 'Pular',
            onClick: onSkip
          }}
          size="sm"
        />
        
        {/* Progress indicator */}
        <div className="flex justify-center space-x-2 mt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Feature Coming Soon
export function ComingSoon({ 
  feature, 
  onNotifyMe 
}: { 
  feature: string; 
  onNotifyMe?: () => void;
}) {
  return (
    <EmptyState
      icon={<Target className="h-16 w-16" />}
      title={`${feature} em breve`}
      description="Estamos trabalhando nesta funcionalidade. Seja notificado quando estiver disponível."
      action={onNotifyMe ? {
        label: 'Me Notificar',
        onClick: onNotifyMe,
        variant: 'outline'
      } : undefined}
      size="sm"
    />
  );
}

// Help and Documentation
export function NeedHelp({ 
  onOpenDocs, 
  onContactSupport 
}: { 
  onOpenDocs: () => void; 
  onContactSupport: () => void;
}) {
  return (
    <EmptyState
      icon={<BookOpen className="h-16 w-16" />}
      title="Precisa de ajuda?"
      description="Consulte nossa documentação ou entre em contato com o suporte para obter assistência."
      action={{
        label: 'Ver Documentação',
        onClick: onOpenDocs
      }}
      secondaryAction={{
        label: 'Contatar Suporte',
        onClick: onContactSupport
      }}
      size="sm"
    />
  );
}

// Quick Start Guide
export function QuickStartGuide({ 
  steps, 
  onStepClick 
}: { 
  steps: Array<{ title: string; description: string; completed: boolean }>; 
  onStepClick: (index: number) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <Lightbulb className="h-16 w-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Guia de Início Rápido</h2>
        <p className="text-muted-foreground">
          Siga estes passos para configurar seu assistente de IA
        </p>
      </motion.div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                step.completed && 'bg-green-50 border-green-200'
              )}
              onClick={() => onStepClick(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {step.completed ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}