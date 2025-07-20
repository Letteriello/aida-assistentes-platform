"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles, Crown, Gem } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'wave' | 'luxury' | 'prosperity' | 'organic' | 'liquid'
type LoadingSize = 'sm' | 'md' | 'lg' | 'xl'

interface AdvancedLoadingProps {
  variant?: LoadingVariant
  size?: LoadingSize
  className?: string
  text?: string
  fullScreen?: boolean
  overlay?: boolean
}

export function AdvancedLoading({
  variant = 'luxury',
  size = 'md',
  className,
  text,
  fullScreen = false,
  overlay = false
}: AdvancedLoadingProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'md':
        return 'w-8 h-8'
      case 'lg':
        return 'w-12 h-12'
      case 'xl':
        return 'w-16 h-16'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'md':
        return 'text-sm'
      case 'lg':
        return 'text-base'
      case 'xl':
        return 'text-lg'
    }
  }

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return <SpinnerLoader size={getSizeClasses()} />
      case 'dots':
        return <DotsLoader size={size} />
      case 'pulse':
        return <PulseLoader size={getSizeClasses()} />
      case 'wave':
        return <WaveLoader size={size} />
      case 'luxury':
        return <LuxuryLoader size={getSizeClasses()} />
      case 'prosperity':
        return <ProsperityLoader size={getSizeClasses()} />
      case 'organic':
        return <OrganicLoader size={getSizeClasses()} />
      case 'liquid':
        return <LiquidLoader size={getSizeClasses()} />
      default:
        return <LuxuryLoader size={getSizeClasses()} />
    }
  }

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4",
      fullScreen && "min-h-screen",
      className
    )}>
      {renderLoader()}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "text-muted-foreground font-medium",
            getTextSize()
          )}
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (overlay) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      >
        {content}
      </motion.div>
    )
  }

  return content
}

// Spinner tradicional com tema dourado
function SpinnerLoader({ size }: { size: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(size)}
    >
      <Loader2 className="w-full h-full text-primary" />
    </motion.div>
  )
}

// Loader de pontos animados
function DotsLoader({ size }: { size: LoadingSize }) {
  const dotSize = size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
  
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn(
            "rounded-full bg-primary",
            dotSize
          )}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  )
}

// Loader de pulso
function PulseLoader({ size }: { size: string }) {
  return (
    <motion.div
      className={cn(
        "rounded-full bg-primary/20 border-2 border-primary",
        size
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="w-full h-full rounded-full bg-primary/30"
        animate={{
          scale: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1
        }}
      />
    </motion.div>
  )
}

// Loader de ondas
function WaveLoader({ size }: { size: LoadingSize }) {
  const barHeight = size === 'sm' ? 'h-4' : size === 'md' ? 'h-8' : size === 'lg' ? 'h-12' : 'h-16'
  const barWidth = size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : size === 'lg' ? 'w-2' : 'w-3'
  
  return (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.div
          key={index}
          className={cn(
            "bg-primary rounded-t",
            barWidth
          )}
          animate={{
            height: ['20%', '100%', '20%']
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut"
          }}
          style={{ maxHeight: barHeight.replace('h-', '') + 'rem' }}
        />
      ))}
    </div>
  )
}

// Loader luxury com coroa
function LuxuryLoader({ size }: { size: string }) {
  return (
    <div className="relative">
      <motion.div
        className={cn(
          "rounded-full border-2 border-primary/30",
          size
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute inset-2 rounded-full bg-gradient-to-r from-primary via-amber-400 to-yellow-500"
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Crown className="w-1/2 h-1/2 text-primary" />
      </motion.div>
    </div>
  )
}

// Loader de prosperidade com brilhos
function ProsperityLoader({ size }: { size: string }) {
  return (
    <div className="relative">
      <motion.div
        className={cn(
          "rounded-full bg-gradient-to-r from-primary via-amber-400 to-yellow-500",
          size
        )}
        animate={{
          boxShadow: [
            "0 0 20px hsl(45 95% 65% / 0.4)",
            "0 0 40px hsl(45 95% 65% / 0.8)",
            "0 0 20px hsl(45 95% 65% / 0.4)"
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-1/2 h-1/2 text-white" />
        </motion.div>
      </motion.div>
      
      {/* Partículas flutuantes */}
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute w-1 h-1 bg-primary rounded-full"
          animate={{
            x: [0, 20, -20, 0],
            y: [0, -20, 20, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: index * 0.5
          }}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  )
}

// Loader orgânico com formas fluidas
function OrganicLoader({ size }: { size: string }) {
  return (
    <motion.div
      className={cn(
        "bg-gradient-to-r from-primary via-amber-400 to-yellow-500",
        size
      )}
      animate={{
        borderRadius: [
          "60% 40% 30% 70% / 60% 30% 70% 40%",
          "30% 60% 70% 40% / 50% 60% 30% 60%",
          "60% 40% 30% 70% / 60% 30% 70% 40%"
        ],
        rotate: [0, 180, 360]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

// Loader líquido
function LiquidLoader({ size }: { size: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-full bg-primary/20", size)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary via-amber-400 to-yellow-500"
        animate={{
          y: ['100%', '0%', '100%']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          borderRadius: "0 0 50% 50%"
        }}
      />
      
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Gem className="w-1/3 h-1/3 text-white" />
      </motion.div>
    </div>
  )
}

// Hook para estados de loading
export function useLoading() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingText, setLoadingText] = React.useState<string | undefined>()

  const startLoading = (text?: string) => {
    setLoadingText(text)
    setIsLoading(true)
  }

  const stopLoading = () => {
    setIsLoading(false)
    setLoadingText(undefined)
  }

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading
  }
}