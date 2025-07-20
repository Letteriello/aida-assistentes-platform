'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { aidaComponents, cn, type UsageLevel } from '@/lib/design-system';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showNumbers?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showUpgradeButton?: boolean;
  onUpgrade?: () => void;
}

export function ProgressBar({
  value,
  max,
  label,
  showNumbers = true,
  showPercentage = false,
  size = 'md',
  className,
  showUpgradeButton = false,
  onUpgrade
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  // Determine usage level for styling
  const getUsageLevel = (): UsageLevel => {
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'critical';
    if (percentage >= 70) return 'warning';
    return 'safe';
  };
  
  const usageLevel = getUsageLevel();
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  };
  
  const getColorClasses = () => {
    switch (usageLevel) {
      case 'safe':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      case 'critical':
        return 'text-red-700';
      case 'exceeded':
        return 'text-red-800 font-semibold';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header com label e números */}
      <div className="flex items-center justify-between">
        {label && (
          <span className={cn('font-medium', textSizes[size], getColorClasses())}>
            {label}
          </span>
        )}
        
        <div className={cn('flex items-center gap-2', textSizes[size])}>
          {showNumbers && (
            <span className={cn('font-mono', getColorClasses())}>
              {value.toLocaleString()} / {max.toLocaleString()}
            </span>
          )}
          
          {showPercentage && (
            <span className={cn('font-medium', getColorClasses())}>
              ({percentage.toFixed(0)}%)
            </span>
          )}
          
          {showUpgradeButton && percentage >= 70 && (
            <button
              onClick={onUpgrade}
              className="ml-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded-md transition-colors duration-200"
            >
              + Upgrade
            </button>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className={cn('relative', sizeClasses[size])}>
        <Progress 
          value={percentage} 
          className={cn('w-full', sizeClasses[size])}
        />
        
        {/* Indicator visual do nível de uso */}
        <div 
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-300',
            aidaComponents.usageProgress[usageLevel]
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {/* Warning messages */}
      {usageLevel === 'warning' && (
        <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
          ⚠️ Atenção: Você está usando {percentage.toFixed(0)}% do limite
        </p>
      )}
      
      {usageLevel === 'critical' && (
        <p className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
          🚨 Crítico: {percentage.toFixed(0)}% usado. Considere fazer upgrade
        </p>
      )}
      
      {usageLevel === 'exceeded' && (
        <p className="text-xs text-red-800 bg-red-100 px-2 py-1 rounded border border-red-300 font-medium">
          🔴 Limite excedido! Upgrade necessário para continuar
        </p>
      )}
    </div>
  );
}