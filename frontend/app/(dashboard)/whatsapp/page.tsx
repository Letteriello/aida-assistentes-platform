/**
 * AIDA Assistentes - WhatsApp Connectivity Page
 * Página de conectividade WhatsApp com Baileys e Cloud API
 * PATTERN: Multi-tab interface with real-time connection management
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores';
import { withAuth } from '@/lib/auth';
import { AnimatedTechBackground } from '@/components/ui/animated-tech-background';
import { TechContainer, TechPageContainer } from '@/components/ui/tech-container';
import { TechCard, TechCardHeader, TechCardTitle, TechCardDescription, TechCardContent } from '@/components/ui/tech-card';
import { TechButton } from '@/components/ui/tech-button';
import { TechInput } from '@/components/ui/tech-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  MessageCircle, 
  Smartphone, 
  Cloud, 
  QrCode, 
  Key, 
  Webhook, 
  Bot, 
  Settings, 
  BarChart3, 
  Search, 
  Calendar, 
  Zap, 
  Users, 
  FileText, 
  Image, 
  Video, 
  Mic, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types
interface ConnectionStatus {
  type: 'baileys' | 'cloud-api';
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  sessionId?: string;
  phoneNumber?: string;
  lastActivity?: Date;
  qrCode?: string;
}

interface WhatsAppMessage {
  id: string;
  chatId: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document';
  timestamp: Date;
  sender: string;
  recipient: string;
  deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed';
}

interface Integration {
  id: string;
  name: string;
  enabled: boolean;
  configured: boolean;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState('connection');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    type: 'baileys',
    status: 'disconnected'
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'typebot',
      name: 'Typebot',
      enabled: false,
      configured: false,
      description: 'Chatbots automatizados',
      icon: Bot
    },
    {
      id: 'chatwoot',
      name: 'Chatwoot',
      enabled: false,
      configured: false,
      description: 'Atendimento ao cliente',
      icon: Users
    },
    {
      id: 'openai',
      name: 'OpenAI',
      enabled: false,
      configured: false,
      description: 'Respostas com IA',
      icon: Bot
    }
  ]);

  const { user } = useAuthStore();

  // Mock functions for demonstration
  const handleConnect = async (type: 'baileys' | 'cloud-api') => {
    setIsConnecting(true);
    setConnectionStatus(prev => ({ ...prev, type, status: 'connecting' }));
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (type === 'baileys') {
        // Simulate QR code generation
        setConnectionStatus({
          type,
          status: 'connected',
          sessionId: 'session_' + Date.now(),
          phoneNumber: '+55 11 99999-9999',
          lastActivity: new Date(),
          qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvZGUgUVI8L3RleHQ+PC9zdmc+'
        });
      } else {
        setConnectionStatus({
          type,
          status: 'connected',
          phoneNumber: '+55 11 88888-8888',
          lastActivity: new Date()
        });
      }
      
      toast.success(`Conectado via ${type === 'baileys' ? 'Baileys' : 'Cloud API'}!`);
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, status: 'error' }));
      toast.error('Erro ao conectar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConnectionStatus(prev => ({ ...prev, status: 'disconnected', sessionId: undefined, qrCode: undefined }));
    toast.info('Desconectado');
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, enabled: !integration.enabled }
        : integration
    ));
  };

  const getStatusColor = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'connecting': return Loader2;
      case 'error': return XCircle;
      default: return AlertCircle;
    }
  };

  return (
    <TechPageContainer className="relative min-h-screen">
      <AnimatedTechBackground variant="circuit" intensity="subtle" />
      
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-tech-dark-800 dark:text-tech-dark-100">
              WhatsApp Connectivity
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie conexões WhatsApp, integrações e automações
            </p>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <Badge 
              variant={connectionStatus.status === 'connected' ? 'default' : 'secondary'}
              className={cn(
                "flex items-center gap-2 px-3 py-1",
                connectionStatus.status === 'connected' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              )}
            >
              {(() => {
                const StatusIcon = getStatusIcon(connectionStatus.status);
                return (
                  <>
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      connectionStatus.status === 'connecting' && "animate-spin"
                    )} />
                    {connectionStatus.status === 'connected' ? 'Conectado' : 
                     connectionStatus.status === 'connecting' ? 'Conectando...' :
                     connectionStatus.status === 'error' ? 'Erro' : 'Desconectado'}
                  </>
                );
              })()} 
            </Badge>
            
            {connectionStatus.phoneNumber && (
              <Badge variant="outline">
                <Smartphone className="h-3 w-3 mr-1" />
                {connectionStatus.phoneNumber}
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Conexão
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Automações
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Connection Tab */}
          <TabsContent value="connection" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Baileys Connection */}
              <TechCard variant="tech">
                <TechCardHeader>
                  <TechCardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Baileys (WhatsApp Web)
                  </TechCardTitle>
                  <TechCardDescription>
                    Conexão direta via WhatsApp Web com QR Code
                  </TechCardDescription>
                </TechCardHeader>
                <TechCardContent className="space-y-4">
                  {connectionStatus.type === 'baileys' && connectionStatus.qrCode && (
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <img 
                        src={connectionStatus.qrCode} 
                        alt="QR Code" 
                        className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <TechButton 
                      onClick={() => handleConnect('baileys')}
                      disabled={isConnecting || (connectionStatus.status === 'connected' && connectionStatus.type === 'baileys')}
                      className="flex-1"
                    >
                      {isConnecting && connectionStatus.type === 'baileys' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4 mr-2" />
                      )}
                      {connectionStatus.status === 'connected' && connectionStatus.type === 'baileys' ? 'Conectado' : 'Conectar'}
                    </TechButton>
                    
                    {connectionStatus.status === 'connected' && connectionStatus.type === 'baileys' && (
                      <TechButton variant="outline" onClick={handleDisconnect}>
                        Desconectar
                      </TechButton>
                    )}
                  </div>
                </TechCardContent>
              </TechCard>

              {/* Cloud API Connection */}
              <TechCard variant="tech">
                <TechCardHeader>
                  <TechCardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Cloud API
                  </TechCardTitle>
                  <TechCardDescription>
                    Conexão via WhatsApp Business API oficial
                  </TechCardDescription>
                </TechCardHeader>
                <TechCardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="api-key">API Key</Label>
                      <TechInput 
                        id="api-key"
                        type="password"
                        placeholder="Insira sua API key"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone-number">Número do Telefone</Label>
                      <TechInput 
                        id="phone-number"
                        placeholder="+55 11 99999-9999"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <TechInput 
                        id="webhook-url"
                        placeholder="https://sua-api.com/webhook"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <TechButton 
                      onClick={() => handleConnect('cloud-api')}
                      disabled={isConnecting || (connectionStatus.status === 'connected' && connectionStatus.type === 'cloud-api')}
                      className="flex-1"
                    >
                      {isConnecting && connectionStatus.type === 'cloud-api' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4 mr-2" />
                      )}
                      {connectionStatus.status === 'connected' && connectionStatus.type === 'cloud-api' ? 'Conectado' : 'Conectar'}
                    </TechButton>
                    
                    {connectionStatus.status === 'connected' && connectionStatus.type === 'cloud-api' && (
                      <TechButton variant="outline" onClick={handleDisconnect}>
                        Desconectar
                      </TechButton>
                    )}
                  </div>
                </TechCardContent>
              </TechCard>
            </div>

            {/* Connection Status */}
            {connectionStatus.status === 'connected' && (
              <TechCard>
                <TechCardHeader>
                  <TechCardTitle>Status da Conexão</TechCardTitle>
                </TechCardHeader>
                <TechCardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="font-medium text-green-700 dark:text-green-300">Conectado</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {connectionStatus.type === 'baileys' ? 'Baileys' : 'Cloud API'}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Smartphone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="font-medium text-blue-700 dark:text-blue-300">Número</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {connectionStatus.phoneNumber}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <p className="font-medium text-purple-700 dark:text-purple-300">Última Atividade</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        {connectionStatus.lastActivity?.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </TechCardContent>
              </TechCard>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <TechCard>
              <TechCardHeader>
                <TechCardTitle>Interface de Mensagens</TechCardTitle>
                <TechCardDescription>
                  Envie e receba mensagens em tempo real
                </TechCardDescription>
              </TechCardHeader>
              <TechCardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Interface de mensagens em desenvolvimento</p>
                  <p className="text-sm">Em breve: chat em tempo real, envio de mídia e histórico</p>
                </div>
              </TechCardContent>
            </TechCard>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <TechCard key={integration.id} variant="outline">
                    <TechCardHeader>
                      <TechCardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {integration.name}
                      </TechCardTitle>
                      <TechCardDescription>
                        {integration.description}
                      </TechCardDescription>
                    </TechCardHeader>
                    <TechCardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id={integration.id}
                            checked={integration.enabled}
                            onCheckedChange={() => toggleIntegration(integration.id)}
                          />
                          <Label htmlFor={integration.id}>
                            {integration.enabled ? 'Ativo' : 'Inativo'}
                          </Label>
                        </div>
                        
                        <TechButton variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Configurar
                        </TechButton>
                      </div>
                      
                      {!integration.configured && (
                        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            ⚠️ Configuração necessária
                          </p>
                        </div>
                      )}
                    </TechCardContent>
                  </TechCard>
                );
              })}
            </div>
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations" className="space-y-6">
            <TechCard>
              <TechCardHeader>
                <TechCardTitle>Automações e Agendamentos</TechCardTitle>
                <TechCardDescription>
                  Configure respostas automáticas e agendamento de mensagens
                </TechCardDescription>
              </TechCardHeader>
              <TechCardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sistema de automações em desenvolvimento</p>
                  <p className="text-sm">Em breve: triggers, agendamentos e fluxos automatizados</p>
                </div>
              </TechCardContent>
            </TechCard>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <TechCard>
              <TechCardHeader>
                <TechCardTitle>Analytics e Relatórios</TechCardTitle>
                <TechCardDescription>
                  Métricas de conversas e análise de desempenho
                </TechCardDescription>
              </TechCardHeader>
              <TechCardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Dashboard de analytics em desenvolvimento</p>
                  <p className="text-sm">Em breve: métricas detalhadas e relatórios personalizados</p>
                </div>
              </TechCardContent>
            </TechCard>
          </TabsContent>
        </Tabs>
      </div>
    </TechPageContainer>
  );
}

export default withAuth(WhatsAppPage);