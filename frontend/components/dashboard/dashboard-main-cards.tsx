'use client';

import { 
  ConnectionStatus, 
  UsageMeter, 
  DashboardMetricsCard 
} from '@/components/aida';
import { 
  Wifi,
  Zap,
  TrendingUp
} from 'lucide-react';

// Mock data - em produção viria das APIs
const mockUsageData = {
  messagesUsed: 782,
  messageLimit: 1000,
  documentsUsed: 9,
  documentLimit: 10,
  instancesUsed: 1,
  instanceLimit: 1
};

export function DashboardMainCards() {
  const handleReconnect = async () => {
    console.log('Reconectando WhatsApp...');
  };

  const handleUpgradeMessages = async () => {
    console.log('Upgrade mensagens...');
  };

  const handleUpgradeDocuments = async () => {
    console.log('Upgrade documentos...');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="rounded-lg border border-border bg-card transition-colors hover:bg-accent/50">
        <ConnectionStatus
          status="connected"
          instanceName="assistente-loja"
          lastConnected={new Date(Date.now() - 2 * 60 * 60 * 1000)} // 2 horas atrás
          onReconnect={handleReconnect}
        />
      </div>

      <div className="rounded-lg border border-border bg-card transition-colors hover:bg-accent/50">
        <UsageMeter
          usage={mockUsageData}
          onUpgradeMessages={handleUpgradeMessages}
          onUpgradeDocuments={handleUpgradeDocuments}
        />
      </div>

      <div className="rounded-lg border border-border bg-card transition-colors hover:bg-accent/50">
        <DashboardMetricsCard
          conversationsToday={24}
          responseRate={96}
          avgResponseTime={2.3}
          satisfactionScore={4.7}
        />
      </div>
    </div>
  );
}