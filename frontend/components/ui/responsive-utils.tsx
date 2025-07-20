"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Breakpoints do sistema (baseado no Tailwind CSS)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

export type Breakpoint = keyof typeof breakpoints

// Hook para detectar breakpoint atual
export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState<Breakpoint>("sm")
  
  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= breakpoints["2xl"]) {
        setCurrentBreakpoint("2xl")
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint("xl")
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint("lg")
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint("md")
      } else {
        setCurrentBreakpoint("sm")
      }
    }
    
    updateBreakpoint()
    window.addEventListener("resize", updateBreakpoint)
    
    return () => window.removeEventListener("resize", updateBreakpoint)
  }, [])
  
  return currentBreakpoint
}

// Hook para verificar se esta em um breakpoint especifico ou maior
export function useMediaQuery(breakpoint: Breakpoint) {
  const [matches, setMatches] = React.useState(false)
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`)
    
    const updateMatches = () => setMatches(mediaQuery.matches)
    updateMatches()
    
    mediaQuery.addEventListener("change", updateMatches)
    return () => mediaQuery.removeEventListener("change", updateMatches)
  }, [breakpoint])
  
  return matches
}

// Hook para detectar se e dispositivo movel
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)
  
  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.md)
    }
    
    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)
    
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])
  
  return isMobile
}

// Container responsivo com padding e max-width adaptativos
export interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  padding?: "none" | "sm" | "md" | "lg"
}

export const ResponsiveContainer = React.forwardRef<
  HTMLDivElement,
  ResponsiveContainerProps
>(({ children, className, size = "lg", padding = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-full"
  }
  
  const paddingClasses = {
    none: "",
    sm: "px-4 py-2",
    md: "px-6 py-4 sm:px-8 sm:py-6",
    lg: "px-8 py-6 sm:px-12 sm:py-8"
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full",
        sizeClasses[size],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

ResponsiveContainer.displayName = "ResponsiveContainer"