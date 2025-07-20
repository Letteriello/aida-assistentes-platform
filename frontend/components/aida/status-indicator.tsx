'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { aidaComponents, cn, type StatusType } from '@/lib/design-system';

interface StatusIndicatorProps {
  status: StatusType | 'connecting' | 'error';
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  connected: {
    icon: CheckCircle,
    text: 'Conectado',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  disconnected: {
    icon: XCircle, 
    text: 'Desconectado',
    color: 'text-red-600',
    bgColor: 'bg-red-100', 
    borderColor: 'border-red-200'
  },
  connecting: {
    icon: Clock,
    text: 'Conectando...',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  error: {
    icon: AlertCircle,
    text: 'Erro',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  }
};

export function StatusIndicator({
  status,
  showIcon = true,
  showText = true,
  size = 'md',
  className
}: StatusIndicatorProps) {
  const config = statusConfig[status as keyof typeof statusConfig];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5', 
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium transition-all duration-200',
        sizeClasses[size],
        config.color,
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {showIcon && (
        <Icon 
          className={cn(iconSizes[size], status === 'connecting' ? 'animate-pulse' : '')} 
        />
      )}
      
      {showText && (
        <span>{config.text}</span>
      )}
    </Badge>
  );
}