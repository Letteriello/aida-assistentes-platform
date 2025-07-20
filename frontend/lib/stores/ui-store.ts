import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface LoadingState {
  [key: string]: boolean;
}

export interface Modal {
  id: string;
  type: 'confirm' | 'info' | 'error' | 'custom';
  title: string;
  content: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

export interface UIState {
  // Loading states
  loading: LoadingState;
  globalLoading: boolean;
  
  // Modais
  modals: Modal[];
  
  // Notificacoes
  notifications: Notification[];
  
  // Sidebar
  sidebarCollapsed: boolean;
  
  // Tema
  theme: 'light' | 'dark' | 'system';
  
  // Outros estados de UI
  isOnline: boolean;
  lastActivity: number;
}

export interface UIActions {
  // Loading
  setLoading: (key: string, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  clearAllLoading: () => void;
  
  // Modais
  openModal: (modal: Omit<Modal, 'id' | 'isOpen'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Notificacoes
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Sidebar
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Tema
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Atividade
  updateActivity: () => void;
  setOnlineStatus: (online: boolean) => void;
}

type UIStore = UIState & UIActions;

// Utilitários
const generateId = () => Math.random().toString(36).substr(2, 9);

// Store principal
export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      loading: {},
      globalLoading: false,
      modals: [],
      notifications: [],
      sidebarCollapsed: false,
      theme: 'system',
      isOnline: true,
      lastActivity: Date.now(),

      // Loading actions
      setLoading: (key: string, loading: boolean) => {
        set((state) => ({
          loading: {
            ...state.loading,
            [key]: loading,
          },
        }));
      },

      setGlobalLoading: (globalLoading: boolean) => {
        set({ globalLoading });
      },

      clearAllLoading: () => {
        set({ loading: {}, globalLoading: false });
      },

      // Modal actions
      openModal: (modalData) => {
        const id = generateId();
        const modal: Modal = {
          ...modalData,
          id,
          isOpen: true,
        };
        
        set((state) => ({
          modals: [...state.modals, modal],
        }));
        
        return id;
      },

      closeModal: (id: string) => {
        set((state) => ({
          modals: state.modals.map((modal) =>
            modal.id === id ? { ...modal, isOpen: false } : modal
          ),
        }));
        
        // Remove modal apos animacao
        setTimeout(() => {
          set((state) => ({
            modals: state.modals.filter((modal) => modal.id !== id),
          }));
        }, 300);
      },

      closeAllModals: () => {
        set((state) => ({
          modals: state.modals.map((modal) => ({ ...modal, isOpen: false })),
        }));
        
        setTimeout(() => {
          set({ modals: [] });
        }, 300);
      },

      // Notification actions
      addNotification: (notificationData) => {
        const id = generateId();
        const notification: Notification = {
          ...notificationData,
          id,
          timestamp: Date.now(),
          duration: notificationData.duration || 5000,
        };
        
        set((state) => ({
          notifications: [...state.notifications, notification],
        }));
        
        // Auto-remove apos duracao especificada
        if (notification.duration && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
        
        return id;
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      // Sidebar actions
      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
      },

      // Activity actions
      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
      },
    }),
    {
      name: 'aida-ui-storage',
      storage: createJSONStorage(() => localStorage),
      // Persistir apenas configurações do usuário
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// Hooks utilitários
export const useLoading = (key: string) => {
  const loading = useUIStore((state) => state.loading[key] || false);
  const setLoading = useUIStore((state) => state.setLoading);
  
  return {
    loading,
    setLoading: (value: boolean) => setLoading(key, value),
  };
};

export const useNotifications = () => {
  const notifications = useUIStore((state) => state.notifications);
  const addNotification = useUIStore((state) => state.addNotification);
  const removeNotification = useUIStore((state) => state.removeNotification);
  
  return {
    notifications,
    addNotification,
    removeNotification,
    success: (title: string, message: string) => 
      addNotification({ type: 'success', title, message }),
    error: (title: string, message: string) => 
      addNotification({ type: 'error', title, message }),
    warning: (title: string, message: string) => 
      addNotification({ type: 'warning', title, message }),
    info: (title: string, message: string) => 
      addNotification({ type: 'info', title, message }),
  };
};