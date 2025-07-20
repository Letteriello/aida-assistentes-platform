import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'location';
  sender: 'user' | 'assistant' | 'system';
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number; // para audio
    coordinates?: { lat: number; lng: number }; // para localizacao
  };
}

export interface Conversation {
  id: string;
  participantName: string;
  participantPhone: string;
  participantAvatar?: string;
  assistantId: string;
  assistantName: string;
  status: 'active' | 'waiting' | 'closed' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  lastMessage?: Message;
  lastActivity: number;
  createdAt: number;
  closedAt?: number;
  
  // Estatisticas
  messageCount: number;
  responseTime: number;
  satisfaction?: number;
  
  // Metadados
  metadata: {
    source: 'whatsapp' | 'web' | 'api';
    language: string;
    timezone: string;
    customerInfo?: {
      name?: string;
      email?: string;
      company?: string;
      notes?: string;
    };
  };
}

export interface ConversationFilter {
  status: Conversation['status'] | 'all';
  priority: Conversation['priority'] | 'all';
  assistant: string | 'all';
  dateRange: {
    start: number | null;
    end: number | null;
  };
  tags: string[];
  searchQuery: string;
}

export interface ConversationsState {
  // Lista de conversas
  conversations: Conversation[];
  messages: Record<string, Message[]>; // conversationId -> messages
  
  // Conversa selecionada
  selectedConversation: Conversation | null;
  
  // Estados de carregamento
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  
  // Filtros e busca
  filter: ConversationFilter;
  
  // Paginação
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  hasMore: boolean;
  
  // Estados de UI
  sidebarOpen: boolean;
  typingUsers: Record<string, boolean>; // conversationId -> isTyping
  
  // Erros
  error: string | null;
}

export interface ConversationsActions {
  // CRUD Conversas
  loadConversations: (page?: number) => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  createConversation: (data: Omit<Conversation, 'id' | 'createdAt' | 'lastActivity' | 'messageCount'>) => Promise<void>;
  updateConversation: (id: string, data: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  closeConversation: (id: string) => Promise<void>;
  
  // Mensagens
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: Message['type']) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  
  // Seleção
  selectConversation: (conversation: Conversation | null) => void;
  
  // Filtros
  setFilter: (filter: Partial<ConversationFilter>) => void;
  clearFilters: () => void;
  
  // Paginação
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  
  // UI States
  setSidebarOpen: (open: boolean) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  
  // Ações específicas
  assignToAssistant: (conversationId: string, assistantId: string) => Promise<void>;
  addTag: (conversationId: string, tag: string) => Promise<void>;
  removeTag: (conversationId: string, tag: string) => Promise<void>;
  setPriority: (conversationId: string, priority: Conversation['priority']) => Promise<void>;
  
  // Utilitários
  getConversationById: (id: string) => Conversation | undefined;
  getFilteredConversations: () => Conversation[];
  getUnreadCount: () => number;
  clearError: () => void;
  setError: (error: string) => void;
}

type ConversationsStore = ConversationsState & ConversationsActions;

// Filtro inicial
const initialFilter: ConversationFilter = {
  status: 'all',
  priority: 'all',
  assistant: 'all',
  dateRange: {
    start: null,
    end: null,
  },
  tags: [],
  searchQuery: '',
};

