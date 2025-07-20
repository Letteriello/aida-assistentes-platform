'use client';

import React from 'react';
import { StatusIndicator } from './status-indicator';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Smartphone, QrCode } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  instanceName?: string;
  lastConnected?: Date;
  onReconnect?: () => void;
  onRefreshQR?: () => void;
  onDisconnect?: () => void;
  qrCode?: string;
  loading?: boolean;
  className?: string;
}

export function ConnectionStatus({
  status,
  instanceName,
  lastConnected,
  onReconnect,
  onRefreshQR,
  onDisconnect,
  qrCode,
  loading = false,
  className
}: ConnectionStatusProps) {
  const getMainIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-6 h-6 text-green-600" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="w-6 h-6 text-red-600" />;
      case 'connecting':
        return <RefreshCw className="w-6 h-6 text-yellow-600 animate-spin" />;
      default:
        return <Smartphone className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'connected':
        return 'WhatsApp conectado e funcionando normalmente';
      case 'disconnected':
        return 'WhatsApp desconectado. Clique em "Reconectar" para gerar um novo QR Code';
      case 'connecting':
        return 'Conectando ao WhatsApp... Escaneie o QR Code com seu celular';
      case 'error':
        return 'Erro na conexão. Tente reconectar ou entre em contato com o suporte';
      default:
        return 'Status da conexão indisponível';
    }
  };

  const formatLastConnected = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getMainIcon()}
          <div>
            <h3 className="font-semibold text-lg text-card-foreground">Status WhatsApp</h3>
            {instanceName && (
              <p className="text-sm text-muted-foreground">
                Instância: {instanceName}
              </p>
            )}
          </div>
        </div>
        <StatusIndicator status={status} size="lg" />
      </div>

      <div className="space-y-4">
        {/* Status message */}
        <p className="text-sm text-muted-foreground">
          {getStatusMessage()}
        </p>
        
        {/* Last connected info */}
        {lastConnected && status !== 'connecting' && (
          <div className="text-xs text-muted-foreground">
            Última conexão: {formatLastConnected(lastConnected)}
          </div>
        )}
        
        {/* QR Code display quando connecting */}
        {status === 'connecting' && qrCode && (
          <div className="flex flex-col items-center space-y-3 py-4">
            <div className="bg-background p-4 rounded-lg border border-border">
              <img 
                src={qrCode} 
                alt="QR Code para conectar WhatsApp"
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground max-w-sm">
              Abra o WhatsApp no seu celular, vá em <strong>Dispositivos conectados</strong> 
              e escaneie este código QR
            </p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {status === 'disconnected' || status === 'error' ? (
            <Button
              variant="primary"
              onClick={onReconnect}
              loading={loading}
              loadingText="Conectando..."
              icon={<Wifi className="w-4 h-4" />}
              className="flex-1"
            >
              Reconectar Agora
            </Button>
          ) : null}
          
          {status === 'connecting' && (
            <Button
              variant="outline"
              onClick={onRefreshQR}
              loading={loading}
              icon={<QrCode className="w-4 h-4" />}
              className="flex-1"
            >
              Gerar Novo QR
            </Button>
          )}
          
          {status === 'connected' && (
            <Button
              variant="outline"
              onClick={onDisconnect}
              icon={<WifiOff className="w-4 h-4" />}
              className="flex-1"
            >
              Desconectar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}