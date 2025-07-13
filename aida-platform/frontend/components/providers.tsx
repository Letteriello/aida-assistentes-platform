'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Cookies from 'js-cookie';
import type { Business, ApiKeyAuth } from '@shared/types';

// Auth Context for API key-based authentication
interface AuthContextType {
  business: Business | null;
  apiKey: ApiKeyAuth | null;
  loading: boolean;
  signIn: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// API client for authentication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787';

async function loginWithApiKey(apiKey: string): Promise<{
  success: boolean;
  business?: Business;
  apiKeyInfo?: ApiKeyAuth;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Login failed',
      };
    }

    return {
      success: true,
      business: data.business,
      apiKeyInfo: data.apiKey,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [apiKey, setApiKey] = useState<ApiKeyAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored API key on mount
    const storedApiKey = Cookies.get('aida_api_key');
    
    if (storedApiKey) {
      // Validate stored API key
      loginWithApiKey(storedApiKey)
        .then((result) => {
          if (result.success && result.business && result.apiKeyInfo) {
            setBusiness(result.business);
            setApiKey(result.apiKeyInfo);
          } else {
            // Invalid stored key, remove it
            Cookies.remove('aida_api_key');
          }
        })
        .catch((error) => {
          console.error('Failed to validate stored API key:', error);
          Cookies.remove('aida_api_key');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (apiKeyValue: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const result = await loginWithApiKey(apiKeyValue);
      
      if (result.success && result.business && result.apiKeyInfo) {
        setBusiness(result.business);
        setApiKey(result.apiKeyInfo);
        
        // Store API key securely
        Cookies.set('aida_api_key', apiKeyValue, {
          expires: 30, // 30 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Login failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setBusiness(null);
    setApiKey(null);
    Cookies.remove('aida_api_key');
  };

  const isAuthenticated = business !== null && apiKey !== null;

  return (
    <AuthContext.Provider value={{
      business,
      apiKey,
      loading,
      signIn,
      signOut,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});

// Main Providers Component
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}