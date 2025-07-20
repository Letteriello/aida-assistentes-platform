import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const statusVariants = cva(
  "inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium",
  {
    variants: {
      status: {
        connected: "bg-green-100 text-green-800 border border-green-200",
        disconnected: "bg-red-100 text-red-800 border border-red-200", 
        connecting: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        error: "bg-red-100 text-red-800 border border-red-200",
        pending: "bg-gray-100 text-gray-800 border border-gray-200",
      },
    },
    defaultVariants: {
      status: "disconnected",
    },
  }
);

const dotVariants = cva(
  "w-2 h-2 rounded-full",
  {
    variants: {
      status: {
        connected: "bg-green-500 animate-pulse-aida",
        disconnected: "bg-red-500",
        connecting: "bg-yellow-500 animate-pulse",
        error: "bg-red-500 animate-pulse",
        pending: "bg-gray-500",
      },
    },
    defaultVariants: {
      status: "disconnected",
    },
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusVariants> {
  label?: string;
  showDot?: boolean;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, label, showDot = true, ...props }, ref) => {
    const getStatusText = () => {
      if (label) return label;
      
      switch (status) {
        case 'connected': return 'Conectado';
        case 'disconnected': return 'Desconectado';
        case 'connecting': return 'Conectando...';
        case 'error': return 'Erro';
        case 'pending': return 'Pendente';
        default: return 'Desconhecido';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(statusVariants({ status, className }))}
        {...props}
      >
        {showDot && (
          <div className={cn(dotVariants({ status }))} />
        )}
        <span>{getStatusText()}</span>
      </div>
    );
  }
);

StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator, statusVariants };