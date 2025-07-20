"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'prosperity' | 'luxury'

interface FeedbackItem {
  id: string
  type: FeedbackType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface FeedbackContextType {
  addFeedback: (feedback: Omit<FeedbackItem, 'id'>) => void
  removeFeedback: (id: string) => void
  clearAll: () => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (!context) {
    // Return a safe fallback instead of throwing during SSR
    return {
      addFeedback: () => {},
      removeFeedback: () => {},
      clearAll: () => {}
    }
  }
  return context
}

interface FeedbackProviderProps {
  children: React.ReactNode
  maxItems?: number
}

export function FeedbackProvider({ children, maxItems = 5 }: FeedbackProviderProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const removeFeedback = useCallback((id: string) => {
    setFeedbacks(prev => prev.filter(feedback => feedback.id !== id))
  }, [])

  const addFeedback = useCallback((feedback: Omit<FeedbackItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newFeedback: FeedbackItem = {
      ...feedback,
      id,
      duration: feedback.duration ?? 5000
    }

    setFeedbacks(prev => {
      const updated = [newFeedback, ...prev].slice(0, maxItems)
      return updated
    })

    // Auto remove after duration
    if (newFeedback.duration && newFeedback.duration > 0) {
      setTimeout(() => {
        removeFeedback(id)
      }, newFeedback.duration)
    }
  }, [maxItems, removeFeedback])

  const clearAll = useCallback(() => {
    setFeedbacks([])
  }, [])

  return (
    <FeedbackContext.Provider value={{ addFeedback, removeFeedback, clearAll }}>
      {children}
      {mounted && <FeedbackContainer feedbacks={feedbacks} onRemove={removeFeedback} />}
    </FeedbackContext.Provider>
  )
}

interface FeedbackContainerProps {
  feedbacks: FeedbackItem[]
  onRemove: (id: string) => void
}

function FeedbackContainer({ feedbacks, onRemove }: FeedbackContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
      {feedbacks.map((feedback) => (
        <FeedbackToast
          key={feedback.id}
          feedback={feedback}
          onRemove={() => onRemove(feedback.id)}
        />
      ))}
    </div>
  )
}

interface FeedbackToastProps {
  feedback: FeedbackItem
  onRemove: () => void
}

function FeedbackToast({ feedback, onRemove }: FeedbackToastProps) {
  const getIcon = () => {
    switch (feedback.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      case 'prosperity':
        return '✨'
      case 'luxury':
        return '♔'
      default:
        return 'ℹ'
    }
  }

  const getStyles = () => {
    const baseStyles = "glass-golden border shadow-golden"
    
    switch (feedback.type) {
      case 'success':
        return `${baseStyles} border-green-500/30 bg-green-500/10`
      case 'error':
        return `${baseStyles} border-red-500/30 bg-red-500/10`
      case 'warning':
        return `${baseStyles} border-yellow-500/30 bg-yellow-500/10`
      case 'info':
        return `${baseStyles} border-blue-500/30 bg-blue-500/10`
      case 'prosperity':
        return `${baseStyles} border-primary/30 bg-primary/10 animate-golden-pulse`
      case 'luxury':
        return `${baseStyles} border-amber-500/30 bg-amber-500/10 animate-golden-pulse`
      default:
        return baseStyles
    }
  }

  const getIconColor = () => {
    switch (feedback.type) {
      case 'success':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      case 'prosperity':
      case 'luxury':
        return 'text-primary'
      default:
        return 'text-foreground'
    }
  }

  return (
    <div
      className={cn(
        "relative p-4 rounded-lg backdrop-blur-md",
        "transform-gpu will-change-transform transition-all duration-300 ease-in-out",
        "animate-in slide-in-from-top-2 fade-in-0",
        getStyles()
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn("flex-shrink-0 mt-0.5 text-lg font-bold", getIconColor())}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">
            {feedback.title}
          </h4>
          {feedback.message && (
            <p className="mt-1 text-xs text-muted-foreground">
              {feedback.message}
            </p>
          )}
          {feedback.action && (
            <button
              onClick={feedback.action.onClick}
              className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {feedback.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 rounded-md hover:bg-background/50 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Convenience functions for common feedback types
export const feedback = {
  success: (title: string, message?: string, duration?: number) => {
    const context = React.useContext(FeedbackContext)
    if (context) {
      context.addFeedback({ type: 'success', title, message, duration })
    }
  },
  error: (title: string, message?: string, duration?: number) => {
    const context = React.useContext(FeedbackContext)
    if (context) {
      context.addFeedback({ type: 'error', title, message, duration })
    }
  },
  warning: (title: string, message?: string, duration?: number) => {
    const context = React.useContext(FeedbackContext)
    if (context) {
      context.addFeedback({ type: 'warning', title, message, duration })
    }
  },
  info: (title: string, message?: string, duration?: number) => {
    const context = React.useContext(FeedbackContext)
    if (context) {
      context.addFeedback({ type: 'info', title, message, duration })
    }
  },
  prosperity: (title: string, message?: string, duration?: number) => {
    const context = React.useContext(FeedbackContext)
    if (context) {
      context.addFeedback({ type: 'prosperity', title, message, duration })
    }
  },
  luxury: (title: string, message?: string, duration?: number) => {
    const context = React.useContext(FeedbackContext)
    if (context) {
      context.addFeedback({ type: 'luxury', title, message, duration })
    }
  }
}

// Hook for easier access to feedback helpers
export function useFeedbackHelpers() {
  const { addFeedback } = useFeedback()
  
  return {
    success: (title: string, message?: string, duration?: number) => 
      addFeedback({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) => 
      addFeedback({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) => 
      addFeedback({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) => 
      addFeedback({ type: 'info', title, message, duration }),
    prosperity: (title: string, message?: string, duration?: number) => 
      addFeedback({ type: 'prosperity', title, message, duration }),
    luxury: (title: string, message?: string, duration?: number) => 
      addFeedback({ type: 'luxury', title, message, duration })
  }
}