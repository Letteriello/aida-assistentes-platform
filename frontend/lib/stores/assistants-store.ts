import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface Assistant {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'training';
  type: 'customer_service' | 'sales' | 'support' | 'general';
  language: string;
  createdAt: string;
  updatedAt: string;
  
  // Configuracoes
  settings: {
    welcomeMessage: string;
    fallbackMessage: string;
    maxTokens: number;
    temperature: number;
    responseTime: number;
    autoResponse: boolean;
    workingHours: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
  };
  
  // Estatisticas
  stats: {
    totalConversations: number;
    totalMessages: number;
    averageResponseTime: number;
    satisfactionRate: number;
    lastActivity: string;
  };
}

export interface AssistantTemplate {
  id: string;
  name: string;
  description: string;
  type: Assistant['type'];
  defaultSettings: Assistant['settings'];
  prompts: {
    system: string;
    welcome: string;
    fallback: string;
  };
}

export interface AssistantsState {
  // Lista de assistentes
  assistants: Assistant[];
  templates: AssistantTemplate[];
  
  // Assistente selecionado
  selectedAssistant: Assistant | null;
  
  // Estados de carregamento
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Filtros e busca
  searchQuery: string;
  statusFilter: Assistant['status'] | 'all';
  typeFilter: Assistant['type'] | 'all';
  
  // Paginacao
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  
  // Erros
  error: string | null;
}

export interface AssistantsActions {
  // CRUD Assistentes
  loadAssistants: () => Promise<void>;
  createAssistant: (data: Omit<Assistant, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => Promise<void>;
  updateAssistant: (id: string, data: Partial<Assistant>) => Promise<void>;
  deleteAssistant: (id: string) => Promise<void>;
  duplicateAssistant: (id: string) => Promise<void>;
  
  // Templates
  loadTemplates: () => Promise<void>;
  createFromTemplate: (templateId: string, customData?: Partial<Assistant>) => Promise<void>;
  
  // Selecao
  selectAssistant: (assistant: Assistant | null) => void;
  
  // Filtros e busca
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: Assistant['status'] | 'all') => void;
  setTypeFilter: (type: Assistant['type'] | 'all') => void;
  clearFilters: () => void;
  
  // Paginacao
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  
  // Acoes especificas
  toggleAssistantStatus: (id: string) => Promise<void>;
  updateAssistantSettings: (id: string, settings: Partial<Assistant['settings']>) => Promise<void>;
  
  // Utilitarios
  getAssistantById: (id: string) => Assistant | undefined;
  getFilteredAssistants: () => Assistant[];
  clearError: () => void;
  setError: (error: string) => void;
}

type AssistantsStore = AssistantsState & AssistantsActions;

// Templates padrao
const defaultTemplates: AssistantTemplate[] = [
  {
    id: 'customer-service',
    name: 'Atendimento ao Cliente',
    description: 'Assistente especializado em atendimento e suporte ao cliente',
    type: 'customer_service',
    defaultSettings: {
      welcomeMessage: 'Ola! Como posso ajuda-lo hoje?',
      fallbackMessage: 'Desculpe, nao entendi. Pode reformular sua pergunta?',
      maxTokens: 150,
      temperature: 0.7,
      responseTime: 2000,
      autoResponse: true,
      workingHours: {
        enabled: true,
        start: '08:00',
        end: '18:00',
        timezone: 'America/Sao_Paulo',
      },
    },
    prompts: {
      system: 'Voce e um assistente de atendimento ao cliente profissional e prestativo.',
      welcome: 'Ola! Como posso ajuda-lo hoje?',
      fallback: 'Desculpe, nao entendi. Pode reformular sua pergunta?',
    },
  },
  {
    id: 'sales',
    name: 'Vendas',
    description: 'Assistente focado em vendas e conversao de leads',
    type: 'sales',
    defaultSettings: {
      welcomeMessage: 'Ola! Estou aqui para ajuda-lo a encontrar a solucao perfeita!',
      fallbackMessage: 'Posso esclarecer melhor sobre nossos produtos e servicos.',
      maxTokens: 200,
      temperature: 0.8,
      responseTime: 1500,
      autoResponse: true,
      workingHours: {
        enabled: true,
        start: '09:00',
        end: '19:00',
        timezone: 'America/Sao_Paulo',
      },
    },
    prompts: {
      system: 'Voce e um assistente de vendas persuasivo e conhecedor dos produtos.',
      welcome: 'Ola! Estou aqui para ajuda-lo a encontrar a solucao perfeita!',
      fallback: 'Posso esclarecer melhor sobre nossos produtos e servicos.',
    },
  },
];

