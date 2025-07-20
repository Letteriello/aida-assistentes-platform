'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/origin/card';
import { Button } from '@/components/ui/origin/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  QrCode, 
  Plus, 
  Smartphone, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Send,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useInstancesStore } from '@/lib/stores/instances-store';
import { useWebSocket } from '@/lib/websocket-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from 'sonner';

interface InstanceManagerProps {
  onInstanceConnected?: (instanceId: string) => void;
}

export function InstanceManager({ onInstanceConnected }: InstanceManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');

  // WebSocket and Auth
  const { token } = useAuthStore();
  const webSocket = useWebSocket();

  const {
    instances,
    selectedInstance,
    isLoading,
    error,
    currentQRCode,
    qrCodeLoading,
    createInstance,
    loadInstances,
    refreshInstance,
    deleteInstance,
    getQRCode,
    clearQRCode,
    sendTestMessage,
    selectInstance,
    clearError,
    startPolling,
    stopPolling
  } = useInstancesStore();

  // Conectar WebSocket e carregar instâncias
  useEffect(() => {
    const initializeConnections = async () => {
      // Conectar WebSocket
      if (token) {
        const connected = await webSocket.connect();
        if (connected) {
          webSocket.authenticate(token);
        }
      }
      
      // Carregar instâncias
      loadInstances();
      startPolling(); // Manter polling como fallback
    };

    initializeConnections();
    
    return () => {
      stopPolling();
      // WebSocket será desconectado quando o usuário sair da página
    };
  }, [loadInstances, startPolling, stopPolling, token, webSocket]);

  // Mostrar erros como toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Callback quando instância conecta
  useEffect(() => {
    if (selectedInstance?.status === 'connected' && onInstanceConnected) {
      onInstanceConnected(selectedInstance.id);
    }
  }, [selectedInstance?.status, onInstanceConnected]);

  // Entrar em sala da instância selecionada para receber updates
  useEffect(() => {
    if (selectedInstance && webSocket.isConnected()) {
      webSocket.joinInstance(selectedInstance.id);
      
      return () => {
        webSocket.leaveInstance(selectedInstance.id);
      };
    }
  }, [selectedInstance?.id, webSocket]);

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }

    const success = await createInstance({ instanceName: newInstanceName });
    if (success) {
      setNewInstanceName('');
      setShowCreateForm(false);
      toast.success('Instância criada com sucesso!');
    }
  };

  const handleShowQRCode = async (instanceId: string) => {
    setShowQRCode(instanceId);
    const success = await getQRCode(instanceId);
    if (!success) {
      setShowQRCode(null);
    }
  };

  const handleRefreshInstance = async (instanceId: string) => {
    await refreshInstance(instanceId);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (confirm('Tem certeza que deseja deletar esta instância?')) {
      const success = await deleteInstance(instanceId);
      if (success) {
        toast.success('Instância deletada com sucesso');
        if (showQRCode === instanceId) {
          setShowQRCode(null);
          clearQRCode();
        }
      }
    }
  };

  const handleSendTestMessage = async () => {
    if (!selectedInstance || !testPhone || !testMessage) {
      toast.error('Selecione uma instância e preencha todos os campos');
      return;
    }

    const success = await sendTestMessage(selectedInstance.id, {
      phoneNumber: testPhone,
      message: testMessage
    });

    if (success) {
      toast.success('Mensagem enviada com sucesso!');
      setTestMessage('');
      setTestPhone('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'qrcode':
        return <QrCode className="w-4 h-4 text-blue-500" />;
      case 'creating':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'qrcode': return 'bg-blue-100 text-blue-800';
      case 'creating': return 'bg-yellow-100 text-yellow-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'qrcode': return 'Aguardando QR';
      case 'creating': return 'Criando';
      case 'disconnected': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de criar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Minhas Instâncias WhatsApp</h2>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Instância
        </Button>
      </div>

      {/* Formulário de criação */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Criar Nova Instância</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="instanceName">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    placeholder="Ex: MinhaEmpresa_WhatsApp"
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateInstance}
                    disabled={isLoading || !newInstanceName.trim()}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de instâncias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => (
          <Card 
            key={instance.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedInstance?.id === instance.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => selectInstance(instance)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg truncate">{instance.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefreshInstance(instance.id);
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteInstance(instance.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(instance.status)}
                <Badge className={getStatusColor(instance.status)}>
                  {getStatusText(instance.status)}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                <div>Mensagens: {instance.message_count}</div>
                <div>Criado: {new Date(instance.created_at).toLocaleDateString('pt-BR')}</div>
              </div>

              {instance.status === 'qrcode' && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowQRCode(instance.id);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ver QR Code
                </Button>
              )}

              {instance.status === 'connected' && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Smartphone className="w-4 h-4" />
                  Pronto para usar
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {instances.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma instância encontrada</h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira instância WhatsApp para começar a usar o AIDA
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Instância
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal QR Code */}
      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowQRCode(null);
              clearQRCode();
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-center">
                Escaneie o QR Code
              </h3>
              
              {qrCodeLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : currentQRCode ? (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img 
                      src={`data:image/png;base64,${currentQRCode}`} 
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Abra o WhatsApp no seu celular e escaneie este código
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-red-500">
                  Erro ao carregar QR Code
                </div>
              )}
              
              <div className="flex gap-2 mt-6">
                <Button 
                  onClick={() => showQRCode && handleShowQRCode(showQRCode)}
                  variant="outline"
                  className="flex-1"
                  disabled={qrCodeLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Button 
                  onClick={() => {
                    setShowQRCode(null);
                    clearQRCode();
                  }}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Painel de teste de mensagem */}
      {selectedInstance?.status === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle>Teste de Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testPhone">Número de Teste</Label>
                <Input
                  id="testPhone"
                  placeholder="+5511999999999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="testMessage">Mensagem</Label>
                <Input
                  id="testMessage"
                  placeholder="Olá! Esta é uma mensagem de teste."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleSendTestMessage}
              disabled={isLoading || !testPhone || !testMessage}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Mensagem Teste
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}