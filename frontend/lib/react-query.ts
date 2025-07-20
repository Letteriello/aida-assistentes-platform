import { QueryClient } from '@tanstack/react-query';

// React Query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time: how long data stays in cache when not used (10 minutes)
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in production
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Background refetch interval (5 minutes)
      refetchInterval: 5 * 60 * 1000,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
  },
  // Assistants
  assistants: {
    all: ['assistants'] as const,
    lists: () => [...queryKeys.assistants.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.assistants.lists(), { filters }] as const,
    details: () => [...queryKeys.assistants.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assistants.details(), id] as const,
    metrics: (id: string) => [...queryKeys.assistants.detail(id), 'metrics'] as const,
    stats: () => [...queryKeys.assistants.all, 'stats'] as const,
  },
  // Conversations
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.conversations.lists(), { filters }] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
    messages: (id: string) => [...queryKeys.conversations.detail(id), 'messages'] as const,
  },
} as const;

// Utility function to invalidate related queries
export const invalidateQueries = {
  users: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
    byId: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) }),
    current: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.current() }),
  },
  assistants: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.assistants.all }),
    byId: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.assistants.detail(id) }),
    stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.assistants.stats() }),
  },
  conversations: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all }),
    byId: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(id) }),
  },
};

// Error handling utility
export const handleQueryError = (error: unknown) => {
  console.error('Query error:', error);
  
  // You can add global error handling here
  // For example, show a toast notification or redirect to login
  
  if (error instanceof Error && 'status' in error) {
    const status = (error as any).status;
    
    switch (status) {
      case 401:
        // Handle unauthorized - redirect to login
        console.warn('Unauthorized access - redirecting to login');
        break;
      case 403:
        // Handle forbidden
        console.warn('Access forbidden');
        break;
      case 500:
        // Handle server error
        console.error('Server error occurred');
        break;
      default:
        console.error(`HTTP error ${status}`);
    }
  }
};