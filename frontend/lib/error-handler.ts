import { ApiError } from '@/types';

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true);
  }
}

// Error handler for API responses
export const handleApiError = (error: unknown): ApiError => {
  // If it's already an AppError, convert to ApiError format
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.statusCode.toString(),
      details: error.context,
    };
  }

  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error - please check your connection',
      code: 'NETWORK_ERROR',
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Handle unknown error types
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
};

// Error handler for React components
export const handleComponentError = (error: unknown, errorInfo?: { componentStack: string }) => {
  console.error('Component error:', error);
  if (errorInfo) {
    console.error('Component stack:', errorInfo.componentStack);
  }

  // You can add error reporting service here (e.g., Sentry)
  // reportError(error, errorInfo);
};

// Utility to check if error is operational (expected) or programming error
export const isOperationalError = (error: unknown): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Format error for user display
export const formatErrorForUser = (error: unknown): string => {
  const apiError = handleApiError(error);
  
  // Map technical errors to user-friendly messages
  const userFriendlyMessages: Record<string, string> = {
    'NETWORK_ERROR': 'Problema de conexão. Verifique sua internet e tente novamente.',
    'VALIDATION_ERROR': 'Dados inválidos. Verifique os campos e tente novamente.',
    '401': 'Você precisa fazer login para continuar.',
    '403': 'Você não tem permissão para realizar esta ação.',
    '404': 'O recurso solicitado não foi encontrado.',
    '409': 'Conflito de dados. O recurso já existe.',
    '429': 'Muitas tentativas. Aguarde um momento e tente novamente.',
    '500': 'Erro interno do servidor. Tente novamente mais tarde.',
  };

  return userFriendlyMessages[apiError.code] || apiError.message;
};

// Retry utility for failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
};

// Global error boundary handler
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      handleComponentError(event.reason);
      // Prevent the default browser behavior
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      console.error('Uncaught error:', event.error);
      handleComponentError(event.error);
    });
  }
};