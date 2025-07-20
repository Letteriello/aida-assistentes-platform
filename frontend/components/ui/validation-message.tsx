"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ValidationMessageProps {
  message?: string
  type?: "error" | "success" | "warning" | "info"
  className?: string
  showIcon?: boolean
  id?: string
}

const ValidationMessage = React.forwardRef<
  HTMLParagraphElement,
  ValidationMessageProps
>(({ 
  message, 
  type = "error", 
  className, 
  showIcon = true,
  id,
  ...props 
}, ref) => {
  // Ícones para cada tipo de mensagem
  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info
  }
  
  const Icon = icons[type]
  
  // Estilos para cada tipo
  const typeStyles = {
    error: "text-destructive",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    info: "text-blue-600 dark:text-blue-400"
  }
  
  // Variantes de animação
  const messageVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.95,
    }
  }
  
  if (!message) return null
  
  return (
    <AnimatePresence mode="wait">
      <motion.p
        ref={ref}
        id={id}
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          typeStyles[type],
          className
        )}
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ 
          duration: 0.2, 
          ease: "easeInOut",
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        {...props}
      >
        {showIcon && (
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.1,
              duration: 0.3,
              ease: "backOut"
            }}
          >
            <Icon className="h-3 w-3 flex-shrink-0" />
          </motion.span>
        )}
        <span>{message}</span>
      </motion.p>
    </AnimatePresence>
  )
})

ValidationMessage.displayName = "ValidationMessage"

// Componente de lista de mensagens de validação
export interface ValidationMessageListProps {
  messages: Array<{
    id: string
    message: string
    type?: "error" | "success" | "warning" | "info"
  }>
  className?: string
  showIcons?: boolean
}

const ValidationMessageList = React.forwardRef<
  HTMLDivElement,
  ValidationMessageListProps
>(({ messages, className, showIcons = true, ...props }, ref) => {
  if (!messages.length) return null
  
  return (
    <div
      ref={ref}
      className={cn("space-y-1", className)}
      {...props}
    >
      <AnimatePresence>
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ 
              delay: index * 0.05,
              duration: 0.2,
              ease: "easeOut"
            }}
          >
            <ValidationMessage
              message={msg.message}
              type={msg.type}
              showIcon={showIcons}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
})

ValidationMessageList.displayName = "ValidationMessageList"

// Hook para anúncios de acessibilidade
export function useValidationAnnouncements() {
  const [announcements, setAnnouncements] = React.useState<string[]>([])
  
  const announce = React.useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message])
    
    // Remove o anúncio após um tempo para evitar acúmulo
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1))
    }, 3000)
  }, [])
  
  const clearAnnouncements = React.useCallback(() => {
    setAnnouncements([])
  }, [])
  
  return {
    announcements,
    announce,
    clearAnnouncements
  }
}

// Componente de região de anúncios para screen readers
export interface ValidationAnnouncerProps {
  announcements: string[]
  politeness?: "polite" | "assertive"
  className?: string
}

const ValidationAnnouncer = React.forwardRef<
  HTMLDivElement,
  ValidationAnnouncerProps
>(({ announcements, politeness = "polite", className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
      {...props}
    >
      {announcements.map((announcement, index) => (
        <div key={index}>{announcement}</div>
      ))}
    </div>
  )
})

ValidationAnnouncer.displayName = "ValidationAnnouncer"

export { 
  ValidationMessage, 
  ValidationMessageList, 
  ValidationAnnouncer 
}