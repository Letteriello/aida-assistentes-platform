/**
 * AIDA Platform - Origin UI Enhanced Card Component
 * Advanced card with Bento Box styling and technology theme
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-xl text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border border-border shadow-sm",
        outlined: "bg-card border-2 border-border shadow-sm",
        filled: "bg-muted border border-border shadow-sm",
        glass: "glass-effect border border-white/20 shadow-lg backdrop-blur-md",
        gradient: "bg-gradient-to-br from-card to-muted border border-border shadow-md",
        tech: "bg-card border border-tech-silver/30 shadow-lg hover:shadow-tech-glow",
        bento: "bento-card shadow-bento hover:shadow-bento-hover",
        ai: "bg-gradient-to-br from-accent-cyan-500/5 to-accent-purple-500/5 border border-accent-cyan-500/20 shadow-lg",
        premium: "bg-gradient-to-br from-accent-purple-500/10 to-primary-600/10 border border-accent-purple-500/30 shadow-xl"
      },
      elevation: {
        flat: "shadow-none",
        sm: "shadow-sm hover:shadow-md",
        md: "shadow-md hover:shadow-lg",
        lg: "shadow-lg hover:shadow-xl",
        xl: "shadow-xl hover:shadow-2xl"
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1",
        scale: "hover:scale-[1.02]",
        glow: "hover:shadow-primary/25",
        tech: "hover:shadow-tech-glow hover:-translate-y-1"
      },
      interactive: {
        true: "cursor-pointer transition-all duration-200",
        false: ""
      },
      animate: {
        none: "",
        fade: "animate-fade-in",
        slide: "animate-slide-up",
        scale: "animate-scale-in",
        float: "animate-float"
      }
    },
    defaultVariants: {
      variant: "default",
      elevation: "sm",
      hover: "none",
      interactive: false,
      animate: "none"
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
  loading?: boolean
  skeleton?: boolean
  title?: React.ReactNode
  description?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    elevation, 
    hover, 
    interactive, 
    animate,
    loading = false,
    skeleton = false,
    children,
    title,
    description,
    header,
    footer,
    ...props 
  }, ref) => {
    if (skeleton || loading) {
      return (
        <div
          ref={ref}
          className={cn(
            cardVariants({ variant, elevation, hover: "none", interactive: false, animate }),
            "animate-pulse",
            className
          )}
          {...props}
        >
          <div className="space-y-3 p-6">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      )
    }

    const cardContent = (
      <>
        {(title || description || header) && (
          <CardHeader>
            {header}
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
        {footer && <CardFooter>{footer}</CardFooter>}
      </>
    );

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, elevation, hover, interactive, animate }),
          className
        )}
        {...props}
      >
        {cardContent}
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  }
>(({ className, as: Component = "h3", ...props }, ref) => (
  <Component
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-6 pt-0", className)} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Enhanced Card compositions for specific use cases

export interface MetricCardProps extends Omit<CardProps, 'variant'> {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  description?: string
  trend?: React.ReactNode
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ 
    title, 
    value, 
    change, 
    changeType = 'neutral', 
    icon, 
    description,
    trend,
    className,
    ...props 
  }, ref) => {
    const changeColors = {
      positive: 'text-accent-lime-500',
      negative: 'text-destructive',
      neutral: 'text-muted-foreground'
    }

    return (
      <Card
        ref={ref}
        variant="bento"
        hover="lift"
        className={cn(className)}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{value}</div>
            
            {change && (
              <div className={cn("text-xs", changeColors[changeType])}>
                {change}
                {description && (
                  <span className="text-muted-foreground ml-1">
                    {description}
                  </span>
                )}
              </div>
            )}
            
            {trend && (
              <div className="mt-3">
                {trend}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
MetricCard.displayName = "MetricCard"

export interface StatusCardProps extends Omit<CardProps, 'variant'> {
  title: string
  status: 'active' | 'inactive' | 'warning' | 'error' | 'success'
  description?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
}

const StatusCard = React.forwardRef<HTMLDivElement, StatusCardProps>(
  ({ 
    title, 
    status, 
    description, 
    actions, 
    icon,
    className,
    children,
    ...props 
  }, ref) => {
    const statusConfig = {
      active: { 
        variant: 'ai' as const, 
        indicator: 'bg-accent-cyan-500',
        textColor: 'text-accent-cyan-500'
      },
      success: { 
        variant: 'default' as const, 
        indicator: 'bg-accent-lime-500',
        textColor: 'text-accent-lime-500'
      },
      warning: { 
        variant: 'default' as const, 
        indicator: 'bg-accent-orange-500',
        textColor: 'text-accent-orange-500'
      },
      error: { 
        variant: 'default' as const, 
        indicator: 'bg-destructive',
        textColor: 'text-destructive'
      },
      inactive: { 
        variant: 'default' as const, 
        indicator: 'bg-secondary-400',
        textColor: 'text-secondary-400'
      }
    }

    const config = statusConfig[status]

    return (
      <Card
        ref={ref}
        variant={config.variant}
        hover="lift"
        className={cn(className)}
        {...props}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && <div className="text-muted-foreground">{icon}</div>}
              <div>
                <CardTitle className="flex items-center gap-2">
                  {title}
                  <div className={cn("h-2 w-2 rounded-full", config.indicator)} />
                </CardTitle>
                {description && (
                  <CardDescription className="mt-1">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {actions && <div>{actions}</div>}
          </div>
        </CardHeader>
        {children && (
          <CardContent>
            {children}
          </CardContent>
        )}
      </Card>
    )
  }
)
StatusCard.displayName = "StatusCard"

export interface FeatureCardProps extends Omit<CardProps, 'variant'> {
  title: string
  description: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  isPremium?: boolean
  coming?: boolean
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ 
    title, 
    description, 
    icon, 
    badge,
    isPremium = false,
    coming = false,
    className,
    children,
    ...props 
  }, ref) => {
    return (
      <Card
        ref={ref}
        variant={isPremium ? "premium" : "bento"}
        hover="scale"
        interactive
        className={cn(
          "relative overflow-hidden",
          coming && "opacity-75",
          className
        )}
        {...props}
      >
        {coming && (
          <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
            Coming Soon
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className={cn(
                  "p-2 rounded-lg",
                  isPremium ? "bg-accent-purple-500/20 text-accent-purple-500" : "bg-primary/20 text-primary"
                )}>
                  {icon}
                </div>
              )}
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="mt-1">
                  {description}
                </CardDescription>
              </div>
            </div>
            {badge && <div>{badge}</div>}
          </div>
        </CardHeader>
        
        {children && (
          <CardContent>
            {children}
          </CardContent>
        )}
      </Card>
    )
  }
)
FeatureCard.displayName = "FeatureCard"

// Container for Bento Grid layout
export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 'sm' | 'md' | 'lg' | 'xl' | 'adaptive'
  gap?: 'sm' | 'md' | 'lg'
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ 
    columns = 'adaptive', 
    gap = 'md',
    className, 
    children,
    ...props 
  }, ref) => {
    const columnClasses = {
      sm: 'bento-grid-sm',
      md: 'bento-grid-md', 
      lg: 'bento-grid-lg',
      xl: 'bento-grid-xl',
      adaptive: 'bento-grid'
    }

    const gapClasses = {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6'
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          columnClasses[columns],
          gapClasses[gap],
          "p-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
BentoGrid.displayName = "BentoGrid"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  MetricCard,
  StatusCard,
  FeatureCard,
  BentoGrid,
  cardVariants 
}