'use client';

import React from 'react';
import { ProgressBar } from './progress-bar';
import { AidaButton } from './aida-button';
import { MessageSquare, FileText, Smartphone, TrendingUp } from 'lucide-react';

interface UsageData {
  messagesUsed: number;
  messageLimit: number;
  documentsUsed: number;
  documentLimit: number;
  instancesUsed: number;
  instanceLimit: number;
}

interface UsageMeterProps {
  usage: UsageData;
  onUpgradeMessages?: () => void;
  onUpgradeDocuments?: () => void;
  onUpgradeInstances?: () => void;
  showUpgradeButtons?: boolean;
  className?: string;
}

export function UsageMeter({
  usage,
  onUpgradeMessages,
  onUpgradeDocuments,
  onUpgradeInstances,
  showUpgradeButtons = true,
  className
}: UsageMeterProps) {
  const usageItems = [
    {
      icon: MessageSquare,
      label: 'Mensagens de IA',
      used: usage.messagesUsed,
      limit: usage.messageLimit,
      onUpgrade: onUpgradeMessages,
      upgradeText: '+ 1.000 mensagens (R$ 25)',
    },
    {
      icon: FileText,
      label: 'Documentos',
      used: usage.documentsUsed,
      limit: usage.documentLimit,
      onUpgrade: onUpgradeDocuments,
      upgradeText: '+ 10 documentos (R$ 39,90)',
    },
    {
      icon: Smartphone,
      label: 'Instâncias WhatsApp',
      used: usage.instancesUsed,
      limit: usage.instanceLimit,
      onUpgrade: onUpgradeInstances,
      upgradeText: '+ 1 instância (R$ 99)',
    }
  ];

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-card-foreground">Uso do Plano</h3>
          <p className="text-sm text-muted-foreground">Acompanhe o consumo dos recursos da sua assinatura</p>
        </div>
      </div>

      <div className="space-y-6">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const percentage = (item.used / item.limit) * 100;
          const needsUpgrade = percentage >= 70;
          
          return (
            <div key={item.label} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <ProgressBar
                  value={item.used}
                  max={item.limit}
                  label={item.label}
                  showNumbers={true}
                  showPercentage={false}
                  size="md"
                  className="flex-1"
                />
              </div>
              
              {showUpgradeButtons && needsUpgrade && item.onUpgrade && (
                <AidaButton
                  variant="outline"
                  size="sm"
                  onClick={item.onUpgrade}
                  className="w-full"
                  icon={<TrendingUp className="w-4 h-4" />}
                >
                  {item.upgradeText}
                </AidaButton>
              )}
            </div>
          );
        })}
        
        {/* Resumo total */}
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Próxima fatura estimada:</span>
            <span className="font-semibold text-lg text-card-foreground">
              R$ {calculateEstimatedBill(usage).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function para calcular fatura estimada
function calculateEstimatedBill(usage: UsageData): number {
  const basePlan = 99.00;
  
  // Mensagens extras (acima do limite de 1000)
  const extraMessages = Math.max(0, usage.messagesUsed - usage.messageLimit);
  const extraMessageBlocks = Math.ceil(extraMessages / 1000);
  const messageCost = extraMessageBlocks * 25.00;
  
  // Documentos extras (acima do limite de 10)
  const extraDocuments = Math.max(0, usage.documentsUsed - usage.documentLimit);
  const extraDocumentBlocks = Math.ceil(extraDocuments / 10);
  const documentCost = extraDocumentBlocks * 39.90;
  
  // Instâncias extras (acima do limite de 1)
  const extraInstances = Math.max(0, usage.instancesUsed - usage.instanceLimit);
  const instanceCost = extraInstances * 99.00;
  
  return basePlan + messageCost + documentCost + instanceCost;
}