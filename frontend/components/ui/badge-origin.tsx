/**
 * AIDA Platform - Origin UI Enhanced Badge Component
 * Advanced badge with AI status indicators and animations
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, Activity, Zap, Clock, AlertCircle, CheckCircle, Sparkles, Brain, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border hover:bg-accent hover:text-accent-foreground",
        
        // Technology-specific variants
        tech: "border-tech-blue/30 bg-tech-blue/10 text-tech-blue hover:bg-tech-blue/20",
        ai: "border-accent-cyan-500/30 bg-accent-cyan-500/10 text-accent-cyan-500 hover:bg-accent-cyan-500/20",
        success: "border-accent-lime-500/30 bg-accent-lime-500/10 text-accent-lime-500 hover:bg-accent-lime-500/20",
        warning: "border-accent-orange-500/30 bg-accent-orange-500/10 text-accent-orange-500 hover:bg-accent-orange-500/20",
        premium: "border-accent-purple-500/30 bg-accent-purple-500/10 text-accent-purple-500 hover:bg-accent-purple-500/20",
        
        // AI Status variants
        'ai-active': "border-accent-cyan-500/30 bg-accent-cyan-500/10 text-accent-cyan-500 animate-pulse",
        'ai-success': "border-accent-lime-500/30 bg-accent-lime-500/10 text-accent-lime-500",
        'ai-warning': "border-accent-orange-500/30 bg-accent-orange-500/10 text-accent-orange-500",
        'ai-error': "border-destructive/30 bg-destructive/10 text-destructive",
        'ai-idle': "border-secondary-400/30 bg-secondary-400/10 text-secondary-400",
        'ai-training': "border-accent-purple-500/30 bg-accent-purple-500/10 text-accent-purple-500 animate-shimmer",
        
        // Gradient variants
        gradient: "border-transparent bg-gradient-to-r from-accent-cyan-500 to-accent-purple-500 text-white shadow-lg",
        'gradient-warm': "border-transparent bg-gradient-to-r from-accent-orange-500 to-accent-lime-500 text-white shadow-lg",
        'gradient-cool': "border-transparent bg-gradient-to-r from-primary-600 to-accent-cyan-500 text-white shadow-lg"
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base"
      },
      shape: {
        default: "rounded-full",
        rounded: "rounded-lg",
        square: "rounded-md"
      },
      glow: {
        none: "",
        subtle: "shadow-lg shadow-current/25",
        strong: "shadow-xl shadow-current/40"
      },
      pulse: {
        none: "",
        subtle: "animate-tech-pulse",
        strong: "animate-bounce"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
      glow: "none",
      pulse: "none"
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  dismissible?: boolean
  onDismiss?: () => void
  dot?: boolean
  dotColor?: string
  count?: number
  maxCount?: number
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    shape, 
    glow, 
    pulse,
    icon,
    iconPosition = "left",
    dismissible = false,
    onDismiss,
    dot = false,
    dotColor,
    count,
    maxCount = 99,
    children,
    ...props 
  }, ref) => {
    
    const displayCount = count !== undefined ? (count > maxCount ? `${maxCount}+` : count.toString()) : null
    
    const renderIcon = () => {
      if (icon) return icon
      
      // Auto-assign icons based on variant
      const iconMap = {
        'ai-active': <Activity className="h-3 w-3" />,
        'ai-success': <CheckCircle className="h-3 w-3" />,
        'ai-warning': <AlertCircle className="h-3 w-3" />,
        'ai-error': <AlertCircle className="h-3 w-3" />,
        'ai-idle': <Clock className="h-3 w-3" />,
        'ai-training': <Brain className="h-3 w-3" />,
        'premium': <Sparkles className="h-3 w-3" />,
        'tech': <Zap className="h-3 w-3" />
      }
      
      return iconMap[variant as keyof typeof iconMap] || null
    }

    const iconElement = renderIcon()

    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size, shape, glow, pulse }),
          className
        )}
        {...props}
      >
        {dot && (
          <div
            className={cn(
              "w-2 h-2 rounded-full mr-1.5",
              dotColor || "bg-current"
            )}
          />
        )}
        
        {iconElement && iconPosition === "left" && (
          <span className="mr-1">
            {iconElement}
          </span>
        )}
        
        {displayCount || children}
        
        {iconElement && iconPosition === "right" && (
          <span className="ml-1">
            {iconElement}
          </span>
        )}
        
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }
)
Badge.displayName = "Badge"

// AI Status Badge - Specialized for AI assistant status
export interface AIStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'training' | 'idle' | 'error' | 'success' | 'warning'
  showIcon?: boolean
  animated?: boolean
}

const AIStatusBadge = React.forwardRef<HTMLDivElement, AIStatusBadgeProps>(
  ({ 
    status, 
    showIcon = true, 
    animated = true,
    children,
    ...props 
  }, ref) => {
    const statusConfig = {
      active: { 
        variant: 'ai-active' as const, 
        label: 'Active',
        pulse: animated ? 'subtle' as const : 'none' as const
      },
      training: { 
        variant: 'ai-training' as const, 
        label: 'Training',
        pulse: animated ? 'subtle' as const : 'none' as const
      },
      idle: { 
        variant: 'ai-idle' as const, 
        label: 'Idle',
        pulse: 'none' as const
      },
      error: { 
        variant: 'ai-error' as const, 
        label: 'Error',
        pulse: 'none' as const
      },
      success: { 
        variant: 'ai-success' as const, 
        label: 'Success',
        pulse: 'none' as const
      },
      warning: { 
        variant: 'ai-warning' as const, 
        label: 'Warning',
        pulse: 'none' as const
      }
    }

    const config = statusConfig[status]

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        pulse={config.pulse}
        icon={showIcon ? undefined : null}
        {...props}
      >
        {children || config.label}
      </Badge>
    )
  }
)
AIStatusBadge.displayName = "AIStatusBadge"

// Metric Badge - For displaying numbers and metrics
export interface MetricBadgeProps extends Omit<BadgeProps, 'variant'> {
  value: number
  label?: string
  trend?: 'up' | 'down' | 'neutral'
  format?: 'number' | 'percentage' | 'currency'
  precision?: number
}

const MetricBadge = React.forwardRef<HTMLDivElement, MetricBadgeProps>(
  ({ 
    value, 
    label, 
    trend,
    format = 'number',
    precision = 0,
    ...props 
  }, ref) => {
    
    const formatValue = (val: number) => {
      switch (format) {
        case 'percentage':
          return `${val.toFixed(precision)}%`
        case 'currency':
          return `$${val.toFixed(precision)}`
        default:
          return val.toFixed(precision)
      }
    }

    const trendConfig = {
      up: { variant: 'success' as const, icon: <TrendingUp className="h-3 w-3" /> },
      down: { variant: 'destructive' as const, icon: <TrendingUp className="h-3 w-3 rotate-180" /> },
      neutral: { variant: 'secondary' as const, icon: null }
    }

    const config = trend ? trendConfig[trend] : { variant: 'default' as const, icon: null }

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        icon={config.icon}
        iconPosition="right"
        {...props}
      >
        {label && <span className="mr-1">{label}:</span>}
        {formatValue(value)}
      </Badge>
    )
  }
)
MetricBadge.displayName = "MetricBadge"

// Category Badge - For categorizing items
export interface CategoryBadgeProps extends Omit<BadgeProps, 'variant' | 'icon'> {
  category: 'customer-support' | 'sales' | 'technical' | 'general' | 'premium' | 'enterprise'
}

const CategoryBadge = React.forwardRef<HTMLDivElement, CategoryBadgeProps>(
  ({ category, children, ...props }, ref) => {
    const categoryConfig = {
      'customer-support': { 
        variant: 'ai' as const, 
        icon: <Users className="h-3 w-3" />,
        label: 'Support'
      },
      'sales': { 
        variant: 'success' as const, 
        icon: <TrendingUp className="h-3 w-3" />,
        label: 'Sales'
      },
      'technical': { 
        variant: 'tech' as const, 
        icon: <Zap className="h-3 w-3" />,
        label: 'Technical'
      },
      'general': { 
        variant: 'secondary' as const, 
        icon: <Brain className="h-3 w-3" />,
        label: 'General'
      },
      'premium': { 
        variant: 'premium' as const, 
        icon: <Sparkles className="h-3 w-3" />,
        label: 'Premium'
      },
      'enterprise': { 
        variant: 'gradient' as const, 
        icon: <Sparkles className="h-3 w-3" />,
        label: 'Enterprise'
      }
    }

    const config = categoryConfig[category]

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        icon={config.icon}
        {...props}
      >
        {children || config.label}
      </Badge>
    )
  }
)
CategoryBadge.displayName = "CategoryBadge"

// Notification Badge - For counts and notifications
export interface NotificationBadgeProps extends Omit<BadgeProps, 'variant'> {
  count: number
  maxCount?: number
  showZero?: boolean
  variant?: 'default' | 'destructive' | 'warning' | 'success'
}

const NotificationBadge = React.forwardRef<HTMLDivElement, NotificationBadgeProps>(
  ({ 
    count, 
    maxCount = 99, 
    showZero = false,
    variant = 'destructive',
    className,
    ...props 
  }, ref) => {
    
    if (count === 0 && !showZero) {
      return null
    }

    const displayCount = count > maxCount ? `${maxCount}+` : count.toString()

    return (
      <Badge
        ref={ref}
        variant={variant}
        size="sm"
        className={cn(
          "absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center p-1",
          className
        )}
        {...props}
      >
        {displayCount}
      </Badge>
    )
  }
)
NotificationBadge.displayName = "NotificationBadge"

export { 
  Badge, 
  AIStatusBadge, 
  MetricBadge, 
  CategoryBadge, 
  NotificationBadge,
  badgeVariants 
}