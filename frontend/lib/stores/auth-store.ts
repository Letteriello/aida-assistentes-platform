import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

// Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  plan?: 'starter' | 'professional' | 'enterprise';
  createdAt?: string;
}

export interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Dados de sessão
  apiKey: string | null;
  expiresAt: number | null;
}

export interface AuthActions {
  // Ações de autenticação
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  
  // Ações de estado
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Verificação de sessão
  checkAuth: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
  
  // Utilitários
  isTokenExpired: () => boolean;
  getAuthHeaders: () => Record<string, string>;
}

type AuthStore = AuthState & AuthActions;

// Store principal
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      apiKey: null,
      expiresAt: null,

      // Ações de autenticação
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro no login');
          }

          const data = await response.json();
          
          // Salvar no cookie (compatibilidade com middleware)
          Cookies.set('aida_api_key', data.apiKey, {
            expires: 7, // 7 dias
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });

          // Atualizar estado
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            apiKey: data.apiKey,
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 dias
          });

          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoading: false,
          });
          return false;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro no registro');
          }

          const data = await response.json();
          
          // Salvar no cookie
          Cookies.set('aida_api_key', data.apiKey, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });

          // Atualizar estado
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            apiKey: data.apiKey,
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
          });

          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        // Remover cookie
        Cookies.remove('aida_api_key');
        
        // Limpar estado
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          apiKey: null,
          expiresAt: null,
        });
      },

      // Ações de estado
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Verificação de sessão
      checkAuth: async () => {
        // BYPASS TEMPORÁRIO PARA TESTES - REMOVER EM PRODUÇÃO
        const devBypass = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
        
        if (devBypass) {
          const mockUser: User = {
            id: 'mock-user-123',
            email: 'teste@aida.com',
            name: 'Usuário de Teste',
            plan: 'professional',
            createdAt: new Date().toISOString(),
          };
          
          set({
            user: mockUser,
            isAuthenticated: true,
            apiKey: 'mock-api-key-123',
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
          });
          
          return true;
        }
        
        const apiKey = Cookies.get('aida_api_key');
        
        if (!apiKey) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });

          if (!response.ok) {
            throw new Error('Token inválido');
          }

          const userData = await response.json();
          
          set({
            user: userData,
            isAuthenticated: true,
            apiKey,
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
          });

          return true;
        } catch (error) {
          // Token inválido, fazer logout
          get().logout();
          return false;
        }
      },

      refreshToken: async () => {
        const { apiKey } = get();
        
        if (!apiKey) return false;

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });

          if (!response.ok) {
            throw new Error('Falha ao renovar token');
          }

          const data = await response.json();
          
          // Atualizar cookie
          Cookies.set('aida_api_key', data.apiKey, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });

          set({
            apiKey: data.apiKey,
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
          });

          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      // Utilitários
      isTokenExpired: () => {
        const { expiresAt } = get();
        return expiresAt ? Date.now() > expiresAt : true;
      },

      getAuthHeaders: (): Record<string, string> => {
        const { apiKey } = get();
        return apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
      },
    }),
    {
      name: 'aida-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Apenas persistir dados essenciais
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        apiKey: state.apiKey,
        expiresAt: state.expiresAt,
      }),
    }
  )
);