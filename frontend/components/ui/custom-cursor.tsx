"use client"

import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface CustomCursorProps {
  children: React.ReactNode
}

export function CustomCursor({ children }: CustomCursorProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [cursorVariant, setCursorVariant] = useState('default')
  const [isVisible, setIsVisible] = useState(false)

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springConfig = { damping: 25, stiffness: 700 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16)
      cursorY.set(e.clientY - 16)
      setIsVisible(true)
    }

    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => setIsVisible(false)

    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mouseenter', handleMouseEnter)
    window.addEventListener('mouseleave', handleMouseLeave)

    // Detectar elementos interativos
    const interactiveElements = document.querySelectorAll(
      'button, a, input, textarea, select, [role="button"], .cursor-pointer'
    )

    const handleMouseEnterInteractive = () => {
      setIsHovering(true)
      setCursorVariant('hover')
    }

    const handleMouseLeaveInteractive = () => {
      setIsHovering(false)
      setCursorVariant('default')
    }

    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnterInteractive)
      el.addEventListener('mouseleave', handleMouseLeaveInteractive)
    })

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseenter', handleMouseEnter)
      window.removeEventListener('mouseleave', handleMouseLeave)
      
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnterInteractive)
        el.removeEventListener('mouseleave', handleMouseLeaveInteractive)
      })
    }
  }, [cursorX, cursorY])

  const variants = {
    default: {
      scale: 1,
      backgroundColor: 'hsl(45 95% 65% / 0.8)',
      mixBlendMode: 'difference' as const,
    },
    hover: {
      scale: 1.5,
      backgroundColor: 'hsl(45 95% 65% / 0.6)',
      mixBlendMode: 'difference' as const,
    },
  }

  return (
    <>
      {children}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] hidden md:block"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          opacity: isVisible ? 1 : 0,
        }}
        variants={variants}
        animate={cursorVariant}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28,
        }}
      />
      
      {/* Cursor trail effect */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9998] hidden md:block"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          opacity: isVisible ? 0.6 : 0,
          backgroundColor: 'hsl(45 95% 65% / 0.4)',
          transform: 'translate(12px, 12px)',
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
      />
    </>
  )
}

// Hook para controlar o cursor em componentes específicos
export function useCursor() {
  const [cursorVariant, setCursorVariant] = useState('default')

  const mouseEnter = (variant: string = 'hover') => {
    setCursorVariant(variant)
  }

  const mouseLeave = () => {
    setCursorVariant('default')
  }

  return {
    cursorVariant,
    mouseEnter,
    mouseLeave,
  }
}

// Componente para elementos que precisam de cursor especial
interface CursorWrapperProps {
  children: React.ReactNode
  variant?: 'hover' | 'click' | 'text' | 'golden'
  className?: string
}

export function CursorWrapper({ 
  children, 
  variant = 'hover', 
  className = '' 
}: CursorWrapperProps) {
  const { mouseEnter, mouseLeave } = useCursor()

  return (
    <div
      className={`cursor-none ${className}`}
      onMouseEnter={() => mouseEnter(variant)}
      onMouseLeave={mouseLeave}
    >
      {children}
    </div>
  )
}

// Estilos CSS para esconder o cursor padrão em elementos específicos
export const cursorStyles = `
  .cursor-none {
    cursor: none;
  }
  
  .cursor-golden {
    cursor: none;
  }
  
  @media (max-width: 768px) {
    .cursor-none,
    .cursor-golden {
      cursor: auto;
    }
  }
`