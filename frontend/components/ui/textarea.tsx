"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Textarea variants matching the input component design
const textareaVariants = cva(
  [
    // Base styles consistent with input component
    "flex w-full min-w-0 rounded-md text-sm transition-all duration-200",
    "placeholder:text-muted-foreground/70",
    "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
    "disabled:pointer-events-none resize-none"
  ],
  {
    variants: {
      variant: {
        default: [
          "border border-input bg-transparent px-3 py-2 shadow-xs",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        ],
        filled: [
          "border-0 bg-muted/50 px-3 py-2",
          "focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        ],
        underline: [
          "border-0 border-b border-input bg-transparent px-1 py-2 rounded-none",
          "focus-visible:border-ring focus-visible:border-b-2"
        ],
        minimal: [
          "border-0 bg-transparent px-2 py-2",
          "focus-visible:bg-muted/30"
        ]
      },
      size: {
        sm: "min-h-[80px] text-xs",
        md: "min-h-[100px] text-sm",
        lg: "min-h-[120px] text-base"
      },
      state: {
        default: "",
        error: [
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          "aria-invalid:border-destructive border-destructive",
          "focus-visible:ring-destructive/50"
        ],
        success: [
          "border-green-500 focus-visible:ring-green-500/50"
        ],
        warning: [
          "border-yellow-500 focus-visible:ring-yellow-500/50"
        ]
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      state: "default"
    }
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  helperText?: string
  errorMessage?: string
  label?: string
  floatingLabel?: boolean
  validationMode?: "onChange" | "onBlur" | "onSubmit"
  validator?: (value: string) => string | undefined
  maxLength?: number
  showCharCount?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    state, 
    helperText, 
    errorMessage: externalErrorMessage, 
    label,
    floatingLabel = false,
    validationMode = "onChange",
    validator,
    maxLength,
    showCharCount = false,
    id,
    value,
    onChange,
    onBlur,
    onFocus,
    "aria-describedby": ariaDescribedBy,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [internalError, setInternalError] = React.useState<string | undefined>()
    const [hasValue, setHasValue] = React.useState(false)
    const [charCount, setCharCount] = React.useState(0)
    
    const textareaId = React.useId()
    const helperTextId = React.useId()
    const errorId = React.useId()
    const charCountId = React.useId()
    
    const finalId = id || textareaId
    
    // Use external error message or internal validation error
    const errorMessage = externalErrorMessage || internalError
    const hasError = !!errorMessage
    const finalState = hasError ? "error" : state
    
    // Check if textarea has value for floating label
    React.useEffect(() => {
      const textareaValue = typeof value === 'string' ? value : ''
      setHasValue(textareaValue.length > 0)
      setCharCount(textareaValue.length)
    }, [value])
    
    // Real-time validation
    const validateTextarea = React.useCallback((textareaValue: string) => {
      if (validator) {
        const error = validator(textareaValue)
        setInternalError(error)
        return error
      }
      return undefined
    }, [validator])
    
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textareaValue = e.target.value
      setHasValue(textareaValue.length > 0)
      setCharCount(textareaValue.length)
      
      if (validationMode === "onChange") {
        validateTextarea(textareaValue)
      }
      
      onChange?.(e)
    }, [onChange, validationMode, validateTextarea])
    
    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      
      if (validationMode === "onBlur" || validationMode === "onChange") {
        validateTextarea(e.target.value)
      }
      
      onBlur?.(e)
    }, [onBlur, validationMode, validateTextarea])
    
    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }, [onFocus])
    
    // Build aria-describedby for accessibility
    const describedByIds = []
    if (helperText) describedByIds.push(helperTextId)
    if (errorMessage) describedByIds.push(errorId)
    if (showCharCount && maxLength) describedByIds.push(charCountId)
    if (ariaDescribedBy) describedByIds.push(ariaDescribedBy)
    const finalAriaDescribedBy = describedByIds.length > 0 ? describedByIds.join(" ") : undefined
    
    // Animation variants
    const labelVariants = {
      default: {
        top: "1rem",
        fontSize: "0.875rem",
        color: "hsl(var(--muted-foreground))",
        transform: "translateY(0)",
      },
      focused: {
        top: "0%",
        fontSize: "0.75rem",
        color: finalState === "error" ? "hsl(var(--destructive))" : "hsl(var(--primary))",
        transform: "translateY(-50%)",
      },
    }
    
    const errorVariants = {
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
    }
    
    const textareaElement = (
      <motion.div
        whileFocus={{
          scale: 1.005,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        animate={{
          borderColor: finalState === "error" 
            ? "hsl(var(--destructive))" 
            : isFocused 
              ? "hsl(var(--primary))" 
              : "hsl(var(--border))"
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="rounded-md"
      >
        <textarea
          data-slot="textarea"
          className={cn(
            textareaVariants({ variant, size, state: finalState }),
            floatingLabel && "pt-6 pb-2",
            className
          )}
          ref={ref}
          id={finalId}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          aria-invalid={hasError}
          aria-describedby={finalAriaDescribedBy}
          maxLength={maxLength}
          {...props}
        />
      </motion.div>
    )
    
    // Backward compatibility: return simple textarea if no enhanced features are used
    if (!helperText && !errorMessage && !floatingLabel && !label && !showCharCount) {
      return textareaElement
    }
    
    // Enhanced textarea with floating label and helper text
    return (
      <div className="space-y-1">
        {label && !floatingLabel && (
          <label htmlFor={finalId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {floatingLabel && label && (
            <motion.label
              htmlFor={finalId}
              className="absolute left-3 pointer-events-none text-muted-foreground origin-left z-10"
              variants={labelVariants}
              animate={isFocused || hasValue ? "focused" : "default"}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{
                paddingRight: "0.25rem",
                backgroundColor: "hsl(var(--background))",
              }}
            >
              {label}
            </motion.label>
          )}
          
          {textareaElement}
          
          {showCharCount && maxLength && (
            <div className="absolute bottom-2 right-3 text-xs text-muted-foreground pointer-events-none">
              <span 
                id={charCountId}
                className={cn(
                  "transition-colors duration-200",
                  charCount > maxLength * 0.9 && "text-yellow-500",
                  charCount >= maxLength && "text-destructive"
                )}
              >
                {charCount}/{maxLength}
              </span>
            </div>
          )}
        </div>
        
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.p
              id={errorId}
              className="text-xs text-destructive font-medium"
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {errorMessage}
            </motion.p>
          )}
          {helperText && !errorMessage && (
            <motion.p
              id={helperTextId}
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }