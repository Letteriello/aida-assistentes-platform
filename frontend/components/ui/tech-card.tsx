"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const techCardVariants = cva(
  "rounded-lg border transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
  {
    variants: {
      variant: {
        default:
          "bg-card text-card-foreground shadow-sm border-border dark:bg-tech-dark-800 dark:text-tech-dark-100 dark:border-tech-dark-700",
        glass:
          "backdrop-blur-md bg-card/95 text-card-foreground shadow-lg border-border/50 dark:bg-tech-dark-900/95 dark:text-tech-dark-100 dark:border-tech-dark-700/50",
        tech:
          "bg-gradient-to-br from-tech-dark-50 to-tech-blue-50 dark:from-tech-dark-900 dark:to-tech-dark-800 text-tech-dark-800 dark:text-tech-dark-100 shadow-md border-tech-blue-200 dark:border-tech-dark-700",
        outline:
          "border-2 border-tech-blue-500 bg-transparent text-tech-blue-600 dark:text-tech-blue-400 shadow-sm hover:bg-tech-blue-50 dark:hover:bg-tech-blue-950 hover:text-tech-blue-700 dark:hover:text-tech-blue-300",
        premium:
          "bg-gradient-to-br from-tech-blue-500 to-tech-blue-700 text-white shadow-xl border-tech-blue-400 hover:shadow-2xl",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      glow: {
        none: "",
        subtle: "hover:shadow-tech-blue-500/20 hover:shadow-xl",
        strong: "shadow-tech-blue-500/30 shadow-xl hover:shadow-tech-blue-500/40 hover:shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
)

export interface TechCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof techCardVariants> {
  asChild?: boolean
}

const TechCard = React.forwardRef<HTMLDivElement, TechCardProps>(
  ({ className, variant, size, glow, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(techCardVariants({ variant, size, glow, className }))}
        {...props}
      />
    )
  }
)
TechCard.displayName = "TechCard"

const TechCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
))
TechCardHeader.displayName = "TechCardHeader"

const TechCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-lg", className)}
    {...props}
  />
))
TechCardTitle.displayName = "TechCardTitle"

const TechCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
TechCardDescription.displayName = "TechCardDescription"

const TechCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
TechCardContent.displayName = "TechCardContent"

const TechCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
))
TechCardFooter.displayName = "TechCardFooter"

export {
  TechCard,
  TechCardHeader,
  TechCardFooter,
  TechCardTitle,
  TechCardDescription,
  TechCardContent,
  techCardVariants,
}