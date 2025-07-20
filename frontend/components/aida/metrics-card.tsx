'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Activity, MessageSquare, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/design-system';

interface MetricItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  color?: 'default' | 'success' | 'warning' | 'error';
}

interface MetricsCardProps {
  title: string;
  description?: string;
  metrics: MetricItem[];
  className?: string;
}

export function MetricsCard({
  title,
  description,
  metrics,
  className
}: MetricsCardProps) {
  const getColorClasses = (color: MetricItem['color'] = 'default') => {
    switch (color) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getTrendClasses = (direction: 'up' | 'down') => {
    return direction === 'up' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-card-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {metric.icon && (
                  <div className={cn('p-1.5 rounded-md', getColorClasses(metric.color))}>
                    {metric.icon}
                  </div>
                )}
                <span className="text-sm text-muted-foreground font-medium">
                  {metric.label}
                </span>
              </div>
              
              {metric.trend && (
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  getTrendClasses(metric.trend.direction)
                )}>
                  {metric.trend.direction === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {metric.trend.value}%
                </div>
              )}
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-card-foreground">
                {typeof metric.value === 'number' 
                  ? metric.value.toLocaleString() 
                  : metric.value
                }
              </span>
              
              {metric.trend?.label && (
                <span className="text-xs text-muted-foreground">
                  {metric.trend.label}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente específico para métricas do dashboard
export function DashboardMetricsCard({ 
  conversationsToday,
  responseRate,
  avgResponseTime,
  satisfactionScore,
  className 
}: {
  conversationsToday: number;
  responseRate: number;
  avgResponseTime: number;
  satisfactionScore: number;
  className?: string;
}) {
  const metrics: MetricItem[] = [
    {
      label: 'Conversas hoje',
      value: conversationsToday,
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'default',
      trend: {
        value: 12,
        direction: 'up',
        label: 'vs ontem'
      }
    },
    {
      label: 'Taxa de resposta',
      value: `${responseRate}%`,
      icon: <Activity className="w-4 h-4" />,
      color: responseRate >= 95 ? 'success' : responseRate >= 80 ? 'warning' : 'error',
      trend: {
        value: 3,
        direction: 'up',
        label: 'esta semana'
      }
    },
    {
      label: 'Tempo médio',
      value: `${avgResponseTime}s`,
      icon: <Clock className="w-4 h-4" />,
      color: avgResponseTime <= 5 ? 'success' : avgResponseTime <= 10 ? 'warning' : 'error'
    },
    {
      label: 'Satisfação',
      value: `${satisfactionScore}/5`,
      icon: <Users className="w-4 h-4" />,
      color: satisfactionScore >= 4.5 ? 'success' : satisfactionScore >= 4 ? 'warning' : 'error',
      trend: {
        value: 8,
        direction: 'up',
        label: 'último mês'
      }
    }
  ];

  return (
    <MetricsCard
      title="Estatísticas de Performance"
      description="Acompanhe o desempenho do seu assistente em tempo real"
      metrics={metrics}
      className={className}
    />
  );
}