'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  ArrowLeft, 
  Save,
  Power,
  PowerOff,
  MessageSquare,
  Settings,
  BarChart3,
  Users,
  Phone,
  QrCode,
  RefreshCw,
  Copy,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime, formatNumber } from '@/lib/utils';

// Mock data - será substituído por dados reais da API
const mockAssistant = {
  id: '1',
  name: 'Assistente Vendas',
  description: 'Especializado em vendas e conversões',
  status: 'active' as const,
  personality: 'Profissional e persuasivo',
  system_prompt: 'Você é um assistente especializado em vendas. Seja sempre prestativo, persuasivo e profissional. Foque em identificar as necessidades do cliente e oferecer soluções adequadas.',
  model_config: {
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000
  },
  whatsapp_config: {
    connected: true,
    phone_number: '+55 11 99999-9999',
    instance_id: 'inst_abc123',
    qr_code: null,
    last_connected: new Date(Date.now() - 1000 * 60 * 30)
  },
  analytics: {
    conversations_count: 342,
    messages_sent: 1240,
    messages_received: 890,
    response_rate: 98.5,
    avg_response_time: 1.2,
    satisfaction_score: 4.7,
    last_30_days_conversations: [
      { date: '2024-01-01', count: 12 },
      { date: '2024-01-02', count: 15 },
      { date: '2024-01-03', count: 18 },
      // ... more data
    ]
  },
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
};

export default function AssistantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { business, apiKey } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const assistantId = params.id as string;

  // TODO: Implementar query real para buscar assistente
  const { data: assistant = mockAssistant, isLoading } = useQuery({
    queryKey: ['assistant', assistantId],
    queryFn: async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockAssistant;
    },
    enabled: !!assistantId,
  });

  const [formData, setFormData] = useState({
    name: assistant.name,
    description: assistant.description,
    personality: assistant.personality,
    system_prompt: assistant.system_prompt,
    model: assistant.model_config.model,
    temperature: assistant.model_config.temperature,
    max_tokens: assistant.model_config.max_tokens
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveChanges = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implementar salvamento real
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Alterações salvas com sucesso!');
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    setLoading(true);
    try {
      // TODO: Implementar toggle de status real
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccess(`Assistente ${assistant.status === 'active' ? 'desativado' : 'ativado'} com sucesso!`);
    } catch (error: any) {
      setError(error.message || 'Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  const reconnectWhatsApp = async () => {
    setLoading(true);
    try {
      // TODO: Implementar reconexão real
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('WhatsApp reconectado com sucesso!');
    } catch (error: any) {
      setError(error.message || 'Erro ao reconectar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Carregando assistente..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/assistants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" alt={assistant.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{assistant.name}</h1>
              <p className="text-muted-foreground">{assistant.description}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={assistant.status === 'active' ? 'default' : 'secondary'}>
            {assistant.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
          <Button
            variant="outline"
            onClick={toggleStatus}
            disabled={loading}
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
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Básicas</CardTitle>
                <CardDescription>
                  Informações e personalidade do assistente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personality">Personalidade</Label>
                  <Select value={formData.personality} onValueChange={(value) => handleInputChange('personality', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Profissional e persuasivo">Profissional e persuasivo</SelectItem>
                      <SelectItem value="Amigável e casual">Amigável e casual</SelectItem>
                      <SelectItem value="Técnico e detalhado">Técnico e detalhado</SelectItem>
                      <SelectItem value="Formal e corporativo">Formal e corporativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system_prompt">Prompt do Sistema</Label>
                  <Textarea
                    id="system_prompt"
                    value={formData.system_prompt}
                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações do Modelo</CardTitle>
                <CardDescription>
                  Parâmetros do modelo de IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Select value={formData.model} onValueChange={(value) => handleInputChange('model', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
                  <input
                    type="range"
                    id="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_tokens">Tokens Máximos</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => handleInputChange('max_tokens', parseInt(e.target.value))}
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={saveChanges} disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WhatsApp Settings */}
        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status do WhatsApp</CardTitle>
              <CardDescription>
                Gerenciar conexão com WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`h-3 w-3 rounded-full ${assistant.whatsapp_config.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="font-medium">
                      {assistant.whatsapp_config.connected ? 'Conectado' : 'Desconectado'}
                    </p>
                    {assistant.whatsapp_config.phone_number && (
                      <p className="text-sm text-muted-foreground">
                        {assistant.whatsapp_config.phone_number}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={reconnectWhatsApp}
                  disabled={loading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reconectar
                </Button>
              </div>

              {assistant.whatsapp_config.last_connected && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Última conexão: {formatDateTime(assistant.whatsapp_config.last_connected)}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversas</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(assistant.analytics.conversations_count)}</div>
                <p className="text-xs text-muted-foreground">Total de conversas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistant.analytics.response_rate}%</div>
                <p className="text-xs text-muted-foreground">Mensagens respondidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistant.analytics.avg_response_time}s</div>
                <p className="text-xs text-muted-foreground">Tempo médio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistant.analytics.satisfaction_score}</div>
                <p className="text-xs text-muted-foreground">Nota média (1-5)</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversations */}
        <TabsContent value="conversations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversas Recentes</CardTitle>
              <CardDescription>
                Últimas interações deste assistente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Lista de conversas será implementada em breve
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/conversations">
                    Ver Todas as Conversas
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}