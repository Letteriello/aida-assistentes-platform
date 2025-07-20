"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Grid responsivo com colunas adaptativas
export interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
    "2xl"?: number
  }
  gap?: "none" | "sm" | "md" | "lg"
}

export const ResponsiveGrid = React.forwardRef<
  HTMLDivElement,
  ResponsiveGridProps
>(({ children, className, cols = { sm: 1, md: 2, lg: 3 }, gap = "md", ...props }, ref) => {
  const gapClasses = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6"
  }
  
  const getGridCols = () => {
    const classes = []
    
    if (cols.sm) classes.push(`grid-cols-${cols.sm}`)
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
    if (cols["2xl"]) classes.push(`2xl:grid-cols-${cols["2xl"]}`)
    
    return classes.join(" ")
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "grid",
        getGridCols(),
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

ResponsiveGrid.displayName = "ResponsiveGrid"

// Stack responsivo que muda de vertical para horizontal
export interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  direction?: {
    sm?: "row" | "col"
    md?: "row" | "col"
    lg?: "row" | "col"
  }
  gap?: "none" | "sm" | "md" | "lg"
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around"
}

export const ResponsiveStack = React.forwardRef<
  HTMLDivElement,
  ResponsiveStackProps
>(({ 
  children, 
  className, 
  direction = { sm: "col", md: "row" },
  gap = "md",
  align = "start",
  justify = "start",
  ...props 
}, ref) => {
  const gapClasses = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6"
  }
  
  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch"
  }
  
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around"
  }
  
  const getDirectionClasses = () => {
    const classes = []
    
    if (direction.sm === "row") classes.push("flex-row")
    else classes.push("flex-col")
    
    if (direction.md === "row") classes.push("md:flex-row")
    else if (direction.md === "col") classes.push("md:flex-col")
    
    if (direction.lg === "row") classes.push("lg:flex-row")
    else if (direction.lg === "col") classes.push("lg:flex-col")
    
    return classes.join(" ")
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        getDirectionClasses(),
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

ResponsiveStack.displayName = "ResponsiveStack"

// Utilitário para targets de toque em dispositivos móveis
export interface TouchTargetProps {
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg"
}

export const TouchTarget = React.forwardRef<
  HTMLDivElement,
  TouchTargetProps
>(({ children, className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "min-h-[40px] min-w-[40px]", // 40px mínimo para toque
    md: "min-h-[44px] min-w-[44px]", // 44px recomendado
    lg: "min-h-[48px] min-w-[48px]"  // 48px para melhor acessibilidade
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

TouchTarget.displayName = "TouchTarget"

// Utilitário para tipografia responsiva
export interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  size?: {
    sm?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl"
    md?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl"
    lg?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl"
  }
  weight?: "normal" | "medium" | "semibold" | "bold"
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export const ResponsiveText = React.forwardRef<
  HTMLElement,
  ResponsiveTextProps
>(({ 
  children, 
  className, 
  size = { sm: "base", md: "lg" },
  weight = "normal",
  as: Component = "p",
  ...props 
}, ref) => {
  const getSizeClasses = () => {
    const classes = []
    
    if (size.sm) classes.push(`text-${size.sm}`)
    if (size.md) classes.push(`md:text-${size.md}`)
    if (size.lg) classes.push(`lg:text-${size.lg}`)
    
    return classes.join(" ")
  }
  
  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold"
  }
  
  return (
    <Component
      ref={ref as any}
      className={cn(
        getSizeClasses(),
        weightClasses[weight],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
})

ResponsiveText.displayName = "ResponsiveText"