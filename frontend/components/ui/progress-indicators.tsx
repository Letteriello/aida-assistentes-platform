/**
 * AIDA Platform - Progress Indicators
 * Enhanced progress bars and loading feedback components
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Upload, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

// Enhanced Progress Bar
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  animated?: boolean;
  striped?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showPercentage = false,
  showValue = false,
  size = 'md',
  variant = 'default',
  animated = true,
  striped = false
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {(showPercentage || showValue) && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">
            {showPercentage && `${Math.round(percentage)}%`}
            {showValue && ` (${value}/${max})`}
          </span>
        </div>
      )}
      
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <motion.div
          className={cn(
            'h-full rounded-full transition-colors',
            variantClasses[variant],
            striped && 'bg-stripes',
            animated && 'animate-pulse'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Circular Progress
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showPercentage = true,
  variant = 'default'
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: 'stroke-primary',
    success: 'stroke-green-500',
    warning: 'stroke-yellow-500',
    error: 'stroke-red-500'
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={variantColors[variant]}
          initial={{ strokeDasharray, strokeDashoffset: circumference }}
          animate={{ strokeDasharray, strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <span className="text-lg font-semibold">
            {Math.round(percentage)}%
          </span>
        </motion.div>
      )}
    </div>
  );
}

// File Upload Progress
interface FileUploadProgressProps {
  files: Array<{
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }>;
  onRetry?: (fileName: string) => void;
  onCancel?: (fileName: string) => void;
  className?: string;
}

export function FileUploadProgress({
  files,
  onRetry,
  onCancel,
  className
}: FileUploadProgressProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <AnimatePresence>
        {files.map((file, index) => (
          <motion.div
            key={file.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 border rounded-lg bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {file.status === 'uploading' && (
                  <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
                )}
                {file.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {file.status === 'error' && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium truncate max-w-xs">
                  {file.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {file.status === 'uploading' && (
                  <span className="text-xs text-muted-foreground">
                    {file.progress}%
                  </span>
                )}
                {file.status === 'error' && onRetry && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRetry(file.name)}
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
                {onCancel && file.status === 'uploading' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCancel(file.name)}
                    className="h-6 w-6 p-0"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {file.status === 'uploading' && (
              <ProgressBar
                value={file.progress}
                size="sm"
                animated
                className="mb-1"
              />
            )}
            
            {file.status === 'error' && file.error && (
              <div className="flex items-center space-x-2 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>{file.error}</span>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Step Progress
interface StepProgressProps {
  steps: Array<{
    title: string;
    description?: string;
    status: 'pending' | 'current' | 'completed' | 'error';
  }>;
  className?: string;
}

export function StepProgress({ steps, className }: StepProgressProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start space-x-3"
        >
          <div className="flex-shrink-0 mt-1">
            {step.status === 'completed' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="h-4 w-4 text-white" />
              </motion.div>
            )}
            {step.status === 'current' && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-white rounded-full" />
              </motion.div>
            )}
            {step.status === 'error' && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <XCircle className="h-4 w-4 text-white" />
              </div>
            )}
            {step.status === 'pending' && (
              <div className="w-6 h-6 bg-muted rounded-full border-2 border-muted-foreground/20" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              'text-sm font-medium',
              step.status === 'completed' && 'text-green-600',
              step.status === 'current' && 'text-primary',
              step.status === 'error' && 'text-red-600',
              step.status === 'pending' && 'text-muted-foreground'
            )}>
              {step.title}
            </h4>
            {step.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {step.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Loading with timeout and retry
interface LoadingWithTimeoutProps {
  isLoading: boolean;
  timeout?: number;
  onTimeout?: () => void;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  timeoutComponent?: React.ReactNode;
}

export function LoadingWithTimeout({
  isLoading,
  timeout = 30000, // 30 seconds
  onTimeout,
  onRetry,
  children,
  loadingComponent,
  timeoutComponent
}: LoadingWithTimeoutProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isLoading) {
      setHasTimedOut(false);
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
        onTimeout?.();
      }, timeout);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setHasTimedOut(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, timeout, onTimeout]);

  if (hasTimedOut) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-6"
      >
        {timeoutComponent || (
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div>
              <h3 className="text-lg font-medium">Tempo limite excedido</h3>
              <p className="text-sm text-muted-foreground">
                A operação está demorando mais que o esperado.
              </p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {loadingComponent || (
          <div className="flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="h-8 w-8 text-primary" />
              </motion.div>
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return <>{children}</>;
}

// Batch Operation Progress
interface BatchOperationProgressProps {
  operations: Array<{
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress?: number;
    error?: string;
  }>;
  onRetryAll?: () => void;
  onRetryOne?: (id: string) => void;
  className?: string;
}

export function BatchOperationProgress({
  operations,
  onRetryAll,
  onRetryOne,
  className
}: BatchOperationProgressProps) {
  const completedCount = operations.filter(op => op.status === 'completed').length;
  const errorCount = operations.filter(op => op.status === 'error').length;
  const totalProgress = (completedCount / operations.length) * 100;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Progresso Geral</h3>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{operations.length} concluídas
          </span>
        </div>
        <ProgressBar
          value={totalProgress}
          variant={errorCount > 0 ? 'warning' : 'default'}
          animated
        />
        {errorCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-600">
              {errorCount} operações falharam
            </span>
            {onRetryAll && (
              <Button size="sm" variant="outline" onClick={onRetryAll}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar todas novamente
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Individual operations */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {operations.map((operation, index) => (
          <motion.div
            key={operation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-2 border rounded text-sm"
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {operation.status === 'completed' && (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
              {operation.status === 'processing' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="flex-shrink-0"
                >
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                </motion.div>
              )}
              {operation.status === 'error' && (
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              {operation.status === 'pending' && (
                <div className="h-4 w-4 border-2 border-muted rounded-full flex-shrink-0" />
              )}
              
              <span className="truncate">{operation.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {operation.status === 'processing' && operation.progress && (
                <span className="text-xs text-muted-foreground">
                  {operation.progress}%
                </span>
              )}
              {operation.status === 'error' && onRetryOne && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRetryOne(operation.id)}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}