// Store principal
export const useConversationsStore = create<ConversationsStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      conversations: [],
      messages: {},
      selectedConversation: null,
      isLoading: false,
      isLoadingMessages: false,
      isSendingMessage: false,
      filter: initialFilter,
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 0,
      hasMore: true,
      sidebarOpen: true,
      typingUsers: {},
      error: null,

      // Carregar conversas
      loadConversations: async (page = 1) => {
        set({ isLoading: true, error: null });
        
        try {
          const { filter, itemsPerPage } = get();
          const params = new URLSearchParams({
            page: page.toString(),
            limit: itemsPerPage.toString(),
            ...Object.fromEntries(
              Object.entries(filter).filter(([_, value]) => 
                value !== 'all' && value !== '' && value !== null
              )
            ),
          });

          const response = await fetch(`/api/conversations?${params}`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Falha ao carregar conversas');
          }

          const data = await response.json();
          
          set({
            conversations: page === 1 ? data.conversations : [...get().conversations, ...data.conversations],
            totalItems: data.total,
            hasMore: data.hasMore,
            currentPage: page,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoading: false,
          });
        }
      },

      // Carregar mais conversas
      loadMoreConversations: async () => {
        const { currentPage, hasMore, isLoading } = get();
        if (!hasMore || isLoading) return;
        
        await get().loadConversations(currentPage + 1);
      },

      // Criar conversa
      createConversation: async (data) => {
        try {
          const response = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error('Falha ao criar conversa');
          }

          const newConversation = await response.json();
          
          set((state) => ({
            conversations: [newConversation, ...state.conversations],
            totalItems: state.totalItems + 1,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      },

      // Atualizar conversa
      updateConversation: async (id, data) => {
        try {
          const response = await fetch(`/api/conversations/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error('Falha ao atualizar conversa');
          }

          const updatedConversation = await response.json();
          
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === id ? updatedConversation : conv
            ),
            selectedConversation: state.selectedConversation?.id === id ? updatedConversation : state.selectedConversation,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      },

      // Deletar conversa
      deleteConversation: async (id) => {
        try {
          const response = await fetch(`/api/conversations/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Falha ao deletar conversa');
          }
          
          set((state) => ({
            conversations: state.conversations.filter((conv) => conv.id !== id),
            selectedConversation: state.selectedConversation?.id === id ? null : state.selectedConversation,
            totalItems: state.totalItems - 1,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      },

      // Arquivar conversa
      archiveConversation: async (id) => {
        await get().updateConversation(id, { status: 'archived' });
      },

      // Fechar conversa
      closeConversation: async (id) => {
        await get().updateConversation(id, { 
          status: 'closed',
          closedAt: Date.now(),
        });
      },

      // Carregar mensagens
      loadMessages: async (conversationId) => {
        set({ isLoadingMessages: true, error: null });
        
        try {
          const response = await fetch(`/api/conversations/${conversationId}/messages`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Falha ao carregar mensagens');
          }

          const messages = await response.json();
          
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: messages,
            },
            isLoadingMessages: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoadingMessages: false,
          });
        }
      },

      // Enviar mensagem
      sendMessage: async (conversationId, content, type = 'text') => {
        set({ isSendingMessage: true, error: null });
        
        try {
          const response = await fetch(`/api/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content, type }),
          });

          if (!response.ok) {
            throw new Error('Falha ao enviar mensagem');
          }

          const newMessage = await response.json();
          
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || []), newMessage],
            },
            isSendingMessage: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isSendingMessage: false,
          });
        }
      },

      // Marcar como lida
      markAsRead: async (conversationId) => {
        try {
          await fetch(`/api/conversations/${conversationId}/read`, {
            method: 'POST',
          });
        } catch (error) {
          console.warn('Falha ao marcar como lida:', error);
        }
      },

      // Seleção
      selectConversation: (conversation) => {
        set({ selectedConversation: conversation });
        
        if (conversation) {
          // Carregar mensagens automaticamente
          get().loadMessages(conversation.id);
          // Marcar como lida
          get().markAsRead(conversation.id);
        }
      },

      // Filtros
      setFilter: (newFilter) => {
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
          currentPage: 1,
        }));
        
        // Recarregar conversas com novo filtro
        get().loadConversations(1);
      },

      clearFilters: () => {
        set({ filter: initialFilter, currentPage: 1 });
        get().loadConversations(1);
      },

      // Paginação
      setCurrentPage: (currentPage) => {
        set({ currentPage });
      },

      setItemsPerPage: (itemsPerPage) => {
        set({ itemsPerPage, currentPage: 1 });
        get().loadConversations(1);
      },

      // UI States
      setSidebarOpen: (sidebarOpen) => {
        set({ sidebarOpen });
      },

      setTyping: (conversationId, isTyping) => {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: isTyping,
          },
        }));
      },

      // Ações específicas
      assignToAssistant: async (conversationId, assistantId) => {
        await get().updateConversation(conversationId, { assistantId });
      },

      addTag: async (conversationId, tag) => {
        const conversation = get().getConversationById(conversationId);
        if (!conversation) return;
        
        const newTags = [...conversation.tags, tag].filter((t, i, arr) => arr.indexOf(t) === i);
        await get().updateConversation(conversationId, { tags: newTags });
      },

      removeTag: async (conversationId, tag) => {
        const conversation = get().getConversationById(conversationId);
        if (!conversation) return;
        
        const newTags = conversation.tags.filter(t => t !== tag);
        await get().updateConversation(conversationId, { tags: newTags });
      },

      setPriority: async (conversationId, priority) => {
        await get().updateConversation(conversationId, { priority });
      },

      // Utilitários
      getConversationById: (id) => {
        return get().conversations.find(conv => conv.id === id);
      },

      getFilteredConversations: () => {
        const { conversations, filter } = get();
        
        return conversations.filter(conv => {
          const matchesStatus = filter.status === 'all' || conv.status === filter.status;
          const matchesPriority = filter.priority === 'all' || conv.priority === filter.priority;
          const matchesAssistant = filter.assistant === 'all' || conv.assistantId === filter.assistant;
          
          const matchesSearch = !filter.searchQuery || 
            conv.participantName.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
            conv.participantPhone.includes(filter.searchQuery) ||
            conv.lastMessage?.content.toLowerCase().includes(filter.searchQuery.toLowerCase());
          
          const matchesTags = filter.tags.length === 0 || 
            filter.tags.some(tag => conv.tags.includes(tag));
          
          const matchesDateRange = 
            (!filter.dateRange.start || conv.createdAt >= filter.dateRange.start) &&
            (!filter.dateRange.end || conv.createdAt <= filter.dateRange.end);
          
          return matchesStatus && matchesPriority && matchesAssistant && 
                 matchesSearch && matchesTags && matchesDateRange;
        });
      },

      getUnreadCount: () => {
        return get().conversations.filter(conv => 
          conv.lastMessage && conv.lastMessage.status !== 'read'
        ).length;
      },

      clearError: () => {
        set({ error: null });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'aida-conversations-storage',
      storage: createJSONStorage(() => localStorage),
      // Persistir apenas configurações de UI
      partialize: (state) => ({
        itemsPerPage: state.itemsPerPage,
        sidebarOpen: state.sidebarOpen,
        filter: {
          status: state.filter.status,
          priority: state.filter.priority,
          assistant: state.filter.assistant,
        },
      }),
    }
  )
);