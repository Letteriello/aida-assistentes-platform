// Hooks específicos para operações com assistentes

import { useApiQuery, useApiMutation } from './use-api';
import { Assistant, AssistantConfiguration, AssistantMetrics } from '@/types';

// Hook para buscar assistentes
export function useAssistants(options?: { enabled?: boolean }) {
  return useApiQuery<Assistant[]>(
    ['assistants'],
    '/assistants',
    {
      enabled: options?.enabled,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );
}

// Hook para buscar um assistente específico
export function useAssistant(assistantId: string, options?: { enabled?: boolean }) {
  return useApiQuery<Assistant>(
    ['assistants', assistantId],
    `/assistants/${assistantId}`,
    {
      enabled: options?.enabled && !!assistantId,
    }
  );
}

// Hook para buscar métricas de um assistente
export function useAssistantMetrics(assistantId: string, options?: { enabled?: boolean }) {
  return useApiQuery<AssistantMetrics>(
    ['assistants', assistantId, 'metrics'],
    `/assistants/${assistantId}/metrics`,
    {
      enabled: options?.enabled && !!assistantId,
      refetchInterval: 30 * 1000, // Atualiza a cada 30 segundos
    }
  );
}

// Hook para criar novo assistente
export function useCreateAssistant() {
  return useApiMutation<Assistant, Omit<Assistant, 'id' | 'created_at' | 'updated_at'>>(
    '/assistants',
    'POST',
    {
      onSuccess: (data) => {
        console.log('Assistente criado com sucesso:', data.name);
      },
      onError: (error) => {
        console.error('Erro ao criar assistente:', error.message);
      },
      invalidateQueries: [['assistants']],
    }
  );
}

// Hook para atualizar assistente
export function useUpdateAssistant(assistantId: string) {
  return useApiMutation<Assistant, Partial<Assistant>>(
    `/assistants/${assistantId}`,
    'PUT',
    {
      onSuccess: (data) => {
        console.log('Assistente atualizado com sucesso:', data.name);
      },
      invalidateQueries: [
        ['assistants'],
        ['assistants', assistantId],
        ['assistants', assistantId, 'metrics'],
      ],
    }
  );
}

// Hook para deletar assistente
export function useDeleteAssistant() {
  return useApiMutation<void, string>(
    '/assistants',
    'DELETE',
    {
      onSuccess: () => {
        console.log('Assistente deletado com sucesso');
      },
      invalidateQueries: [['assistants']],
    }
  );
}

// Hook para atualizar configuração do assistente
export function useUpdateAssistantConfiguration(assistantId: string) {
  return useApiMutation<Assistant, Partial<AssistantConfiguration>>(
    `/assistants/${assistantId}/configuration`,
    'PUT',
    {
      onSuccess: () => {
        console.log('Configuração do assistente atualizada com sucesso');
      },
      invalidateQueries: [
        ['assistants'],
        ['assistants', assistantId],
      ],
    }
  );
}

// Hook para alternar status do assistente
export function useToggleAssistantStatus(assistantId: string) {
  return useApiMutation<Assistant, { status: Assistant['status'] }>(
    `/assistants/${assistantId}/status`,
    'PUT',
    {
      onSuccess: (data) => {
        console.log(`Status do assistente alterado para: ${data.status}`);
      },
      invalidateQueries: [
        ['assistants'],
        ['assistants', assistantId],
        ['assistants', assistantId, 'metrics'],
      ],
    }
  );
}

// Hook para treinar assistente
export function useTrainAssistant(assistantId: string) {
  return useApiMutation<{ message: string }, { documents?: File[]; urls?: string[] }>(
    `/assistants/${assistantId}/train`,
    'POST',
    {
      onSuccess: (data) => {
        console.log('Treinamento iniciado:', data.message);
      },
      invalidateQueries: [
        ['assistants'],
        ['assistants', assistantId],
      ],
    }
  );
}

// Hook para buscar assistentes por status
export function useAssistantsByStatus(status: Assistant['status']) {
  return useApiQuery<Assistant[]>(
    ['assistants', 'status', status],
    `/assistants?status=${status}`,
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
    }
  );
}

// Hook para estatísticas gerais dos assistentes
export function useAssistantsStats() {
  return useApiQuery<{
    total: number;
    active: number;
    inactive: number;
    training: number;
    error: number;
  }>(
    ['assistants', 'stats'],
    '/assistants/stats',
    {
      refetchInterval: 60 * 1000, // Atualiza a cada minuto
    }
  );
}