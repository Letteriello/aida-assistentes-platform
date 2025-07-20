// Schemas de validação usando Zod

import { z } from 'zod';

// Schema base para validação de email
export const emailSchema = z.string().email('Email inválido');

// Schema base para validação de telefone
export const phoneSchema = z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(15, 'Telefone deve ter no máximo 15 dígitos');

// Schema para registro de usuário
export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  contact_name: z.string().min(2, 'Nome do contato deve ter pelo menos 2 caracteres').max(100, 'Nome do contato deve ter no máximo 100 caracteres'),
  email: emailSchema,
  phone: phoneSchema,
});

// Schema para login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Schema para atualização de usuário
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  email: emailSchema.optional(),
  avatar_url: z.string().url('URL do avatar inválida').optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
      marketing: z.boolean().optional(),
    }).optional(),
    dashboard: z.object({
      defaultView: z.enum(['grid', 'list']).optional(),
      itemsPerPage: z.number().min(5).max(100).optional(),
      showMetrics: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

// Schema para criação de assistente
export const createAssistantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  avatar_url: z.string().url('URL do avatar inválida').optional(),
  configuration: z.object({
    model: z.string().min(1, 'Modelo é obrigatório'),
    temperature: z.number().min(0).max(2, 'Temperatura deve estar entre 0 e 2'),
    max_tokens: z.number().min(1).max(4000, 'Máximo de tokens deve estar entre 1 e 4000'),
    system_prompt: z.string().max(2000, 'Prompt do sistema deve ter no máximo 2000 caracteres').optional(),
    knowledge_base: z.array(z.string()).optional(),
    integrations: z.array(z.object({
      type: z.enum(['whatsapp', 'telegram', 'slack', 'discord']),
      config: z.record(z.any()),
    })).optional(),
  }),
});

// Schema para atualização de assistente
export const updateAssistantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  avatar_url: z.string().url('URL do avatar inválida').optional(),
  status: z.enum(['active', 'inactive', 'training', 'error']).optional(),
});

// Schema para configuração de assistente
export const assistantConfigurationSchema = z.object({
  model: z.string().min(1, 'Modelo é obrigatório').optional(),
  temperature: z.number().min(0).max(2, 'Temperatura deve estar entre 0 e 2').optional(),
  max_tokens: z.number().min(1).max(4000, 'Máximo de tokens deve estar entre 1 e 4000').optional(),
  system_prompt: z.string().max(2000, 'Prompt do sistema deve ter no máximo 2000 caracteres').optional(),
  knowledge_base: z.array(z.string()).optional(),
  integrations: z.array(z.object({
    type: z.enum(['whatsapp', 'telegram', 'slack', 'discord']),
    config: z.record(z.any()),
  })).optional(),
});

// Schema para mensagem
export const messageSchema = z.object({
  content: z.string().min(1, 'Conteúdo da mensagem é obrigatório').max(4000, 'Mensagem deve ter no máximo 4000 caracteres'),
  type: z.enum(['text', 'image', 'audio', 'video', 'document', 'system']).default('text'),
  metadata: z.record(z.any()).optional(),
});

// Schema para conversa
export const conversationSchema = z.object({
  assistant_id: z.string().uuid('ID do assistente inválido'),
  platform: z.enum(['whatsapp', 'telegram', 'web', 'api']),
  metadata: z.object({
    platform_chat_id: z.string().optional(),
    user_phone: z.string().optional(),
    user_name: z.string().optional(),
    tags: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

// Schema para upload de arquivo
export const fileUploadSchema = z.object({
  file: z.instanceof(File, 'Arquivo é obrigatório'),
  type: z.enum(['document', 'image', 'audio', 'video']).optional(),
  description: z.string().max(200, 'Descrição deve ter no máximo 200 caracteres').optional(),
});

// Schema para paginação
export const paginationSchema = z.object({
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite deve ser no máximo 100').default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Schema para filtros de busca
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['active', 'inactive', 'training', 'error']).optional(),
  platform: z.enum(['whatsapp', 'telegram', 'web', 'api']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

// Tipos inferidos dos schemas
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type CreateAssistantData = z.infer<typeof createAssistantSchema>;
export type UpdateAssistantData = z.infer<typeof updateAssistantSchema>;
export type AssistantConfigurationData = z.infer<typeof assistantConfigurationSchema>;
export type MessageData = z.infer<typeof messageSchema>;
export type ConversationData = z.infer<typeof conversationSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
export type SearchFiltersData = z.infer<typeof searchFiltersSchema>;

// Função utilitária para validar dados
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
  return { success: false, errors };
}