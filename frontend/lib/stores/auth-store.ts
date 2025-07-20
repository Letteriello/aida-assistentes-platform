import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import whatsappAuthClient, { AuthUser, PhoneVerificationRequest, VerifyCodeRequest } from '../whatsapp-auth';

// Types
export interface User {
  id: string;
  phone: string;
  name?: string;
  businessId?: string;
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
  token: string | null;
  expiresAt: number | null;
  
  // WhatsApp Auth específico
  pendingPhone: string | null;
  verificationSent: boolean;
}

export interface AuthActions {
  // Ações de autenticação WhatsApp
  sendVerificationCode: (phoneNumber: string) => Promise<boolean>;
  verifyCode: (phoneNumber: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Ações de estado
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setPendingPhone: (phone: string | null) => void;
  setVerificationSent: (sent: boolean) => void;
  
  // Verificação de sessão
  checkAuth: () => Promise<boolean>;
  
  // Utilitários
  isTokenExpired: () => boolean;
  getAuthHeaders: () => Record<string, string>;
  validatePhone: (phone: string) => { isValid: boolean; formattedPhone: string; error?: string };
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
      token: null,
      expiresAt: null,
      pendingPhone: null,
      verificationSent: false,

      // Ações de autenticação WhatsApp
      sendVerificationCode: async (phoneNumber: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await whatsappAuthClient.sendVerificationCode({ phoneNumber });
          
          if (result.success) {
            set({
              pendingPhone: phoneNumber,
              verificationSent: true,
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: result.message,
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoading: false,
          });
          return false;
        }
      },

      verifyCode: async (phoneNumber: string, code: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await whatsappAuthClient.verifyCode({ phoneNumber, code });
          
          if (result.success && result.token && result.user) {
            // Salvar no cookie
            Cookies.set('aida_auth_token', result.token, {
              expires: 30, // 30 dias
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            });

            // Mapear AuthUser para User
            const user: User = {
              id: result.user.id,
              phone: result.user.phone,
              name: result.user.name,
              businessId: result.user.businessId,
            };

            // Atualizar estado
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              token: result.token,
              expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 dias
              pendingPhone: null,
              verificationSent: false,
            });

            return true;
          } else {
            set({
              error: result.message,
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoading: false,
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await whatsappAuthClient.logout();
        } catch (error) {
          console.warn('Erro no logout:', error);
        }
        
        // Remover cookie
        Cookies.remove('aida_auth_token');
        
        // Limpar estado
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          token: null,
          expiresAt: null,
          pendingPhone: null,
          verificationSent: false,
        });
      },

      // Ações de estado
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setPendingPhone: (phone) => set({ pendingPhone: phone }),
      setVerificationSent: (sent) => set({ verificationSent: sent }),

      // Verificação de sessão
      checkAuth: async () => {
        // BYPASS TEMPORÁRIO PARA TESTES - REMOVER EM PRODUÇÃO
        const devBypass = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
        
        if (devBypass) {
          const mockUser: User = {
            id: 'mock-user-123',
            phone: '+5511999999999',
            name: 'Usuário de Teste',
            plan: 'professional',
            createdAt: new Date().toISOString(),
          };
          
          set({
            user: mockUser,
            isAuthenticated: true,
            token: 'mock-token-123',
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
          });
          
          return true;
        }
        
        const token = Cookies.get('aida_auth_token');
        
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        try {
          // Definir token no cliente antes de fazer a requisição
          whatsappAuthClient.clearAuth();
          if (token) {
            // Simular definir token no client (seria feito automaticamente na inicialização)
            const result = await whatsappAuthClient.getCurrentUser();
            
            if (result.success && result.user) {
              const user: User = {
                id: result.user.id,
                phone: result.user.phone,
                name: result.user.name,
                businessId: result.user.businessId,
              };
              
              set({
                user,
                isAuthenticated: true,
                token,
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
              });

              return true;
            }
          }
          
          throw new Error('Token inválido');
        } catch (error) {
          // Token inválido, fazer logout
          await get().logout();
          return false;
        }
      },

      // Utilitários
      isTokenExpired: () => {
        const { expiresAt } = get();
        return expiresAt ? Date.now() > expiresAt : true;
      },

      getAuthHeaders: (): Record<string, string> => {
        const { token } = get();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      },

      validatePhone: (phone: string) => {
        return whatsappAuthClient.validateBrazilianPhone(phone);
      },
    }),
    {
      name: 'aida-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Apenas persistir dados essenciais
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        expiresAt: state.expiresAt,
        pendingPhone: state.pendingPhone,
        verificationSent: state.verificationSent,
      }),
    }
  )
);