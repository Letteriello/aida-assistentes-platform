import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Origin UI inspired button variants with AIDA design system integration
const buttonVariants = cva(
  [
    // Base styles with Origin UI patterns
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
    "ring-offset-background transition-colors duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "relative overflow-hidden",
    // Accessibility improvements
    "[&:has([data-slot=icon]:first-child:not(:last-child))]:pl-2.5",
    "[&:has([data-slot=icon]:last-child:not(:first-child))]:pr-2.5",
    // Performance optimizations
    "will-change-transform",
    // Reduced motion support
    "motion-safe:transition-all motion-reduce:transition-none",
  ],
  {
    variants: {
      variant: {
        // Primary variant (default) - AIDA golden theme
        default: [
          "bg-gradient-golden text-primary-foreground shadow-sm",
          "hover:shadow-golden hover:scale-[1.02] active:scale-[0.98]",
          "luxury-button rounded-flowing",
          "motion-safe:hover:shadow-lg motion-safe:transition-all",
        ],
        // Destructive variant with improved contrast
        destructive: [
          "bg-destructive text-destructive-foreground shadow-sm",
          "hover:bg-destructive/90 hover:shadow-md",
          "rounded-lg",
          "focus-visible:ring-destructive/50",
        ],
        // Outline variant with glass effect
        outline: [
          "border border-input bg-background shadow-sm",
          "hover:bg-accent hover:text-accent-foreground hover:shadow-md",
          "glass-golden rounded-liquid backdrop-blur-sm",
          "focus-visible:ring-accent/50",
        ],
        // Secondary variant
        secondary: [
          "bg-secondary text-secondary-foreground shadow-sm",
          "hover:bg-secondary/80 hover:shadow-md",
          "rounded-organic",
        ],
        // Ghost variant
        ghost: [
          "hover:bg-accent hover:text-accent-foreground",
          "rounded-lg",
          "focus-visible:ring-accent/50",
        ],
        // Link variant
        link: [
          "text-primary underline-offset-4 hover:underline",
          "focus-visible:ring-primary/50",
        ],
        // Luxury variant with enhanced animations
        luxury: [
          "bg-gradient-flow text-primary-foreground shadow-lg",
          "hover:shadow-depth hover:scale-[1.05] active:scale-[0.95]",
          "luxury-button animate-float rounded-liquid",
          "motion-safe:transition-all motion-safe:duration-300",
        ],
        // Golden variant
        golden: [
          "bg-golden-300 text-primary-foreground shadow-sm",
          "hover:bg-golden-400 hover:shadow-golden hover:scale-[1.02]",
          "rounded-flowing",
          "motion-safe:transition-all",
        ],
        // Glass variant with backdrop blur
        glass: [
          "glass-golden text-foreground shadow-soft",
          "hover:shadow-md hover:scale-[1.01]",
          "rounded-organic backdrop-blur-xl",
          "border border-white/10",
        ],
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        xl: "h-12 rounded-lg px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
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
    iconPosition = 'left',
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    
    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
    
    // Content with icon positioning
    const content = loading ? (
      <>
        <LoadingSpinner />
        {loadingText || children}
      </>
    ) : (
      <>
        {icon && iconPosition === 'left' && (
          <span data-slot="icon" className="shrink-0">
            {icon}
          </span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span data-slot="icon" className="shrink-0">
            {icon}
          </span>
        )}
      </>
    );
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        data-loading={loading}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };