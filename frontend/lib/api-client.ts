/**
 * AIDA Platform - API Client
 * Cliente HTTP para consumir APIs do backend com autenticação por JWT.
 * PATTERN: Axios-based client with interceptors for JWT-based user authentication.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// Types for API responses
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

interface ApiError {
  error: string;
  message: string;
  timestamp: string;
  status?: number;
}

// Configuration interface
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private authToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    this.setupInterceptors();
    this.loadStoredAuthToken();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token to headers
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and retry logic
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 - Unauthorized (invalid token)
        if (error.response?.status === 401) {
          this.clearAuthToken();
          toast.error('Sessão expirada. Faça login novamente.');
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        // Handle 403 - Forbidden (insufficient permissions)
        if (error.response?.status === 403) {
          toast.error('Acesso negado. Verifique suas permissões.');
          return Promise.reject(error);
        }

        // Handle 429 - Rate limit
        if (error.response?.status === 429) {
          toast.error('Muitas requisições. Tente novamente em alguns segundos.');
          return Promise.reject(error);
        }

        // Retry logic for network errors and 5xx errors
        if (
          (!error.response || error.response.status >= 500) &&
          originalRequest &&
          !originalRequest._retry &&
          originalRequest._retryCount < this.config.retryAttempts!
        ) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          await this.delay(this.config.retryDelay! * originalRequest._retryCount);
          return this.client(originalRequest);
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
        toast.error(`Erro: ${errorMessage}`);
        
        return Promise.reject(error);
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private loadStoredAuthToken() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('authToken');
      if (stored) {
        this.authToken = stored;
      }
    }
  }

  // Auth Token management
  setAuthToken(token: string) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  clearAuthToken() {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }
}

// Create and export the API client instance
const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8787',
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000
});

const setAuthToken = (token: string) => apiClient.setAuthToken(token);
const clearAuthToken = () => apiClient.clearAuthToken();

export default apiClient;
export { ApiClient, setAuthToken, clearAuthToken, type ApiResponse, type ApiError, type ApiClientConfig };