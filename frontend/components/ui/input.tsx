"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Origin UI inspired input variants with enhanced accessibility
const inputVariants = cva(
  [
    // Base styles maintaining Origin UI compatibility
    "flex w-full min-w-0 rounded-md text-sm transition-all duration-200",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
    "placeholder:text-muted-foreground/70",
    "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
    "disabled:pointer-events-none",
    // Enhanced file input styling
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:px-3 file:text-sm file:font-medium"
  ],
  {
    variants: {
      variant: {
        default: [
          "border border-input bg-transparent px-3 py-1 shadow-xs",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        ],
        filled: [
          "border-0 bg-muted/50 px-3 py-1",
          "focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        ],
        underline: [
          "border-0 border-b border-input bg-transparent px-1 py-1 rounded-none",
          "focus-visible:border-ring focus-visible:border-b-2"
        ],
        minimal: [
          "border-0 bg-transparent px-2 py-1",
          "focus-visible:bg-muted/30"
        ]
      },
      size: {
        sm: "h-8 text-xs min-h-[44px] md:min-h-[32px]",
        md: "h-9 text-sm min-h-[44px] md:min-h-[36px]",
        lg: "h-11 text-base min-h-[44px] md:min-h-[44px]"
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

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  helperText?: string
  errorMessage?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  label?: string
  floatingLabel?: boolean
  validationMode?: "onChange" | "onBlur" | "onSubmit"
  validator?: (value: string) => string | undefined
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    state, 
    type, 
    helperText, 
    errorMessage: externalErrorMessage, 
    leadingIcon, 
    trailingIcon,
    label,
    floatingLabel = false,
    validationMode = "onChange",
    validator,
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
    
    const inputId = React.useId()
    const helperTextId = React.useId()
    const errorId = React.useId()
    
    const finalId = id || inputId
    
    // Use external error message or internal validation error
    const errorMessage = externalErrorMessage || internalError
    const hasError = !!errorMessage
    const finalState = hasError ? "error" : state
    
    // Check if input has value for floating label
    React.useEffect(() => {
      const inputValue = typeof value === 'string' ? value : ''
      setHasValue(inputValue.length > 0)
    }, [value])
    
    // Real-time validation
    const validateInput = React.useCallback((inputValue: string) => {
      if (validator) {
        const error = validator(inputValue)
        setInternalError(error)
        return error
      }
      return undefined
    }, [validator])
    
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setHasValue(inputValue.length > 0)
      
      if (validationMode === "onChange") {
        validateInput(inputValue)
      }
      
      onChange?.(e)
    }, [onChange, validationMode, validateInput])
    
    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      
      if (validationMode === "onBlur" || validationMode === "onChange") {
        validateInput(e.target.value)
      }
      
      onBlur?.(e)
    }, [onBlur, validationMode, validateInput])
    
    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }, [onFocus])
    
    // Build aria-describedby for accessibility
    const describedByIds = []
    if (helperText) describedByIds.push(helperTextId)
    if (errorMessage) describedByIds.push(errorId)
    if (ariaDescribedBy) describedByIds.push(ariaDescribedBy)
    const finalAriaDescribedBy = describedByIds.length > 0 ? describedByIds.join(" ") : undefined
    
    // Animation variants
    const labelVariants = {
      default: {
        top: "50%",
        fontSize: "0.875rem",
        color: "hsl(var(--muted-foreground))",
        transform: "translateY(-50%)",
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
    
    const inputElement = (
      <motion.input
        type={type}
        data-slot="input"
        className={cn(
          inputVariants({ variant, size, state: finalState }),
          // Enhanced search input styling
          type === "search" && [
            "[&::-webkit-search-cancel-button]:appearance-none",
            "[&::-webkit-search-decoration]:appearance-none",
            "[&::-webkit-search-results-button]:appearance-none",
            "[&::-webkit-search-results-decoration]:appearance-none"
          ],
          // Enhanced file input styling
          type === "file" && [
            "text-muted-foreground/70 file:border-input file:text-foreground",
            "p-0 pr-3 italic file:me-3 file:h-full file:border-0 file:border-r",
            "file:border-solid file:bg-transparent file:px-3 file:text-sm",
            "file:font-medium file:not-italic"
          ],
          // Icon spacing adjustments
          leadingIcon && "pl-10",
          trailingIcon && "pr-10",
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
        whileFocus={{
          scale: 1.01,
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
        {...props}
      />
    )
    
    // Backward compatibility: return simple input if no enhanced features are used
    if (!leadingIcon && !trailingIcon && !helperText && !errorMessage && !floatingLabel && !label) {
      return inputElement
    }
    
    // Enhanced input with icons, floating label and helper text
    return (
      <div className="space-y-1">
        {label && !floatingLabel && (
          <label htmlFor={finalId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <motion.div 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
              animate={{ 
                color: isFocused ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" 
              }}
              transition={{ duration: 0.2 }}
            >
              {leadingIcon}
            </motion.div>
          )}
          
          {floatingLabel && label && (
            <motion.label
              htmlFor={finalId}
              className="absolute left-3 pointer-events-none text-muted-foreground origin-left z-10"
              variants={labelVariants}
              animate={isFocused || hasValue ? "focused" : "default"}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{
                paddingLeft: leadingIcon ? "1.75rem" : "0",
                paddingRight: "0.25rem",
                backgroundColor: "hsl(var(--background))",
              }}
            >
              {label}
            </motion.label>
          )}
          
          {inputElement}
          
          {trailingIcon && (
            <motion.div 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
              animate={{ 
                color: isFocused ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" 
              }}
              transition={{ duration: 0.2 }}
            >
              {trailingIcon}
            </motion.div>
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

Input.displayName = "Input"

export { Input, inputVariants }
