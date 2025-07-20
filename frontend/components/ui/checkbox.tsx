"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Checkbox variants for consistent styling
const checkboxVariants = cva(
  [
    // Base styles
    "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
  ],
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4", 
        lg: "h-5 w-5"
      },
      variant: {
        default: "border-primary",
        destructive: "border-destructive data-[state=checked]:bg-destructive",
        success: "border-green-500 data-[state=checked]:bg-green-500",
        warning: "border-yellow-500 data-[state=checked]:bg-yellow-500"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
)

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & 
    VariantProps<typeof checkboxVariants>
>(({ className, size, variant, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxVariants({ size, variant }), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <Check className={cn(
          "h-3 w-3",
          size === "sm" && "h-2 w-2",
          size === "lg" && "h-4 w-4"
        )} />
      </motion.div>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

// Enhanced checkbox with label and form features
interface EnhancedCheckboxProps 
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  label?: string
  description?: string
  helperText?: string
  errorMessage?: string
  required?: boolean
  indeterminate?: boolean
}

const EnhancedCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  EnhancedCheckboxProps
>(({ 
  className,
  label,
  description,
  helperText,
  errorMessage,
  required,
  indeterminate,
  size,
  variant,
  id,
  checked,
  onCheckedChange,
  disabled,
  "aria-describedby": ariaDescribedBy,
  ...props 
}, ref) => {
  const checkboxId = React.useId()
  const helperTextId = React.useId()
  const errorId = React.useId()
  const descriptionId = React.useId()
  
  const finalId = id || checkboxId
  const hasError = !!errorMessage
  const finalVariant = hasError ? "destructive" : variant
  
  // Build aria-describedby for accessibility
  const describedByIds = []
  if (description) describedByIds.push(descriptionId)
  if (helperText) describedByIds.push(helperTextId)
  if (errorMessage) describedByIds.push(errorId)
  if (ariaDescribedBy) describedByIds.push(ariaDescribedBy)
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
  
  // Handle indeterminate state
  React.useEffect(() => {
    if (ref && typeof ref === 'object' && ref.current) {
      ref.current.indeterminate = !!indeterminate
    }
  }, [indeterminate, ref])
  
  const checkboxElement = (
    <Checkbox
      ref={ref}
      id={finalId}
      size={size}
      variant={finalVariant}
      checked={indeterminate ? "indeterminate" : checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-invalid={hasError}
      aria-describedby={finalAriaDescribedBy}
      className={className}
      {...props}
    />
  )
  
  // Simple checkbox without label
  if (!label && !description && !helperText && !errorMessage) {
    return checkboxElement
  }
  
  // Enhanced checkbox with label and form features
  return (
    <div className="space-y-1">
      <div className="flex items-start space-x-2">
        {checkboxElement}
        <div className="grid gap-1.5 leading-none">
          {label && (
            <label
              htmlFor={finalId}
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                hasError && "text-destructive"
              )}
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.p
            id={errorId}
            className="text-xs text-destructive font-medium ml-6"
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
            className="text-xs text-muted-foreground ml-6"
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

EnhancedCheckbox.displayName = "EnhancedCheckbox"

export { Checkbox, EnhancedCheckbox, checkboxVariants }