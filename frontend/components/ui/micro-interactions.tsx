"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Hover Effect com Glow Dourado
interface GoldenHoverProps {
  children: React.ReactNode
  className?: string
  intensity?: 'low' | 'medium' | 'high'
  disabled?: boolean
}

const GoldenHover: React.FC<GoldenHoverProps> = ({
  children,
  className,
  intensity = 'medium',
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const glowIntensity = {
    low: 'shadow-lg shadow-golden-400/20',
    medium: 'shadow-xl shadow-golden-400/30',
    high: 'shadow-2xl shadow-golden-400/40'
  }
  
  return (
    <motion.div
      className={cn(
        'relative transition-all duration-300',
        isHovered && !disabled && glowIntensity[intensity],
        className
      )}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {children}
      
      {/* Glow overlay */}
      <AnimatePresence>
        {isHovered && !disabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-golden-400/10 to-prosperity-400/10 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Ripple Effect Futurista
interface RippleEffectProps {
  children: React.ReactNode
  className?: string
  color?: 'golden' | 'tech' | 'prosperity'
  disabled?: boolean
}

const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  className,
  color = 'golden',
  disabled = false
}) => {
  const [ripples, setRipples] = useState<Array<{
    id: number
    x: number
    y: number
    size: number
  }>>([])
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  const colorClasses = {
    golden: 'bg-golden-400',
    tech: 'bg-tech-blue',
    prosperity: 'bg-prosperity-400'
  }
  
  const handleClick = (e: React.MouseEvent) => {
    if (disabled || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const size = Math.max(rect.width, rect.height) * 2
    
    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    }
    
    setRipples(prev => [...prev, newRipple])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)
  }
  
  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      
      {/* Ripples */}
      {ripples.map(ripple => (
        <motion.div
          key={ripple.id}
          className={cn(
            'absolute rounded-full pointer-events-none',
            colorClasses[color]
          )}
          style={{
            x: ripple.x - ripple.size / 2,
            y: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size
          }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// Magnetic Button Effect
interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  strength?: number
  disabled?: boolean
}

const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className,
  strength = 0.3,
  disabled = false
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLDivElement>(null)
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || !buttonRef.current) return
    
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength
    
    setPosition({ x: deltaX, y: deltaY })
  }
  
  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }
  
  return (
    <motion.div
      ref={buttonRef}
      className={cn('cursor-pointer', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

// Floating Animation
interface FloatingElementProps {
  children: React.ReactNode
  className?: string
  intensity?: 'subtle' | 'medium' | 'strong'
  direction?: 'vertical' | 'horizontal' | 'both'
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className,
  intensity = 'medium',
  direction = 'vertical'
}) => {
  const intensityValues = {
    subtle: 5,
    medium: 10,
    strong: 20
  }
  
  const getAnimation = () => {
    const value = intensityValues[intensity]
    
    switch (direction) {
      case 'vertical':
        return { y: [-value, value, -value] }
      case 'horizontal':
        return { x: [-value, value, -value] }
      case 'both':
        return {
          x: [-value/2, value/2, -value/2],
          y: [-value, value, -value]
        }
      default:
        return { y: [-value, value, -value] }
    }
  }
  
  return (
    <motion.div
      className={className}
      animate={getAnimation()}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  )
}

// Shimmer Loading Effect
interface ShimmerLoadingProps {
  className?: string
  width?: string
  height?: string
  rounded?: boolean
}

const ShimmerLoading: React.FC<ShimmerLoadingProps> = ({
  className,
  width = 'w-full',
  height = 'h-4',
  rounded = true
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-slate-200 dark:bg-slate-800',
        width,
        height,
        rounded && 'rounded-md',
        className
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  )
}

// Pulse Notification
interface PulseNotificationProps {
  children: React.ReactNode
  className?: string
  color?: 'golden' | 'tech' | 'prosperity' | 'success' | 'warning' | 'error'
  intensity?: 'low' | 'medium' | 'high'
}

const PulseNotification: React.FC<PulseNotificationProps> = ({
  children,
  className,
  color = 'golden',
  intensity = 'medium'
}) => {
  const colorClasses = {
    golden: 'bg-golden-400/20 border-golden-400',
    tech: 'bg-tech-blue/20 border-tech-blue',
    prosperity: 'bg-prosperity-400/20 border-prosperity-400',
    success: 'bg-green-400/20 border-green-400',
    warning: 'bg-yellow-400/20 border-yellow-400',
    error: 'bg-red-400/20 border-red-400'
  }
  
  const intensityScale = {
    low: 1.02,
    medium: 1.05,
    high: 1.1
  }
  
  return (
    <motion.div
      className={cn(
        'border-2 rounded-lg p-4',
        colorClasses[color],
        className
      )}
      animate={{
        scale: [1, intensityScale[intensity], 1],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  )
}

// Reveal Animation on Scroll
interface RevealOnScrollProps {
  children: React.ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  delay?: number
  duration?: number
}

const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.6
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const controls = useAnimation()
  
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
    }
  }
  
  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [isInView, controls])
  
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  )
}

// Typewriter Effect
interface TypewriterProps {
  text: string
  className?: string
  speed?: number
  delay?: number
  cursor?: boolean
}

const Typewriter: React.FC<TypewriterProps> = ({
  text,
  className,
  speed = 50,
  delay = 0,
  cursor = true
}) => {
  const [displayText, setDisplayText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      let index = 0
      const interval = setInterval(() => {
        setDisplayText(text.slice(0, index + 1))
        index++
        
        if (index >= text.length) {
          clearInterval(interval)
          if (cursor) {
            // Blink cursor
            setInterval(() => {
              setShowCursor(prev => !prev)
            }, 500)
          }
        }
      }, speed)
      
      return () => clearInterval(interval)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [text, speed, delay, cursor])
  
  return (
    <span className={className}>
      {displayText}
      {cursor && showCursor && (
        <motion.span
          className="inline-block w-0.5 h-5 bg-golden-400 ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </span>
  )
}

// Morphing Icon
interface MorphingIconProps {
  icon1: React.ReactNode
  icon2: React.ReactNode
  className?: string
  trigger?: 'hover' | 'click' | 'auto'
  autoInterval?: number
}

const MorphingIcon: React.FC<MorphingIconProps> = ({
  icon1,
  icon2,
  className,
  trigger = 'hover',
  autoInterval = 2000
}) => {
  const [isTransformed, setIsTransformed] = useState(false)
  
  useEffect(() => {
    if (trigger === 'auto') {
      const interval = setInterval(() => {
        setIsTransformed(prev => !prev)
      }, autoInterval)
      
      return () => clearInterval(interval)
    }
  }, [trigger, autoInterval])
  
  const handleInteraction = () => {
    if (trigger === 'hover' || trigger === 'click') {
      setIsTransformed(!isTransformed)
    }
  }
  
  const eventProps = trigger === 'hover' 
    ? { onMouseEnter: handleInteraction, onMouseLeave: handleInteraction }
    : trigger === 'click'
    ? { onClick: handleInteraction }
    : {}
  
  return (
    <div className={cn('relative cursor-pointer', className)} {...eventProps}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isTransformed ? 'icon2' : 'icon1'}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {isTransformed ? icon2 : icon1}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export {
  GoldenHover,
  RippleEffect,
  MagneticButton,
  FloatingElement,
  ShimmerLoading,
  PulseNotification,
  RevealOnScroll,
  Typewriter,
  MorphingIcon
}