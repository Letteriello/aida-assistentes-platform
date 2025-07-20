// Exportações centralizadas de todos os tipos

// Tipos de API
export * from './api';

// Tipos de usuário e entidades
export * from './user';

// Tipos de componentes
export * from './components';

// Tipos de design tokens (já existente)
export * from './design-tokens';

// Tipos de upload (já existente)
export * from './file-upload';

// Tipos utilitários
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Tipos para hooks
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UsePaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

// Tipos para stores (Zustand)
export interface BaseStore {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}