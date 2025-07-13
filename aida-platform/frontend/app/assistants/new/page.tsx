'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  ArrowLeft, 
  QrCode, 
  Upload, 
  MessageSquare, 
  Settings,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import Link from 'next/link';

interface AssistantFormData {
  name: string;
  description: string;
  personality: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
}

export default function NewAssistantPage() {
  const { business, apiKey } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState('config');
  const [qrCode, setQrCode] = useState('');
  const [instanceStatus, setInstanceStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const [formData, setFormData] = useState<AssistantFormData>({
    name: '',
    description: '',
    personality: 'Profissional e prestativo',
    systemPrompt: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    isActive: false
  });

  const personalityOptions = [
    'Profissional e prestativo',
    'Amigável e casual',
    'Técnico e detalhado',
    'Vendedor persuasivo',
    'Formal e corporativo',
    'Criativo e inovador'
  ];

  const modelOptions = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Rápido)' },
    { value: 'gpt-4', label: 'GPT-4 (Avançado)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Equilibrado)' }
  ];

  const handleInputChange = (field: keyof AssistantFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createAssistant = async () => {
    if (!formData.name.trim()) {
      setError('Nome do assistente é obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/assistants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey?.key}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          personality: formData.personality,
          system_prompt: formData.systemPrompt,
          model_config: {
            model: formData.model,
            temperature: formData.temperature,
            max_tokens: formData.maxTokens
          },
          is_active: false // Will be activated after WhatsApp connection
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar assistente');
      }

      setSuccess('Assistente criado com sucesso!');
      setCurrentStep('whatsapp');
      
      // Generate QR Code for WhatsApp connection
      generateQRCode(data.assistant.id);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (assistantId: string) => {
    try {
      setInstanceStatus('connecting');
      
      // Mock QR code generation - replace with actual Evolution API call
      setTimeout(() => {
        setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        setInstanceStatus('connected');
      }, 2000);

    } catch (error) {
      setError('Erro ao gerar código QR');
      setInstanceStatus('disconnected');
    }
  };

  const testAssistant = async () => {
    setLoading(true);
    try {
      // Mock test implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Teste enviado! Verifique seu WhatsApp.');
    } catch (error) {
      setError('Erro ao enviar teste');
    } finally {
      setLoading(false);
    }
  };

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
          <div>
            <h1 className="text-3xl font-bold">Criar Novo Assistente</h1>
            <p className="text-muted-foreground">
              Configure seu assistente de IA para WhatsApp
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {business?.name}
        </Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 ${currentStep === 'config' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'config' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <Settings className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Configuração</span>
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center space-x-2 ${currentStep === 'whatsapp' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'whatsapp' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <QrCode className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">WhatsApp</span>
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center space-x-2 ${currentStep === 'test' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'test' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            <MessageSquare className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Teste</span>
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
      {currentStep === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Assistente</CardTitle>
                <CardDescription>
                  Defina as características e comportamento do seu assistente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Básico</TabsTrigger>
                    <TabsTrigger value="advanced">Avançado</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Assistente *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Assistente de Vendas"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        placeholder="Breve descrição do que este assistente faz..."
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
                          {personalityOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                      <Textarea
                        id="systemPrompt"
                        placeholder="Instruções específicas para o assistente..."
                        value={formData.systemPrompt}
                        onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Instruções detalhadas sobre como o assistente deve se comportar
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo de IA</Label>
                      <Select value={formData.model} onValueChange={(value) => handleInputChange('model', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {modelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="temperature">Criatividade (Temperature): {formData.temperature}</Label>
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
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Conservador</span>
                        <span>Criativo</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Tokens Máximos</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        min="100"
                        max="4000"
                        value={formData.maxTokens}
                        onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Controla o tamanho máximo das respostas
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" asChild>
                    <Link href="/assistants">Cancelar</Link>
                  </Button>
                  <Button onClick={createAssistant} disabled={loading}>
                    {loading ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Criando...
                      </>
                    ) : (
                      'Criar Assistente'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">{formData.name || 'Novo Assistente'}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.description || 'Descrição do assistente...'}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Personalidade:</span>
                      <span>{formData.personality}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Modelo:</span>
                      <span>{formData.model}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Criatividade:</span>
                      <span>{formData.temperature}</span>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Após criar, você conectará o assistente ao WhatsApp e poderá testá-lo.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {currentStep === 'whatsapp' && (
        <Card>
          <CardHeader>
            <CardTitle>Conectar ao WhatsApp</CardTitle>
            <CardDescription>
              Escaneie o código QR com seu WhatsApp Business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              {instanceStatus === 'connecting' && (
                <div className="flex flex-col items-center space-y-4">
                  <LoadingSpinner size="lg" />
                  <p>Gerando código QR...</p>
                </div>
              )}

              {instanceStatus === 'connected' && qrCode && (
                <div className="text-center space-y-4">
                  <div className="w-64 h-64 bg-white p-4 rounded-lg border">
                    <img src={qrCode} alt="QR Code" className="w-full h-full" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">Abra o WhatsApp no seu celular</p>
                    <p className="text-sm text-muted-foreground">
                      Vá em Configurações → Aparelhos conectados → Conectar um aparelho
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('config')}>
                Voltar
              </Button>
              <Button onClick={() => setCurrentStep('test')}>
                Continuar para Teste
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'test' && (
        <Card>
          <CardHeader>
            <CardTitle>Testar Assistente</CardTitle>
            <CardDescription>
              Envie uma mensagem de teste para verificar se tudo está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Assistente Criado!</h3>
                <p className="text-muted-foreground">
                  Seu assistente está pronto. Envie uma mensagem de teste para o número conectado.
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={testAssistant} disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Teste'
                )}
              </Button>
              <Button asChild>
                <Link href="/assistants">
                  Finalizar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}