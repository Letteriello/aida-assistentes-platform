/**
 * AIDA Platform - Origin UI Enhanced Button Component
 * Advanced button with technology theme and micro-interactions
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-95 hover:shadow-lg hover:shadow-primary/25",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-95",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-95 hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-95",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground active:scale-95",
        link: 
          "text-primary underline-offset-4 hover:underline active:scale-95",
        // Technology-specific variants
        tech: 
          "bg-tech-blue text-white shadow-lg hover:shadow-tech-glow hover:bg-tech-blue/90 active:scale-95 tech-glow",
        ai: 
          "bg-gradient-to-r from-accent-cyan-500 to-accent-purple-500 text-white shadow-lg hover:shadow-xl hover:from-accent-cyan-600 hover:to-accent-purple-600 active:scale-95",
        success: 
          "bg-accent-lime-500 text-white shadow-sm hover:bg-accent-lime-600 active:scale-95 hover:shadow-lg",
        warning: 
          "bg-accent-orange-500 text-white shadow-sm hover:bg-accent-orange-600 active:scale-95",
        premium: 
          "bg-gradient-to-r from-accent-purple-500 to-primary-600 text-white shadow-lg hover:shadow-xl active:scale-95 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        glass:
          "glass-effect text-foreground hover:bg-white/90 dark:hover:bg-white/10 backdrop-blur-md border border-white/20 active:scale-95"
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-7 rounded-md px-2 text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10"
      },
      loading: {
        true: "pointer-events-none",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  pulse?: boolean
  glow?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    iconPosition = "left",
    pulse = false,
    glow = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const isDisabled = disabled || loading

    const buttonContent = () => {
      if (loading) {
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || "Loading..."}
          </>
        )
      }

      if (icon && iconPosition === "left") {
        return (
          <>
            {icon}
            {children}
          </>
        )
      }

      if (icon && iconPosition === "right") {
        return (
          <>
            {children}
            {icon}
          </>
        )
      }

      return children
    }

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, loading, className }),
          pulse && "animate-tech-pulse",
          glow && "tech-glow",
          // Enhanced hover effects for technology theme
          variant === "tech" && "hover:animate-pulse",
          variant === "ai" && "hover:animate-shimmer bg-gradient-to-r hover:bg-gradient-to-l",
          variant === "premium" && "hover:animate-glow"
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {buttonContent()}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Enhanced button compositions for common use cases
export interface TechButtonProps extends Omit<ButtonProps, 'variant'> {
  level?: 'primary' | 'secondary' | 'accent'
}

export const TechButton = React.forwardRef<HTMLButtonElement, TechButtonProps>(
  ({ level = 'primary', ...props }, ref) => {
    const variantMap = {
      primary: 'tech' as const,
      secondary: 'outline' as const,
      accent: 'ai' as const
    }
    
    return (
      <Button
        ref={ref}
        variant={variantMap[level]}
        glow={level === 'primary'}
        {...props}
      />
    )
  }
)
TechButton.displayName = "TechButton"

export interface ActionButtonProps extends ButtonProps {
  action: 'create' | 'save' | 'delete' | 'cancel' | 'submit' | 'upgrade'
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ action, children, ...props }, ref) => {
    const actionConfig = {
      create: { variant: 'tech' as const, glow: true },
      save: { variant: 'success' as const },
      delete: { variant: 'destructive' as const },
      cancel: { variant: 'outline' as const },
      submit: { variant: 'default' as const },
      upgrade: { variant: 'premium' as const, pulse: true }
    }
    
    const config = actionConfig[action]
    
    return (
      <Button
        ref={ref}
        {...config}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
ActionButton.displayName = "ActionButton"

// Floating Action Button for quick actions
export interface FABProps extends Omit<ButtonProps, 'size' | 'variant'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ position = 'bottom-right', className, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6'
    }
    
    return (
      <Button
        ref={ref}
        variant="tech"
        size="icon-lg"
        className={cn(
          positionClasses[position],
          "rounded-full shadow-2xl z-50 hover:scale-110 transition-all duration-300",
          "tech-glow hover:tech-glow",
          className
        )}
        glow
        {...props}
      />
    )
  }
)
FloatingActionButton.displayName = "FloatingActionButton"

export { buttonVariants }