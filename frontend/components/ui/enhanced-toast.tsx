/**
 * AIDA Platform - Enhanced Toast Notification System
 * Provides semantic toast variants with consistent styling and accessibility
 */

'use client';

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { toast as baseToast, useToast } from './use-toast';
import { cn } from '@/lib/utils';
import { useMotion } from '@/hooks/use-design-system';

// Toast variant types
export type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

// Enhanced toast options
export interface EnhancedToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: React.ReactElement;
  dismissible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// Toast icons mapping
const TOAST_ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  info: Info,
};

// Toast colors for accessibility announcements
const TOAST_ARIA_LABELS: Record<ToastVariant, string> = {
  default: 'Notification',
  success: 'Success notification',
  warning: 'Warning notification', 
  error: 'Error notification',
  info: 'Information notification',
};

/**
 * Enhanced toast component with icon and improved accessibility
 */
interface EnhancedToastContentProps {
  variant: ToastVariant;
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

function EnhancedToastContent({ 
  variant, 
  title, 
  description, 
  dismissible = true,
  onDismiss 
}: EnhancedToastContentProps) {
  const motion = useMotion();
  const Icon = TOAST_ICONS[variant];

  return (
    <div 
      className="flex items-start gap-3 w-full"
      role="alert"
      aria-label={TOAST_ARIA_LABELS[variant]}
    >
      {/* Icon */}
      <div className={cn(
        "flex-shrink-0 mt-0.5",
        motion.shouldAnimate && "transition-transform duration-200"
      )}>
        <Icon className={cn(
          "h-5 w-5",
          variant === 'success' && "text-green-600 dark:text-green-400",
          variant === 'warning' && "text-yellow-600 dark:text-yellow-400", 
          variant === 'error' && "text-red-600 dark:text-red-400",
          variant === 'info' && "text-blue-600 dark:text-blue-400",
          variant === 'default' && "text-foreground"
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-sm font-semibold leading-5 mb-1">
            {title}
          </div>
        )}
        {description && (
          <div className="text-sm leading-5 opacity-90">
            {description}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            "flex-shrink-0 rounded-md p-1 text-foreground/50 hover:text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-colors duration-200",
            motion.shouldAnimate && "hover:scale-110 active:scale-95"
          )}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Enhanced toast utilities with semantic variants
 */
export class EnhancedToast {
  private static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (typeof document === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  private static createToast(
    variant: ToastVariant,
    options: EnhancedToastOptions,
    priority: 'polite' | 'assertive' = 'polite'
  ) {
    const { title, description, duration = 5000, action, dismissible = true } = options;
    
    // Screen reader announcement
    const announcementText = title 
      ? `${TOAST_ARIA_LABELS[variant]}: ${title}${description ? `. ${description}` : ''}`
      : description || TOAST_ARIA_LABELS[variant];
    
    this.announceToScreenReader(announcementText, priority);

    // Create toast
    const toastInstance = baseToast({
      variant: variant === 'error' ? 'destructive' : variant,
      title: (
        <EnhancedToastContent
          variant={variant}
          title={title}
          description={description}
          dismissible={dismissible}
          onDismiss={() => toastInstance.dismiss()}
        />
      ),
      duration,
      action,
    });

    return toastInstance;
  }

  /**
   * Show success toast
   */
  static success(options: EnhancedToastOptions) {
    return this.createToast('success', options, 'polite');
  }

  /**
   * Show warning toast
   */
  static warning(options: EnhancedToastOptions) {
    return this.createToast('warning', options, 'assertive');
  }

  /**
   * Show error toast
   */
  static error(options: EnhancedToastOptions) {
    return this.createToast('error', options, 'assertive');
  }

  /**
   * Show info toast
   */
  static info(options: EnhancedToastOptions) {
    return this.createToast('info', options, 'polite');
  }

  /**
   * Show default toast
   */
  static show(options: EnhancedToastOptions) {
    return this.createToast('default', options, 'polite');
  }

  /**
   * Convenience methods for common use cases
   */
  static saved(message = 'Changes saved successfully') {
    return this.success({
      title: 'Saved',
      description: message,
    });
  }

  static deleted(message = 'Item deleted successfully') {
    return this.success({
      title: 'Deleted',
      description: message,
    });
  }

  static created(message = 'Item created successfully') {
    return this.success({
      title: 'Created',
      description: message,
    });
  }

  static updated(message = 'Item updated successfully') {
    return this.success({
      title: 'Updated', 
      description: message,
    });
  }

  static networkError(message = 'Network error. Please try again.') {
    return this.error({
      title: 'Connection Error',
      description: message,
    });
  }

  static validationError(message = 'Please check your input and try again.') {
    return this.error({
      title: 'Validation Error',
      description: message,
    });
  }

  static permissionError(message = 'You do not have permission to perform this action.') {
    return this.error({
      title: 'Permission Denied',
      description: message,
    });
  }

  static loading(message = 'Processing...') {
    return this.info({
      title: 'Loading',
      description: message,
      dismissible: false,
    });
  }
}

/**
 * Hook for using enhanced toast in components
 */
export function useEnhancedToast() {
  const { dismiss } = useToast();

  return {
    toast: EnhancedToast,
    dismiss,
    success: EnhancedToast.success,
    warning: EnhancedToast.warning,
    error: EnhancedToast.error,
    info: EnhancedToast.info,
    show: EnhancedToast.show,
    // Convenience methods
    saved: EnhancedToast.saved,
    deleted: EnhancedToast.deleted,
    created: EnhancedToast.created,
    updated: EnhancedToast.updated,
    networkError: EnhancedToast.networkError,
    validationError: EnhancedToast.validationError,
    permissionError: EnhancedToast.permissionError,
    loading: EnhancedToast.loading,
  };
}

/**
 * Toast notification provider component
 */
export interface ToastNotificationProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export function ToastNotificationProvider({ 
  children, 
  position = 'bottom-right',
  maxToasts = 3 
}: ToastNotificationProviderProps) {
  // This would integrate with the existing Toaster component
  // For now, we'll just pass through the children since the Toaster
  // is already configured in the app layout
  return <>{children}</>;
}

// Export the enhanced toast as default
export default EnhancedToast;