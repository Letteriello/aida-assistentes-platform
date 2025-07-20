'use client';

import React, { useState, useEffect } from 'react';
import { AidaCard } from './aida-card';
import { AidaButton } from './aida-button';
import { QrCode, RefreshCw, Smartphone, CheckCircle, Copy } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCode?: string;
  instanceName: string;
  onRefresh?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
  autoRefresh?: boolean;
  autoRefreshInterval?: number; // em segundos
}

export function QRCodeDisplay({
  qrCode,
  instanceName,
  onRefresh,
  onCancel,
  loading = false,
  className,
  autoRefresh = true,
  autoRefreshInterval = 30
}: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(autoRefreshInterval);
  const [copied, setCopied] = useState(false);

  // Auto refresh timer
  useEffect(() => {
    if (!autoRefresh || !qrCode) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onRefresh?.();
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, qrCode, onRefresh, autoRefreshInterval]);

  // Reset timer quando QR code muda
  useEffect(() => {
    setTimeLeft(autoRefreshInterval);
  }, [qrCode, autoRefreshInterval]);

  const handleCopyInstructions = async () => {
    const instructions = `Para conectar o WhatsApp à instância "${instanceName}":
1. Abra o WhatsApp no seu celular
2. Toque em "Configurações" ou nos três pontos
3. Selecione "Dispositivos conectados"
4. Toque em "Conectar um dispositivo"
5. Escaneie o código QR exibido na tela`;

    try {
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar instruções:', error);
    }
  };

  return (
    <AidaCard
      title="Conectar WhatsApp"
      description={`Escaneie o QR Code para conectar a instância "${instanceName}"`}
      className={className}
      header={
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-amber-600" />
        </div>
      }
    >
      <div className="space-y-6">
        {/* QR Code display area */}
        <div className="flex flex-col items-center space-y-4">
          {qrCode ? (
            <div className="relative">
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100">
                <img 
                  src={qrCode} 
                  alt={`QR Code para conectar ${instanceName}`}
                  className="w-64 h-64 block"
                />
              </div>
              
              {/* Auto refresh indicator */}
              {autoRefresh && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white px-3 py-1 rounded-full shadow-md border text-xs text-muted-foreground">
                    Atualiza em {timeLeft}s
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-xl flex items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                  <span className="text-sm text-gray-500">Gerando QR Code...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <QrCode className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">QR Code não disponível</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">Como conectar:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque em &quot;Configurações&quot; ou nos três pontos</li>
                <li>Selecione &quot;Dispositivos conectados&quot;</li>
                <li>Toque em &quot;Conectar um dispositivo&quot;</li>
                <li>Escaneie o código QR acima</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <AidaButton
              variant="outline"
              size="sm"
              onClick={handleCopyInstructions}
              icon={copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copiado!' : 'Copiar instruções'}
            </AidaButton>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <AidaButton
            variant="outline"
            onClick={onRefresh}
            loading={loading}
            loadingText="Atualizando..."
            icon={<RefreshCw className="w-4 h-4" />}
            className="flex-1"
          >
            Gerar Novo QR
          </AidaButton>
          
          {onCancel && (
            <AidaButton
              variant="ghost"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </AidaButton>
          )}
        </div>

        {/* Success state indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full">
            <CheckCircle className="w-4 h-4" />
            Aguardando conexão...
          </div>
        </div>
      </div>
    </AidaCard>
  );
}