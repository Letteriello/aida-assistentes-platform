"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    variant?: "default" | "filled" | "underline" | "minimal"
    size?: "sm" | "md" | "lg"
    state?: "default" | "error" | "success" | "warning"
  }
>(({ className, children, variant = "default", size = "md", state = "default", ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles consistent with input component
      "flex w-full items-center justify-between rounded-md text-sm transition-all duration-200",
      "placeholder:text-muted-foreground/70 [&>span]:line-clamp-1",
      "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      "disabled:pointer-events-none",
      
      // Variant styles
      variant === "default" && [
        "border border-input bg-transparent px-3 py-2 shadow-xs",
        "focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
      ],
      variant === "filled" && [
        "border-0 bg-muted/50 px-3 py-2",
        "focus:bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
      ],
      variant === "underline" && [
        "border-0 border-b border-input bg-transparent px-1 py-2 rounded-none",
        "focus:border-ring focus:border-b-2"
      ],
      variant === "minimal" && [
        "border-0 bg-transparent px-2 py-2",
        "focus:bg-muted/30"
      ],
      
      // Size styles
      size === "sm" && "h-8 text-xs min-h-[44px] md:min-h-[32px]",
      size === "md" && "h-9 text-sm min-h-[44px] md:min-h-[36px]",
      size === "lg" && "h-11 text-base min-h-[44px] md:min-h-[44px]",
      
      // State styles
      state === "error" && [
        "border-destructive focus:ring-destructive/50"
      ],
      state === "success" && [
        "border-green-500 focus:ring-green-500/50"
      ],
      state === "warning" && [
        "border-yellow-500 focus:ring-yellow-500/50"
      ],
      
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

// Enhanced Select wrapper with form features
interface EnhancedSelectProps {
  children: React.ReactNode
  helperText?: string
  errorMessage?: string
  label?: string
  variant?: "default" | "filled" | "underline" | "minimal"
  size?: "sm" | "md" | "lg"
  state?: "default" | "error" | "success" | "warning"
  validationMode?: "onChange" | "onBlur" | "onSubmit"
  validator?: (value: string) => string | undefined
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
}

const EnhancedSelect = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  EnhancedSelectProps
>(({ 
  children,
  helperText, 
  errorMessage: externalErrorMessage, 
  label,
  variant = "default",
  size = "md",
  state = "default",
  validationMode = "onChange",
  validator,
  value,
  onValueChange,
  placeholder,
  disabled,
  required,
  name,
  id,
  ...props 
}, ref) => {
  const [internalError, setInternalError] = React.useState<string | undefined>()
  const [isFocused, setIsFocused] = React.useState(false)
  
  const selectId = React.useId()
  const helperTextId = React.useId()
  const errorId = React.useId()
  
  const finalId = id || selectId
  
  // Use external error message or internal validation error
  const errorMessage = externalErrorMessage || internalError
  const hasError = !!errorMessage
  const finalState = hasError ? "error" : state
  
  // Real-time validation
  const validateSelect = React.useCallback((selectValue: string) => {
    if (validator) {
      const error = validator(selectValue)
      setInternalError(error)
      return error
    }
    return undefined
  }, [validator])
  
  const handleValueChange = React.useCallback((newValue: string) => {
    if (validationMode === "onChange") {
      validateSelect(newValue)
    }
    
    onValueChange?.(newValue)
  }, [onValueChange, validationMode, validateSelect])
  
  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsFocused(open)
    
    if (!open && validationMode === "onBlur" && value) {
      validateSelect(value)
    }
  }, [validationMode, validateSelect, value])
  
  // Build aria-describedby for accessibility
  const describedByIds = []
  if (helperText) describedByIds.push(helperTextId)
  if (errorMessage) describedByIds.push(errorId)
  const finalAriaDescribedBy = describedByIds.length > 0 ? describedByIds.join(" ") : undefined
  
  // Animation variants
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
  
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={finalId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <Select
        value={value}
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
        disabled={disabled}
        name={name}
        required={required}
        {...props}
      >
        <SelectTrigger
          ref={ref}
          id={finalId}
          variant={variant}
          size={size}
          state={finalState}
          aria-invalid={hasError}
          aria-describedby={finalAriaDescribedBy}
          className={cn(
            "transition-all duration-200",
            isFocused && "ring-2 ring-ring/50"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      
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
})

EnhancedSelect.displayName = "EnhancedSelect"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  EnhancedSelect,
}