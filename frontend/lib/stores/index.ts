// Centralized exports for all Zustand stores

// Auth Store
export * from './auth-store';
export type { User, AuthState, AuthActions } from './auth-store';

// UI Store
export * from './ui-store';
export type { 
  LoadingState, 
  Modal, 
  Notification, 
  UIState, 
  UIActions
} from './ui-store';

// Dashboard Store
export * from './dashboard-store';
export type { 
  DashboardMetrics,
  UsageData,
  ConnectionStatus,
  RecentActivity,
  DashboardState,
  DashboardActions
} from './dashboard-store';

// Assistants Store
export * from './assistants-store';
export type { 
  Assistant,
  AssistantTemplate,
  AssistantsState,
  AssistantsActions
} from './assistants-store';

// Conversations Store
export * from './conversations-store';
export type { 
  Message,
  Conversation,
  ConversationFilter,
  ConversationsState,
  ConversationsActions
} from './conversations-store';

// Re-export hooks for convenience
export { useAuthStore } from './auth-store';
export { useUIStore } from './ui-store';
export { useDashboardStore, useDashboardAutoRefresh } from './dashboard-store';
export { useAssistantsStore } from './assistants-store';
export { useConversationsStore } from './conversations-store';