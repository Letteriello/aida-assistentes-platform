"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LuxuryLoaderProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "organic" | "flow" | "pulse" | "glow"
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-10 h-10", 
  lg: "w-16 h-16",
  xl: "w-24 h-24"
}

const LuxuryLoader = React.forwardRef<HTMLDivElement, LuxuryLoaderProps>(
  ({ className, size = "md", variant = "organic", ...props }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "organic":
          return "loader-organic"
        case "flow":
          return "bg-gradient-flow animate-flow rounded-flowing"
        case "pulse":
          return "bg-gradient-golden animate-golden-pulse rounded-liquid"
        case "glow":
          return "bg-gradient-glow animate-glow-rotate rounded-organic"
        default:
          return "loader-organic"
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          sizeClasses[size],
          getVariantClasses(),
          "flex items-center justify-center",
          className
        )}
        {...props}
      >
        {variant === "flow" && (
          <div className="w-2 h-2 bg-white rounded-full animate-float opacity-80" />
        )}
      </div>
    )
  }
)

LuxuryLoader.displayName = "LuxuryLoader"

// Skeleton component with golden theme
interface LuxurySkeletonProps {
  className?: string
  variant?: "golden" | "soft" | "flow"
}

const LuxurySkeleton = React.forwardRef<HTMLDivElement, LuxurySkeletonProps>(
  ({ className, variant = "soft", ...props }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "golden":
          return "bg-gradient-golden animate-golden-pulse"
        case "soft":
          return "bg-gradient-glow animate-flow"
        case "flow":
          return "bg-gradient-flow animate-flow"
        default:
          return "bg-gradient-glow animate-flow"
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-organic",
          getVariantClasses(),
          className
        )}
        {...props}
      />
    )
  }
)

LuxurySkeleton.displayName = "LuxurySkeleton"

// Floating action button with luxury effects
interface FloatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg"
  variant?: "golden" | "flow" | "glass"
}

const FloatingButton = React.forwardRef<HTMLButtonElement, FloatingButtonProps>(
  ({ className, size = "md", variant = "golden", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-12 h-12 text-sm",
      md: "w-16 h-16 text-base", 
      lg: "w-20 h-20 text-lg"
    }

    const getVariantClasses = () => {
      switch (variant) {
        case "golden":
          return "bg-gradient-golden hover:shadow-depth animate-float"
        case "flow":
          return "bg-gradient-flow hover:shadow-golden animate-golden-pulse"
        case "glass":
          return "glass-golden hover:shadow-soft backdrop-blur-xl"
        default:
          return "bg-gradient-golden hover:shadow-depth animate-float"
      }
    }

    return (
      <button
        ref={ref}
        className={cn(
          "fixed bottom-8 right-8 z-50 rounded-liquid flex items-center justify-center",
          "text-white font-medium transition-all duration-500 ease-out",
          "hover:scale-110 active:scale-95 shadow-golden",
          sizeClasses[size],
          getVariantClasses(),
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

FloatingButton.displayName = "FloatingButton"

export { LuxuryLoader, LuxurySkeleton, FloatingButton }