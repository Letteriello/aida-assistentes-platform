import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import whatsappInstanceClient, { WhatsAppInstance, CreateInstanceRequest, SendMessageRequest } from '../whatsapp-instances';

// Types
export interface InstancesState {
  // Estado
  instances: WhatsAppInstance[];
  selectedInstance: WhatsAppInstance | null;
  isLoading: boolean;
  error: string | null;
  
  // QR Code
  currentQRCode: string | null;
  qrCodeLoading: boolean;
}

export interface InstancesActions {
  // Ações de instâncias
  createInstance: (request: CreateInstanceRequest) => Promise<boolean>;
  loadInstances: () => Promise<void>;
  refreshInstance: (instanceId: string) => Promise<void>;
  deleteInstance: (instanceId: string) => Promise<boolean>;
  
  // QR Code
  getQRCode: (instanceId: string) => Promise<boolean>;
  clearQRCode: () => void;
  
  // Mensagens
  sendTestMessage: (instanceId: string, request: SendMessageRequest) => Promise<boolean>;
  
  // Seleção
  selectInstance: (instance: WhatsAppInstance | null) => void;
  
  // Estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Polling para atualizações
  startPolling: () => void;
  stopPolling: () => void;
}

type InstancesStore = InstancesState & InstancesActions;

// Store principal
export const useInstancesStore = create<InstancesStore>()(
  persist(
    (set, get) => {
      let pollInterval: NodeJS.Timeout | null = null;

      return {
        // Estado inicial
        instances: [],
        selectedInstance: null,
        isLoading: false,
        error: null,
        currentQRCode: null,
        qrCodeLoading: false,

        // Ações de instâncias
        createInstance: async (request: CreateInstanceRequest) => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await whatsappInstanceClient.createInstance(request);
            
            if (result.success && result.instance) {
              // Adicionar nova instância à lista
              const { instances } = get();
              set({
                instances: [result.instance, ...instances],
                isLoading: false,
                currentQRCode: result.qrCode || null
              });
              
              // Selecionar a nova instância
              get().selectInstance(result.instance);
              
              return true;
            } else {
              set({
                error: result.message,
                isLoading: false
              });
              return false;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              isLoading: false
            });
            return false;
          }
        },

        loadInstances: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await whatsappInstanceClient.listInstances();
            
            if (result.success) {
              set({
                instances: result.instances,
                isLoading: false
              });
            } else {
              set({
                error: 'Erro ao carregar instâncias',
                isLoading: false
              });
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              isLoading: false
            });
          }
        },

        refreshInstance: async (instanceId: string) => {
          try {
            const result = await whatsappInstanceClient.getInstanceStatus(instanceId);
            
            if (result.success && result.instance) {
              const { instances, selectedInstance } = get();
              
              const updatedInstances = instances.map(instance => 
                instance.id === instanceId ? result.instance! : instance
              );
              
              set({
                instances: updatedInstances,
                selectedInstance: selectedInstance?.id === instanceId ? result.instance : selectedInstance
              });
            }
          } catch (error) {
            console.error('Error refreshing instance:', error);
          }
        },

        deleteInstance: async (instanceId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await whatsappInstanceClient.deleteInstance(instanceId);
            
            if (result.success) {
              const { instances, selectedInstance } = get();
              
              // Remover instância da lista
              const updatedInstances = instances.filter(instance => instance.id !== instanceId);
              
              set({
                instances: updatedInstances,
                selectedInstance: selectedInstance?.id === instanceId ? null : selectedInstance,
                isLoading: false
              });
              
              return true;
            } else {
              set({
                error: result.message,
                isLoading: false
              });
              return false;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              isLoading: false
            });
            return false;
          }
        },

        // QR Code
        getQRCode: async (instanceId: string) => {
          set({ qrCodeLoading: true, error: null });
          
          try {
            const result = await whatsappInstanceClient.getQRCode(instanceId);
            
            if (result.success && result.qrCode) {
              set({
                currentQRCode: result.qrCode,
                qrCodeLoading: false
              });
              return true;
            } else {
              set({
                error: result.message,
                qrCodeLoading: false
              });
              return false;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              qrCodeLoading: false
            });
            return false;
          }
        },

        clearQRCode: () => {
          set({ currentQRCode: null });
        },

        // Mensagens
        sendTestMessage: async (instanceId: string, request: SendMessageRequest) => {
          set({ isLoading: true, error: null });
          
          try {
            const result = await whatsappInstanceClient.sendTestMessage(instanceId, request);
            
            if (result.success) {
              set({ isLoading: false });
              return true;
            } else {
              set({
                error: result.message,
                isLoading: false
              });
              return false;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro desconhecido',
              isLoading: false
            });
            return false;
          }
        },

        // Seleção
        selectInstance: (instance: WhatsAppInstance | null) => {
          set({ selectedInstance: instance });
        },

        // Estado
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Polling
        startPolling: () => {
          // Parar polling existente
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          
          // Iniciar novo polling a cada 30 segundos
          pollInterval = setInterval(async () => {
            const { instances } = get();
            
            // Atualizar apenas instâncias que precisam de monitoramento
            for (const instance of instances) {
              if (instance.status === 'qrcode' || instance.status === 'creating') {
                await get().refreshInstance(instance.id);
              }
            }
          }, 30000); // 30 segundos
        },

        stopPolling: () => {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      };
    },
    {
      name: 'aida-instances-storage',
      storage: createJSONStorage(() => localStorage),
      // Apenas persistir dados essenciais
      partialize: (state) => ({
        instances: state.instances,
        selectedInstance: state.selectedInstance
      }),
    }
  )
);