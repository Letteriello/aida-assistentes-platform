// Tipos relacionados a usuarios e perfis

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  business_id?: string;
  role: UserRole;
  preferences?: UserPreferences;
}

export type UserRole = 'admin' | 'user' | 'viewer';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
}

export interface DashboardSettings {
  defaultView: 'grid' | 'list';
  itemsPerPage: number;
  showMetrics: boolean;
}

// Tipos para assistentes
export interface Assistant {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  status: AssistantStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  business_id: string;
  configuration: AssistantConfiguration;
  metrics?: AssistantMetrics;
}

export type AssistantStatus = 'active' | 'inactive' | 'training' | 'error';

export interface AssistantConfiguration {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  knowledge_base?: string[];
  integrations: Integration[];
}

export interface Integration {
  id: string;
  type: 'whatsapp' | 'telegram' | 'slack' | 'discord';
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
}

export interface AssistantMetrics {
  total_conversations: number;
  total_messages: number;
  avg_response_time: number;
  satisfaction_score: number;
  uptime_percentage: number;
  last_activity: string;
}

// Tipos para conversas
export interface Conversation {
  id: string;
  assistant_id: string;
  user_id?: string;
  platform: 'whatsapp' | 'telegram' | 'web' | 'api';
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  messages: Message[];
  metadata?: ConversationMetadata;
}

export type ConversationStatus = 'active' | 'closed' | 'archived';

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  type: MessageType;
  sender: MessageSender;
  timestamp: string;
  metadata?: MessageMetadata;
}

export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'system';

export interface MessageSender {
  id: string;
  name: string;
  type: 'user' | 'assistant' | 'system';
}

export interface MessageMetadata {
  platform_message_id?: string;
  response_time?: number;
  confidence_score?: number;
  tokens_used?: number;
}

export interface ConversationMetadata {
  platform_chat_id?: string;
  user_phone?: string;
  user_name?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}