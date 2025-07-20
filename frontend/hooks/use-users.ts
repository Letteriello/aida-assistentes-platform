// Hooks específicos para operações com usuários

import { useApiQuery, useApiMutation } from './use-api';
import { User, RegisterData, RegisterResponse, LoginCredentials } from '@/types';

// Hook para buscar usuários
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

// Hook para buscar um usuário específico
export function useUser(userId: string, options?: { enabled?: boolean }) {
  return useApiQuery<User>(
    ['users', userId],
    `/users/${userId}`,
    {
      enabled: options?.enabled && !!userId,
    }
  );
}

// Hook para buscar o usuário atual
export function useCurrentUser() {
  return useApiQuery<User>(
    ['users', 'current'],
    '/users/me',
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );
}

// Hook para registrar novo usuário
export function useRegisterUser() {
  return useApiMutation<RegisterResponse, RegisterData>(
    '/register',
    'POST',
    {
      onSuccess: (data) => {
        console.log('Usuário registrado com sucesso:', data);
      },
      onError: (error) => {
        console.error('Erro ao registrar usuário:', error.message);
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

// Hook para atualizar usuário
export function useUpdateUser(userId: string) {
  return useApiMutation<User, Partial<User>>(
    `/users/${userId}`,
    'PUT',
    {
      onSuccess: () => {
        console.log('Usuário atualizado com sucesso');
      },
      invalidateQueries: [
        ['users'],
        ['users', userId],
        ['users', 'current'],
      ],
    }
  );
}

// Hook para deletar usuário
export function useDeleteUser() {
  return useApiMutation<void, string>(
    '/users',
    'DELETE',
    {
      onSuccess: () => {
        console.log('Usuário deletado com sucesso');
      },
      invalidateQueries: [['users']],
    }
  );
}

// Hook para atualizar preferências do usuário
export function useUpdateUserPreferences(userId: string) {
  return useApiMutation<User, Partial<User['preferences']>>(
    `/users/${userId}/preferences`,
    'PUT',
    {
      onSuccess: () => {
        console.log('Preferências atualizadas com sucesso');
      },
      invalidateQueries: [
        ['users', userId],
        ['users', 'current'],
      ],
    }
  );
}