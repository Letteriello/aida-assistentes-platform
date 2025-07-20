"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const techContainerVariants = cva(
  "w-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-background",
        card: "bg-card text-card-foreground border border-border rounded-lg shadow-sm",
        glass: "backdrop-blur-md bg-card/95 text-card-foreground border border-border/50 rounded-lg shadow-lg",
        tech: "bg-gradient-to-br from-tech-dark-50 to-tech-blue-50 dark:from-tech-dark-900 dark:to-tech-dark-800 border border-tech-blue-200 dark:border-tech-dark-700 rounded-lg shadow-md text-tech-dark-800 dark:text-tech-dark-100",
        hero: "bg-gradient-to-br from-tech-blue-500 to-tech-blue-700 text-white rounded-lg shadow-xl",
        section: "bg-background border-b border-border",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-12",
        none: "p-0",
      },
      maxWidth: {
        none: "max-w-none",
        sm: "max-w-sm mx-auto",
        md: "max-w-md mx-auto",
        lg: "max-w-lg mx-auto",
        xl: "max-w-xl mx-auto",
        "2xl": "max-w-2xl mx-auto",
        "3xl": "max-w-3xl mx-auto",
        "4xl": "max-w-4xl mx-auto",
        "5xl": "max-w-5xl mx-auto",
        "6xl": "max-w-6xl mx-auto",
        "7xl": "max-w-7xl mx-auto",
        full: "max-w-full",
        screen: "max-w-screen-xl mx-auto",
      },
      spacing: {
        none: "space-y-0",
        sm: "space-y-2",
        default: "space-y-4",
        lg: "space-y-6",
        xl: "space-y-8",
      },
      center: {
        false: "",
        true: "flex flex-col items-center justify-center",
        horizontal: "flex flex-col items-center",
        vertical: "flex flex-col justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      maxWidth: "none",
      spacing: "default",
      center: false,
    },
  }
)

export interface TechContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof techContainerVariants> {
  as?: React.ElementType
}

const TechContainer = React.forwardRef<HTMLDivElement, TechContainerProps>(
  ({ className, variant, size, maxWidth, spacing, center, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(techContainerVariants({ variant, size, maxWidth, spacing, center, className }))}
        {...props}
      />
    )
  }
)
TechContainer.displayName = "TechContainer"

// Specialized containers for common use cases
const TechPageContainer = React.forwardRef<
  HTMLDivElement,
  Omit<TechContainerProps, "variant" | "maxWidth">
>(({ className, ...props }, ref) => (
  <TechContainer
    ref={ref}
    variant="default"
    maxWidth="screen"
    className={cn("min-h-screen", className)}
    {...props}
  />
))
TechPageContainer.displayName = "TechPageContainer"

const TechSectionContainer = React.forwardRef<
  HTMLDivElement,
  Omit<TechContainerProps, "variant">
>(({ className, ...props }, ref) => (
  <TechContainer
    ref={ref}
    variant="section"
    className={cn("py-12", className)}
    {...props}
  />
))
TechSectionContainer.displayName = "TechSectionContainer"

const TechCardContainer = React.forwardRef<
  HTMLDivElement,
  Omit<TechContainerProps, "variant">
>(({ className, ...props }, ref) => (
  <TechContainer
    ref={ref}
    variant="card"
    className={cn("hover:shadow-lg hover:-translate-y-1", className)}
    {...props}
  />
))
TechCardContainer.displayName = "TechCardContainer"

const TechHeroContainer = React.forwardRef<
  HTMLDivElement,
  Omit<TechContainerProps, "variant">
>(({ className, ...props }, ref) => (
  <TechContainer
    ref={ref}
    variant="hero"
    center="true"
    className={cn("min-h-[400px] text-center", className)}
    {...props}
  />
))
TechHeroContainer.displayName = "TechHeroContainer"

export {
  TechContainer,
  TechPageContainer,
  TechSectionContainer,
  TechCardContainer,
  TechHeroContainer,
  techContainerVariants,
}