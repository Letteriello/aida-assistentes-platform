import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface DashboardMetrics {
  totalConversations: number;
  activeAssistants: number;
  messagesThisMonth: number;
  responseTime: number;
  satisfactionRate: number;
  uptime: number;
}

export interface UsageData {
  current: number;
  limit: number;
  percentage: number;
  resetDate: string;
}

export interface ConnectionStatus {
  whatsapp: 'connected' | 'disconnected' | 'error';
  api: 'connected' | 'disconnected' | 'error';
  database: 'connected' | 'disconnected' | 'error';
  lastCheck: number;
}

export interface RecentActivity {
  id: string;
  type: 'conversation' | 'assistant' | 'user' | 'system';
  title: string;
  description: string;
  timestamp: number;
  status?: 'success' | 'error' | 'warning' | 'info';
}

export interface DashboardState {
  // Métricas principais
  metrics: DashboardMetrics;
  usage: UsageData;
  connectionStatus: ConnectionStatus;
  recentActivity: RecentActivity[];
  
  // Estados de carregamento
  isLoadingMetrics: boolean;
  isLoadingUsage: boolean;
  isLoadingActivity: boolean;
  
  // Configurações do dashboard
  refreshInterval: number;
  autoRefresh: boolean;
  
  // Última atualização
  lastUpdated: number;
  
  // Erros
  error: string | null;
}

export interface DashboardActions {
  // Carregar dados
  loadMetrics: () => Promise<void>;
  loadUsage: () => Promise<void>;
  loadConnectionStatus: () => Promise<void>;
  loadRecentActivity: () => Promise<void>;
  loadAllData: () => Promise<void>;
  
  // Atualizar dados específicos
  updateMetrics: (metrics: Partial<DashboardMetrics>) => void;
  updateUsage: (usage: Partial<UsageData>) => void;
  updateConnectionStatus: (status: Partial<ConnectionStatus>) => void;
  addActivity: (activity: Omit<RecentActivity, 'id'>) => void;
  
  // Configurações
  setRefreshInterval: (interval: number) => void;
  setAutoRefresh: (enabled: boolean) => void;
  
  // Utilitários
  refresh: () => Promise<void>;
  clearError: () => void;
  setError: (error: string) => void;
}

type DashboardStore = DashboardState & DashboardActions;

// Dados iniciais/mock
const initialMetrics: DashboardMetrics = {
  totalConversations: 0,
  activeAssistants: 0,
  messagesThisMonth: 0,
  responseTime: 0,
  satisfactionRate: 0,
  uptime: 0,
};

const initialUsage: UsageData = {
  current: 0,
  limit: 1000,
  percentage: 0,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const initialConnectionStatus: ConnectionStatus = {
  whatsapp: 'disconnected',
  api: 'disconnected',
  database: 'disconnected',
  lastCheck: Date.now(),
};

// Store principal
export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      metrics: initialMetrics,
      usage: initialUsage,
      connectionStatus: initialConnectionStatus,
      recentActivity: [],
      isLoadingMetrics: false,
      isLoadingUsage: false,
      isLoadingActivity: false,
      refreshInterval: 30000, // 30 segundos
      autoRefresh: true,
      lastUpdated: 0,
      error: null,

      // Carregar métricas
      loadMetrics: async () => {
        set({ isLoadingMetrics: true, error: null });
        
        try {
          const response = await fetch('/api/dashboard/stats', {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Falha ao carregar métricas');
          }

          const metrics = await response.json();
          
          set({
            metrics,
            isLoadingMetrics: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoadingMetrics: false,
          });
        }
      },

      // Carregar uso
      loadUsage: async () => {
        set({ isLoadingUsage: true, error: null });
        
        try {
          const response = await fetch('/api/dashboard/platform-stats', {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Falha ao carregar dados de uso');
          }

          const usage = await response.json();
          
          set({
            usage,
            isLoadingUsage: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoadingUsage: false,
          });
        }
      },

      // Carregar status de conexão
      loadConnectionStatus: async () => {
        try {
          const response = await fetch('/api/dashboard/health', {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Falha ao verificar status');
          }

          const status = await response.json();
          
          set({
            connectionStatus: {
              ...status,
              lastCheck: Date.now(),
            },
          });
        } catch (error) {
          set({
            connectionStatus: {
              whatsapp: 'error',
              api: 'error',
              database: 'error',
              lastCheck: Date.now(),
            },
          });
        }
      },

      // Carregar atividade recente
      loadRecentActivity: async () => {
        set({ isLoadingActivity: true, error: null });
        
        try {
          const response = await fetch('/api/dashboard/activity', {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Falha ao carregar atividades');
          }

          const activities = await response.json();
          
          set({
            recentActivity: activities,
            isLoadingActivity: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoadingActivity: false,
          });
        }
      },

      // Carregar todos os dados
      loadAllData: async () => {
        const { loadMetrics, loadUsage, loadConnectionStatus, loadRecentActivity } = get();
        
        await Promise.allSettled([
          loadMetrics(),
          loadUsage(),
          loadConnectionStatus(),
          loadRecentActivity(),
        ]);
      },

      // Atualizar métricas
      updateMetrics: (newMetrics) => {
        set((state) => ({
          metrics: { ...state.metrics, ...newMetrics },
          lastUpdated: Date.now(),
        }));
      },

      // Atualizar uso
      updateUsage: (newUsage) => {
        set((state) => ({
          usage: { ...state.usage, ...newUsage },
          lastUpdated: Date.now(),
        }));
      },

      // Atualizar status de conexão
      updateConnectionStatus: (newStatus) => {
        set((state) => ({
          connectionStatus: {
            ...state.connectionStatus,
            ...newStatus,
            lastCheck: Date.now(),
          },
        }));
      },

      // Adicionar atividade
      addActivity: (activity) => {
        const newActivity: RecentActivity = {
          ...activity,
          id: Math.random().toString(36).substr(2, 9),
        };
        
        set((state) => ({
          recentActivity: [newActivity, ...state.recentActivity].slice(0, 10), // Manter apenas 10 mais recentes
        }));
      },

      // Configurações
      setRefreshInterval: (interval) => {
        set({ refreshInterval: interval });
      },

      setAutoRefresh: (autoRefresh) => {
        set({ autoRefresh });
      },

      // Utilitários
      refresh: async () => {
        await get().loadAllData();
      },

      clearError: () => {
        set({ error: null });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'aida-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      // Persistir apenas configurações
      partialize: (state) => ({
        refreshInterval: state.refreshInterval,
        autoRefresh: state.autoRefresh,
      }),
    }
  )
);

// Hook para auto-refresh
export const useDashboardAutoRefresh = () => {
  const { autoRefresh, refreshInterval, loadAllData } = useDashboardStore();
  
  React.useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadAllData();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadAllData]);
};