// Store principal
export const useAssistantsStore = create<AssistantsStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      assistants: [],
      templates: defaultTemplates,
      selectedAssistant: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      searchQuery: '',
      statusFilter: 'all',
      typeFilter: 'all',
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      error: null,

      // Carregar assistentes
      loadAssistants: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/assistants', {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Falha ao carregar assistentes');
          }

          const data = await response.json();
          
          set({
            assistants: data.assistants || [],
            totalItems: data.total || 0,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoading: false,
          });
        }
      },

      // Criar assistente
      createAssistant: async (data) => {
        set({ isCreating: true, error: null });
        
        try {
          const response = await fetch('/api/assistants', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error('Falha ao criar assistente');
          }

          const newAssistant = await response.json();
          
          set((state) => ({
            assistants: [newAssistant, ...state.assistants],
            totalItems: state.totalItems + 1,
            isCreating: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isCreating: false,
          });
        }
      },

      // Atualizar assistente
      updateAssistant: async (id, data) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await fetch(`/api/assistants/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error('Falha ao atualizar assistente');
          }

          const updatedAssistant = await response.json();
          
          set((state) => ({
            assistants: state.assistants.map((assistant) =>
              assistant.id === id ? updatedAssistant : assistant
            ),
            selectedAssistant: state.selectedAssistant?.id === id ? updatedAssistant : state.selectedAssistant,
            isUpdating: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isUpdating: false,
          });
        }
      },

      // Deletar assistente
      deleteAssistant: async (id) => {
        set({ isDeleting: true, error: null });
        
        try {
          const response = await fetch(`/api/assistants/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Falha ao deletar assistente');
          }
          
          set((state) => ({
            assistants: state.assistants.filter((assistant) => assistant.id !== id),
            selectedAssistant: state.selectedAssistant?.id === id ? null : state.selectedAssistant,
            totalItems: state.totalItems - 1,
            isDeleting: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isDeleting: false,
          });
        }
      },

      // Duplicar assistente
      duplicateAssistant: async (id) => {
        const assistant = get().getAssistantById(id);
        if (!assistant) return;
        
        const duplicateData = {
          ...assistant,
          name: `${assistant.name} (Copia)`,
          status: 'inactive' as const,
        };
        
        delete (duplicateData as any).id;
        delete (duplicateData as any).createdAt;
        delete (duplicateData as any).updatedAt;
        delete (duplicateData as any).stats;
        
        await get().createAssistant(duplicateData);
      },

      // Carregar templates
      loadTemplates: async () => {
        try {
          const response = await fetch('/api/assistants/templates');
          
          if (response.ok) {
            const templates = await response.json();
            set({ templates });
          }
        } catch (error) {
          // Usar templates padrao em caso de erro
          console.warn('Falha ao carregar templates, usando padroes');
        }
      },

      // Criar a partir de template
      createFromTemplate: async (templateId, customData = {}) => {
        const template = get().templates.find(t => t.id === templateId);
        if (!template) {
          throw new Error('Template nao encontrado');
        }
        
        const assistantData = {
          name: customData.name || template.name,
          description: customData.description || template.description,
          type: template.type,
          language: 'pt-BR',
          status: 'inactive' as const,
          settings: { ...template.defaultSettings, ...customData.settings },
          ...customData,
        };
        
        await get().createAssistant(assistantData);
      },

      // Selecao
      selectAssistant: (assistant) => {
        set({ selectedAssistant: assistant });
      },

      // Filtros
      setSearchQuery: (searchQuery) => {
        set({ searchQuery, currentPage: 1 });
      },

      setStatusFilter: (statusFilter) => {
        set({ statusFilter, currentPage: 1 });
      },

      setTypeFilter: (typeFilter) => {
        set({ typeFilter, currentPage: 1 });
      },

      clearFilters: () => {
        set({
          searchQuery: '',
          statusFilter: 'all',
          typeFilter: 'all',
          currentPage: 1,
        });
      },

      // Paginação
      setCurrentPage: (currentPage) => {
        set({ currentPage });
      },

      setItemsPerPage: (itemsPerPage) => {
        set({ itemsPerPage, currentPage: 1 });
      },

      // Acoes especificas
      toggleAssistantStatus: async (id) => {
        const assistant = get().getAssistantById(id);
        if (!assistant) return;
        
        const newStatus = assistant.status === 'active' ? 'inactive' : 'active';
        await get().updateAssistant(id, { status: newStatus });
      },

      updateAssistantSettings: async (id, settings) => {
        const assistant = get().getAssistantById(id);
        if (!assistant) return;
        
        const updatedSettings = { ...assistant.settings, ...settings };
        await get().updateAssistant(id, { settings: updatedSettings });
      },

      // Utilitarios
      getAssistantById: (id) => {
        return get().assistants.find(assistant => assistant.id === id);
      },

      getFilteredAssistants: () => {
        const { assistants, searchQuery, statusFilter, typeFilter } = get();
        
        return assistants.filter(assistant => {
          const matchesSearch = !searchQuery || 
            assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            assistant.description.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesStatus = statusFilter === 'all' || assistant.status === statusFilter;
          const matchesType = typeFilter === 'all' || assistant.type === typeFilter;
          
          return matchesSearch && matchesStatus && matchesType;
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'aida-assistants-storage',
      storage: createJSONStorage(() => localStorage),
      // Persistir apenas filtros e configuracoes
      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        statusFilter: state.statusFilter,
        typeFilter: state.typeFilter,
      }),
    }
  )
);