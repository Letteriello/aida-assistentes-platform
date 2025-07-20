/**
 * AIDA Platform - Authentication System
 * Sistema de autenticacao de usuario com email/senha e gerenciamento de sessao via Supabase/JWT.
 * PATTERN: Context-based auth with JWT for user sessions.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiClient, { setAuthToken, clearAuthToken } from './api-client';
import { toast } from 'sonner';
import type { User, Business, RegisterData } from '@shared/types';

// Auth types
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  business_id: string;
  permissions: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface AuthBusiness {
  id: string;
  name: string;
  industry?: string;
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'suspended';
  max_assistants: number;
  max_conversations_per_month: number;
  settings?: Record<string, any>;
}

interface AuthState {
  user: AuthUser | null;
  business: AuthBusiness | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: UserLoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}



interface UserLoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  user: AuthUser;
  business: AuthBusiness;
  token: string;
  message: string;
}



// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    business: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        setAuthToken(token);
        await refreshAuth();
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuthToken();
      setState(prev => ({ ...prev, user: null, business: null, isAuthenticated: false, isLoading: false }));
    }
  };

  const login = async (data: UserLoginData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await apiClient.post<AuthResponse>('/auth/user/login', data);

      if (response.success && response.data) {
        const { user, business, token } = response.data;
        
        setAuthToken(token);
        localStorage.setItem('authToken', token);

        setState({
          user,
          business,
          isLoading: false,
          isAuthenticated: true
        });

        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await apiClient.post<AuthResponse>('/auth/user/register', data);

      if (response.success && response.data) {
        const { user, business, token } = response.data;

        // Don't auto-login, just show success and let them log in.
        setState(prev => ({ ...prev, isLoading: false }));

        toast.success('Registro realizado com sucesso! Faca o login para continuar.');
        // Optionally, you could auto-login here by setting state and token
      }
    } catch (error: any) {
      console.error('Register error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      const errorMessage = error.response?.data?.message || 'Erro ao registrar. Verifique os dados e tente novamente.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    clearAuthToken();
    localStorage.removeItem('authToken');
    setState({
      user: null,
      business: null,
      isLoading: false,
      isAuthenticated: false
    });
    toast.info('Voce foi desconectado.');
  };

  const refreshAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      // This endpoint should be protected and return user/business info based on the JWT
      const response = await apiClient.get<Omit<AuthResponse, 'token'>>('/auth/user/me');

      if (response.success && response.data) {
        const { user, business } = response.data;
        setState({
          user,
          business,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        throw new Error('Failed to refresh authentication');
      }
    } catch (error) {
      console.error('Refresh auth error:', error);
      logout(); // Clear state if refresh fails
    }
  };

  // Store user and business data when state changes
  useEffect(() => {
    if (state.user && state.business) {
      localStorage.setItem('aida_user', JSON.stringify(state.user));
      localStorage.setItem('aida_business', JSON.stringify(state.business));
    } else {
      localStorage.removeItem('aida_user');
      localStorage.removeItem('aida_business');
    }
  }, [state.user, state.business]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hooks for specific auth data
export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useBusiness() {
  const { business } = useAuth();
  return business;
}

export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return React.createElement('div', { 
        className: 'flex items-center justify-center min-h-screen'
      }, React.createElement('div', {
        className: 'animate-spin rounded-full h-32 w-32 border-b-2 border-primary'
      }));
    }
    
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }
    
    return React.createElement(Component, props);
  };
}

export type { AuthUser, AuthBusiness, AuthState, AuthContextType, RegisterData };