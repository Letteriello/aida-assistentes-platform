// Hooks especificos para operacoes com usuarios

import { useApiQuery, useApiMutation } from './use-api';
import { User, RegisterData, RegisterResponse, LoginCredentials } from '@/types';

// Hook para buscar usuarios
export function useUsers(options?: { enabled?: boolean }) {
  return useApiQuery<User[]>(
    ['users'],
    '/users',
    {
      enabled: options?.enabled,
      staleTime: 10 * 60 * 1000, // 10 minutos
    }
  );
}

// Hook para buscar um usuario especifico
export function useUser(userId: string, options?: { enabled?: boolean }) {
  return useApiQuery<User>(
    ['users', userId],
    `/users/${userId}`,
    {
      enabled: options?.enabled && !!userId,
    }
  );
}

// Hook para buscar o usuario atual
export function useCurrentUser() {
  return useApiQuery<User>(
    ['users', 'current'],
    '/users/me',
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );
}

// Hook para registrar novo usuario
export function useRegisterUser() {
  return useApiMutation<RegisterResponse, RegisterData>(
    '/register',
    'POST',
    {
      onSuccess: (data) => {
        console.log('Usuario registrado com sucesso:', data);
      },
      onError: (error) => {
        console.error('Erro ao registrar usuario:', error.message);
      },
    }
  );
}

// Hook para fazer login
export function useLogin() {
  return useApiMutation<{ user: User; token: string }, LoginCredentials>(
    '/auth/login',
    'POST',
    {
      onSuccess: (data) => {
        // Armazenar token no localStorage ou cookie
        localStorage.setItem('auth_token', data.token);
        console.log('Login realizado com sucesso');
      },
      invalidateQueries: [['users', 'current']],
    }
  );
}

// Hook para fazer logout
export function useLogout() {
  return useApiMutation<void, void>(
    '/auth/logout',
    'POST',
    {
      onSuccess: () => {
        // Remover token do localStorage
        localStorage.removeItem('auth_token');
        console.log('Logout realizado com sucesso');
      },
      invalidateQueries: [['users', 'current']],
    }
  );
}

// Hook para atualizar usuario
export function useUpdateUser(userId: string) {
  return useApiMutation<User, Partial<User>>(
    `/users/${userId}`,
    'PUT',
    {
      onSuccess: () => {
        console.log('Usuario atualizado com sucesso');
      },
      invalidateQueries: [
        ['users'],
        ['users', userId],
        ['users', 'current'],
      ],
    }
  );
}

// Hook para deletar usuario
export function useDeleteUser() {
  return useApiMutation<void, string>(
    '/users',
    'DELETE',
    {
      onSuccess: () => {
        console.log('Usuario deletado com sucesso');
      },
      invalidateQueries: [['users']],
    }
  );
}

// Hook para atualizar preferencias do usuario
export function useUpdateUserPreferences(userId: string) {
  return useApiMutation<User, Partial<User['preferences']>>(
    `/users/${userId}/preferences`,
    'PUT',
    {
      onSuccess: () => {
        console.log('Preferencias atualizadas com sucesso');
      },
      invalidateQueries: [
        ['users', userId],
        ['users', 'current'],
      ],
    }
  );
}