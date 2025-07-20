'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores';
import { useBusiness } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Sparkles, 
  CheckCircle, 
  Upload,
  Smartphone,
  QrCode,
  FileText,
  ArrowRight,
  ArrowLeft,
  Zap,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Dê um nome ao seu assistente",
    description: "Como você gostaria de chamar seu assistente de IA?",
    icon: Crown
  },
  {
    id: 2,
    title: "Conecte seu WhatsApp",
    description: "Escaneie o QR Code para conectar seu número",
    icon: QrCode
  },
  {
    id: 3,
    title: "Ensine seu primeiro conhecimento",
    description: "Faça upload de documentos para treinar seu assistente",
    icon: FileText
  }
];

export function OnboardingFlow() {
  const business = useBusiness();
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [assistantName, setAssistantName] = useState('');
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connecting' | 'connected' | 'error'>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [documentUploadProgress, setDocumentUploadProgress] = useState<number>(0);

  // Callback functions defined before useEffects
  const handleStepNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const generateQRCode = useCallback(async () => {
    if (!assistantId) return;
    
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      setError(null);
      
      // Create WhatsApp instance
      const response = await fetch('/api/whatsapp-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({
          assistantId,
          assistantName,
          businessId: user?.id
        })});
      
      if (!response.ok) {
        throw new Error('Failed to create WhatsApp instance');
      }
      
      const data = await response.json();
      setInstanceName(data.data.instanceName);
      
      // Connect and get QR code
      const connectResponse = await fetch(`/api/whatsapp-instances/${data.data.instanceName}/connect`, {
        method: 'POST'});
      
      if (!connectResponse.ok) {
        throw new Error('Failed to generate QR code');
      }
      
      const qrData = await connectResponse.json();
      setQrCode(qrData.data.qrCodeBase64);
      setConnectionStatus('waiting');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar QR Code';
      setError(message);
      setConnectionStatus('error');
      toast({
        title: "Erro na conexão",
        description: message,
        variant: "destructive"});
    } finally {
      setIsConnecting(false);
    }
  }, [assistantId, assistantName, user?.id, toast]);

  const checkConnectionStatus = useCallback(async () => {
    if (!instanceName) return;
    
    try {
      const response = await fetch(`/api/whatsapp-instances/${instanceName}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to check connection status');
      }
      
      const data = await response.json();
      
      if (data.data.instance?.state === 'open') {
        setIsConnected(true);
        setConnectionStatus('connected');
        
        toast({
          title: "WhatsApp conectado!",
          description: "Seu número agora tem superpoderes de IA."});
        
        // Auto-advance after successful connection
        setTimeout(() => {
          handleStepNext();
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      // Don't show error toast for polling failures
    }
  }, [instanceName, toast, handleStepNext]);

  // Generate real QR Code when step 2 is reached
  useEffect(() => {
    if (currentStep === 2 && assistantId && !qrCode && !isConnected) {
      generateQRCode();
    }
  }, [currentStep, assistantId, qrCode, isConnected, generateQRCode]);

  // Poll connection status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (currentStep === 2 && instanceName && connectionStatus === 'connecting') {
      pollInterval = setInterval(async () => {
        await checkConnectionStatus();
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentStep, instanceName, connectionStatus, checkConnectionStatus]);

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAssistantNameSubmit = async () => {
    if (!assistantName.trim()) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Create assistant via API
      const response = await fetch('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: assistantName,
          businessId: user?.id,
          settings: {
            max_response_length: 500,
            confidence_threshold: 0.7,
            response_style: 'friendly'
          }
        })});
      
      if (!response.ok) {
        throw new Error('Failed to create assistant');
      }
      
      const data = await response.json();
      setAssistantId(data.assistant.id);
      
      toast({
        title: "Assistente criado com sucesso!",
        description: `${assistantName} está pronto para ser configurado.`});
      
      handleStepNext();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(message);
      toast({
        title: "Erro ao criar assistente",
        description: message,
        variant: "destructive"});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    
    const validFiles = files.filter(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `${file.name} não é um tipo de arquivo suportado.`,
          variant: "destructive"});
        return false;
      }
      
      if (file.size > maxFileSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de 10MB.`,
          variant: "destructive"});
        return false;
      }
      
      return true;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const handleProcessDocuments = async () => {
    if (uploadedFiles.length === 0 || !assistantId) return;
    
    setIsProcessing(true);
    setDocumentUploadProgress(0);
    setError(null);
    
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assistantId', assistantId);
        formData.append('businessId', business?.id || '');
        
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData});
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        // Update progress
        const progress = ((i + 1) / uploadedFiles.length) * 100;
        setDocumentUploadProgress(progress);
      }
      
      toast({
        title: "Documentos processados!",
        description: "Seu assistente aprendeu sobre seu negócio."});
      
      // Complete onboarding
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar documentos';
      setError(message);
      toast({
        title: "Erro no processamento",
        description: message,
        variant: "destructive"});
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Crown className="w-8 h-8 text-golden-500" />
              <h1 className="text-3xl font-light tracking-tight">
                Bem-vindo à AIDA
              </h1>
              <Sparkles className="w-8 h-8 text-golden-500" />
            </div>
            <p className="text-muted-foreground text-lg">
              Configure seu assistente de IA em 3 passos simples
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-6">
            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                    ${isCompleted 
                      ? 'bg-golden-500 shadow-golden' 
                      : isActive 
                      ? 'bg-golden-400 shadow-soft'
                      : 'bg-muted'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  
                  {index < onboardingSteps.length - 1 && (
                    <ArrowRight className={`h-4 w-4 ${
                      currentStep > step.id ? 'text-golden-500' : 'text-muted-foreground'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <Card className="glass-golden border-golden-200 shadow-elegant">
            <CardHeader className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-5 h-5 text-golden-500" />
                <CardTitle className="text-xl font-medium">
                  {onboardingSteps[currentStep - 1].title}
                </CardTitle>
                <Sparkles className="h-5 h-5 text-golden-500" />
              </div>
              <CardDescription className="text-base">
                {onboardingSteps[currentStep - 1].description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Step 1: Assistant Name */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assistantName" className="text-sm font-medium">
                      Nome do Assistente
                    </Label>
                    <Input
                      id="assistantName"
                      placeholder="Ex: Atendente Virtual - Loja da Maria"
                      value={assistantName}
                      onChange={(e) => setAssistantName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAssistantNameSubmit()}
                      className="py-3 text-center bg-golden-50 border-golden-200"
                      disabled={isProcessing}
                    />
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-danger-light border border-danger-DEFAULT rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-danger-DEFAULT" />
                        <span className="text-sm text-danger-dark">{error}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleAssistantNameSubmit}
                      disabled={!assistantName.trim() || isProcessing}
                      className="px-8 bg-golden-500 hover:bg-golden-600"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Criar Assistente
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: WhatsApp Connection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    {!isConnected ? (
                      <>
                        <div className="flex justify-center">
                          {qrCode ? (
                            <div className="p-4 bg-white rounded-xl shadow-soft border-2 border-golden-200">
                              <img 
                                src={qrCode} 
                                alt="QR Code" 
                                className="w-48 h-48 mx-auto"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-48 h-48 bg-golden-100 rounded-xl">
                              <div className="w-8 h-8 animate-spin rounded-full border-2 border-golden-500 border-t-transparent" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <p className="font-medium">Como conectar:</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>1. Abra o WhatsApp no seu celular</p>
                            <p>2. Vá em &ldquo;Aparelhos conectados&rdquo;</p>
                            <p>3. Escaneie o código acima</p>
                          </div>
                        </div>

                        {connectionStatus === 'waiting' && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Smartphone className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-700">Aguardando você escanear o QR Code...</span>
                            </div>
                          </div>
                        )}

                        {connectionStatus === 'connecting' && (
                          <div className="p-3 bg-golden-50 border border-golden-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-golden-500 border-t-transparent" />
                              <span className="text-sm text-golden-700">Preparando sua instância segura...</span>
                            </div>
                          </div>
                        )}

                        {connectionStatus === 'error' && error && (
                          <div className="p-3 bg-danger-light border border-danger-DEFAULT rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 text-danger-DEFAULT" />
                              <div>
                                <p className="text-sm font-medium text-danger-dark">Erro na conexão</p>
                                <p className="text-xs text-danger-dark opacity-90">{error}</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={generateQRCode}
                                  className="mt-2 text-xs"
                                >
                                  Tentar novamente
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="flex items-center justify-center w-24 h-24 bg-golden-500 rounded-full shadow-golden">
                            <CheckCircle className="h-12 w-12 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-medium text-golden-600 mb-2">
                            🎉 Conectado com Sucesso!
                          </h3>
                          <p className="text-muted-foreground">
                            Seu número agora tem superpoderes de IA
                          </p>
                        </div>
                        <Badge className="bg-success-DEFAULT text-white">
                          WhatsApp Ativo
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Document Upload */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-golden-300 rounded-xl p-8 text-center space-y-4 hover:border-golden-400 transition-colors">
                      <Upload className="h-12 w-12 text-golden-500 mx-auto" />
                      <div>
                        <p className="font-medium mb-2">
                          Arraste arquivos aqui ou clique para selecionar
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pode ser um catálogo, menu, FAQ ou qualquer documento da empresa
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" size="lg" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Escolher Arquivos
                        </Button>
                      </label>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Arquivos selecionados:</h4>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-golden-50 rounded-lg">
                              <FileText className="h-4 w-4 text-golden-600" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="p-4 bg-golden-50 border border-golden-200 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-golden-500 border-t-transparent" />
                            <div>
                              <p className="font-medium text-golden-700">Analisando e memorizando documentos...</p>
                              <p className="text-sm text-golden-600">
                                Seu assistente está aprendendo sobre seu negócio
                              </p>
                            </div>
                          </div>
                          {documentUploadProgress > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-golden-700">
                                <span>Progresso</span>
                                <span>{Math.round(documentUploadProgress)}%</span>
                              </div>
                              <Progress value={documentUploadProgress} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="p-3 bg-danger-light border border-danger-DEFAULT rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-danger-DEFAULT" />
                          <span className="text-sm text-danger-dark">{error}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      onClick={handleProcessDocuments}
                      disabled={uploadedFiles.length === 0 || isProcessing}
                      className="px-8 bg-golden-500 hover:bg-golden-600"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Finalizar Configuração
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button 
                  variant="ghost" 
                  onClick={handleStepBack}
                  disabled={currentStep === 1 || isProcessing}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-golden-400" />
                  <span>Dados protegidos e seguros</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground opacity-60">
              &ldquo;Transformando comunicação em prosperidade&rdquo;
            </p>
            <p className="text-xs text-muted-foreground">
              Configuração rápida • Segura • Intuitiva
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}