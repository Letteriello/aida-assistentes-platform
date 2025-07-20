/**
 * AIDA Platform - Origin UI Enhanced Input Component
 * Advanced input with technology theme and smart interactions
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Eye, EyeOff, Search, X, Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        filled: "border-transparent bg-muted focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring",
        outline: "border-2 border-input focus-visible:border-primary",
        ghost: "border-transparent hover:border-input focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring",
        tech: "border-tech-silver/30 focus-visible:border-tech-blue focus-visible:ring-2 focus-visible:ring-tech-blue/20 focus-visible:shadow-tech-glow",
        ai: "border-accent-cyan-500/30 bg-accent-cyan-500/5 focus-visible:border-accent-cyan-500 focus-visible:ring-2 focus-visible:ring-accent-cyan-500/20",
        search: "border-input bg-muted/50 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring pl-10"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-3",
        lg: "h-10 px-4 text-base",
        xl: "h-12 px-5 text-lg"
      },
      state: {
        default: "",
        success: "border-accent-lime-500 focus-visible:ring-accent-lime-500/20",
        error: "border-destructive focus-visible:ring-destructive/20",
        warning: "border-accent-orange-500 focus-visible:ring-accent-orange-500/20"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default"
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  clearable?: boolean
  onClear?: () => void
  error?: string
  success?: string
  hint?: string
  label?: string
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type,
    variant, 
    size, 
    state,
    leftIcon,
    rightIcon,
    loading = false,
    clearable = false,
    onClear,
    error,
    success,
    hint,
    label,
    showPasswordToggle = false,
    value,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [inputType, setInputType] = React.useState(type)
    
    // Determine state based on props
    const currentState = error ? 'error' : success ? 'success' : state

    React.useEffect(() => {
      if (type === 'password' && showPasswordToggle) {
        setInputType(showPassword ? 'text' : 'password')
      } else {
        setInputType(type)
      }
    }, [type, showPassword, showPasswordToggle])

    const handleClear = () => {
      if (onClear) {
        onClear()
      }
    }

    const handlePasswordToggle = () => {
      setShowPassword(!showPassword)
    }

    // Build right icon based on state and props
    const buildRightIcon = () => {
      if (loading) {
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      }

      if (type === 'password' && showPasswordToggle) {
        return (
          <button
            type="button"
            onClick={handlePasswordToggle}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )
      }

      if (clearable && value && value !== '') {
        return (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )
      }

      if (currentState === 'success') {
        return <Check className="h-4 w-4 text-accent-lime-500" />
      }

      if (currentState === 'error') {
        return <AlertCircle className="h-4 w-4 text-destructive" />
      }

      return rightIcon
    }

    const finalRightIcon = buildRightIcon()

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant, size, state: currentState }),
              leftIcon && "pl-10",
              finalRightIcon && "pr-10",
              className
            )}
            ref={ref}
            value={value}
            {...props}
          />
          
          {finalRightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {finalRightIcon}
            </div>
          )}
        </div>

        {/* Helper text */}
        {(error || success || hint) && (
          <div className="text-xs">
            {error && (
              <p className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-accent-lime-500 flex items-center gap-1">
                <Check className="h-3 w-3" />
                {success}
              </p>
            )}
            {hint && !error && !success && (
              <p className="text-muted-foreground">{hint}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'variant'> {
  onSearch?: (query: string) => void
  debounceMs?: number
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ 
    onSearch,
    debounceMs = 300,
    placeholder = "Search...",
    ...props 
  }, ref) => {
    const [query, setQuery] = React.useState('')
    const debounceRef = React.useRef<NodeJS.Timeout>()

    React.useEffect(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        if (onSearch) {
          onSearch(query)
        }
      }, debounceMs)

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
      }
    }, [query, onSearch, debounceMs])

    return (
      <Input
        ref={ref}
        variant="search"
        leftIcon={<Search className="h-4 w-4" />}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        clearable
        onClear={() => setQuery('')}
        {...props}
      />
    )
  }
)
SearchInput.displayName = "SearchInput"

// Tech Input for AI/tech-specific inputs
export interface TechInputProps extends Omit<InputProps, 'variant'> {
  level?: 'primary' | 'secondary' | 'ai'
}

const TechInput = React.forwardRef<HTMLInputElement, TechInputProps>(
  ({ level = 'primary', ...props }, ref) => {
    const variantMap = {
      primary: 'tech' as const,
      secondary: 'outline' as const,
      ai: 'ai' as const
    }
    
    return (
      <Input
        ref={ref}
        variant={variantMap[level]}
        {...props}
      />
    )
  }
)
TechInput.displayName = "TechInput"

// Floating Label Input
export interface FloatingInputProps extends InputProps {
  floatingLabel?: string
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ 
    floatingLabel,
    placeholder,
    className,
    ...props 
  }, ref) => {
    const [focused, setFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    const handleFocus = () => setFocused(true)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false)
      setHasValue(e.target.value !== '')
      props.onBlur?.(e)
    }
    
    const showFloatingLabel = focused || hasValue

    return (
      <div className="relative">
        <Input
          ref={ref}
          className={cn("pt-6", className)}
          placeholder={focused ? placeholder : ''}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {floatingLabel && (
          <label
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none",
              showFloatingLabel
                ? "top-2 text-xs text-muted-foreground"
                : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
            )}
          >
            {floatingLabel}
          </label>
        )}
      </div>
    )
  }
)
FloatingInput.displayName = "FloatingInput"

// Input with character counter
export interface CounterInputProps extends InputProps {
  maxLength?: number
  showCounter?: boolean
}

const CounterInput = React.forwardRef<HTMLInputElement, CounterInputProps>(
  ({ 
    maxLength,
    showCounter = true,
    className,
    ...props 
  }, ref) => {
    const [count, setCount] = React.useState(0)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCount(e.target.value.length)
      props.onChange?.(e)
    }

    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        {showCounter && maxLength && (
          <div className="flex justify-end">
            <span className={cn(
              "text-xs",
              count > maxLength * 0.9 ? "text-accent-orange-500" : "text-muted-foreground"
            )}>
              {count}/{maxLength}
            </span>
          </div>
        )}
      </div>
    )
  }
)
CounterInput.displayName = "CounterInput"

export { 
  Input, 
  SearchInput, 
  TechInput, 
  FloatingInput, 
  CounterInput,
  inputVariants 
}