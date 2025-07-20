"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

interface BentoCardProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  gradient?: 'golden' | 'tech' | 'prosperity' | 'none'
  hover?: boolean
  glow?: boolean
}

const sizeClasses = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-2 row-span-1',
  lg: 'col-span-2 row-span-2',
  xl: 'col-span-3 row-span-2',
}

const gradientClasses = {
  golden: 'bg-gradient-to-br from-golden-500/10 to-golden-600/20 border-golden-400/30',
  tech: 'bg-gradient-to-br from-tech-slate-800 to-tech-zinc-800 border-tech-cyan/30',
  prosperity: 'bg-gradient-to-br from-prosperity-light/5 to-prosperity-dark/20 border-prosperity/30',
  none: 'bg-background border-border',
}

export const BentoGrid: React.FC<BentoGridProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[200px]",
      className
    )}>
      {children}
    </div>
  )
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = "",
  size = 'sm',
  gradient = 'none',
  hover = true,
  glow = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={hover ? { 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.2 }
      } : {}}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6",
        "backdrop-blur-sm transition-all duration-300",
        sizeClasses[size],
        gradientClasses[gradient],
        hover && "hover:shadow-2xl cursor-pointer",
        glow && "animate-prosperity-pulse",
        className
      )}
    >
      {/* Background glow effect */}
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-golden-400/10 via-transparent to-golden-600/10 opacity-50" />
      )}
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-golden-400/20 via-transparent to-golden-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  )
}

// Componentes pré-configurados para casos comuns
export const BentoStatCard: React.FC<{
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}> = ({ title, value, description, icon, trend, className }) => {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-golden-400',
  }
  
  return (
    <BentoCard 
      size="sm" 
      gradient="golden" 
      glow 
      className={className}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-golden-500/20">
          {icon}
        </div>
        {trend && (
          <div className={cn("text-xs font-medium", trendColors[trend])}>
            {trend === 'up' && '↗'}
            {trend === 'down' && '↘'}
            {trend === 'neutral' && '→'}
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          {title}
        </h3>
        <p className="text-2xl font-bold text-golden-300 animate-text-glow">
          {value}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">
            {description}
          </p>
        )}
      </div>
    </BentoCard>
  )
}

export const BentoFeatureCard: React.FC<{
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}> = ({ title, description, icon, action, className }) => {
  return (
    <BentoCard 
      size="md" 
      gradient="tech" 
      className={className}
    >
      <div className="flex items-start space-x-4 mb-4">
        {icon && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-golden-400 to-golden-600 text-white">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-golden-300 mb-2 animate-text-glow">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      
      {action && (
        <div className="mt-auto">
          {action}
        </div>
      )}
    </BentoCard>
  )
}

export const BentoImageCard: React.FC<{
  title: string
  description?: string
  image: string
  overlay?: boolean
  className?: string
}> = ({ title, description, image, overlay = true, className }) => {
  return (
    <BentoCard 
      size="lg" 
      gradient="none" 
      className={cn("p-0 overflow-hidden", className)}
    >
      <div className="relative h-full">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {overlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold text-white mb-2 animate-text-glow">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-200">
              {description}
            </p>
          )}
        </div>
      </div>
    </BentoCard>
  )
}

export const BentoChartCard: React.FC<{
  title: string
  children: React.ReactNode
  className?: string
}> = ({ title, children, className }) => {
  return (
    <BentoCard 
      size="lg" 
      gradient="prosperity" 
      className={className}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-golden-300 animate-text-glow">
          {title}
        </h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>
    </BentoCard>
  )
}

// Container principal para layouts de dashboard
export const BentoDashboard: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
      className={cn(
        "min-h-screen bg-gradient-to-br from-tech-slate-900 to-tech-zinc-900 p-6",
        className
      )}
    >
      <BentoGrid>
        {children}
      </BentoGrid>
    </motion.div>
  )
}

export default BentoGrid