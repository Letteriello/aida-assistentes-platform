// Tipos para props de componentes UI

import { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { User, Assistant, Conversation } from './user';

// Props base para componentes
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Props para componentes de loading
export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
}

// Props para componentes de erro
export interface ErrorProps extends BaseComponentProps {
  message: string;
  retry?: () => void;
  variant?: 'inline' | 'card' | 'page';
}

// Props para componentes de botão
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Props para componentes de card
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
}

// Props específicas para componentes de usuário
export interface UserCardProps extends BaseComponentProps {
  user: User;
  showActions?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export interface UserAvatarProps extends BaseComponentProps {
  user: Pick<User, 'name' | 'avatar_url'>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
}

// Props específicas para componentes de assistente
export interface AssistantCardProps extends BaseComponentProps {
  assistant: Assistant;
  showMetrics?: boolean;
  onEdit?: (assistant: Assistant) => void;
  onDelete?: (assistant: Assistant) => void;
  onToggleStatus?: (assistant: Assistant) => void;
}

export interface AssistantStatusProps extends BaseComponentProps {
  status: Assistant['status'];
  showText?: boolean;
}

// Props para componentes de conversa
export interface ConversationListProps extends BaseComponentProps {
  conversations: Conversation[];
  loading?: boolean;
  onSelectConversation?: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export interface ConversationItemProps extends BaseComponentProps {
  conversation: Conversation;
  selected?: boolean;
  onClick?: (conversation: Conversation) => void;
}

// Props para componentes de formulário
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
}

export interface InputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export interface SelectProps extends FormFieldProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Props para componentes de layout
export interface LayoutProps extends BaseComponentProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export interface SidebarProps extends BaseComponentProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export interface HeaderProps extends BaseComponentProps {
  title?: string;
  user?: User;
  onUserMenuClick?: () => void;
}

// Props para componentes de dashboard
export interface MetricCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: ReactNode;
  loading?: boolean;
}

export interface ChartProps extends BaseComponentProps {
  data: any[];
  loading?: boolean;
  error?: string;
  height?: number;
}

// Props para componentes de modal/dialog
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ConfirmDialogProps extends ModalProps {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

// Props para componentes de upload
export interface FileUploadProps extends BaseComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onUpload: (files: File[]) => void;
  loading?: boolean;
  error?: string;
}