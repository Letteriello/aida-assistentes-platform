// Hook base para requisicoes de API usando React Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, ApiError } from '@/types';

// Configuracao base para o cliente de API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Funcao utilitaria para fazer requisicoes
export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Erro na requisicao');
    }
    
    return response.json();
  },
  
  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Erro na requisição');
    }
    
    return response.json();
  },
  
  put: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Erro na requisição');
    }
    
    return response.json();
  },
  
  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Erro na requisição');
    }
    
    return response.json();
  },
};

// Hook generico para queries
export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: () => apiClient.get<ApiResponse<T>>(endpoint),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutos por padrao
    select: (data) => data.data, // Extrai apenas os dados da resposta
  });
}

// Hook generico para mutations
export function useApiMutation<TData, TVariables = any>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (variables: TVariables) => {
      switch (method) {
        case 'POST':
          return apiClient.post<ApiResponse<TData>>(endpoint, variables);
        case 'PUT':
          return apiClient.put<ApiResponse<TData>>(endpoint, variables);
        case 'DELETE':
          return apiClient.delete<ApiResponse<TData>>(endpoint);
        default:
          throw new Error(`Metodo ${method} nao suportado`);
      }
    },
    onSuccess: (data) => {
      // Invalida queries relacionadas
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      if (options?.onSuccess) {
        options.onSuccess(data.data!);
      }
    },
    onError: options?.onError,
  });
}

// Hook para invalidar queries manualmente
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return (queryKeys: string[][]) => {
    queryKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  };
}