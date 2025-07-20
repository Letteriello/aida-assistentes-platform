// Tipos para APIs e respostas do servidor

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Estados de requisicao
export interface RequestState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Tipos para autenticacao
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
}

export interface ApiKeys {
  live: string;
  test: string;
}

export interface Business {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterResponse {
  business: Business;
  apiKeys: ApiKeys;
}