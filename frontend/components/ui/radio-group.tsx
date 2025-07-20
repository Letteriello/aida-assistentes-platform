"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Radio group variants for consistent styling
const radioGroupVariants = cva(
  "grid gap-2",
  {
    variants: {
      orientation: {
        vertical: "grid-cols-1",
        horizontal: "grid-flow-col auto-cols-max gap-4"
      }
    },
    defaultVariants: {
      orientation: "vertical"
    }
  }
)

// Radio item variants
const radioItemVariants = cva(
  [
    // Base styles
    "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow transition-all duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50"
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
        destructive: "border-destructive text-destructive",
        success: "border-green-500 text-green-500",
        warning: "border-yellow-500 text-yellow-500"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
)

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> &
    VariantProps<typeof radioGroupVariants>
>(({ className, orientation, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn(radioGroupVariants({ orientation }), className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> &
    VariantProps<typeof radioItemVariants>
>(({ className, size, variant, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(radioItemVariants({ size, variant }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <Circle className={cn(
            "h-2 w-2 fill-current text-current",
            size === "sm" && "h-1.5 w-1.5",
            size === "lg" && "h-2.5 w-2.5"
          )} />
        </motion.div>
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Enhanced radio group with form features
interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface EnhancedRadioGroupProps 
  extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>, 'children'>,
    VariantProps<typeof radioGroupVariants>,
    VariantProps<typeof radioItemVariants> {
  options: RadioOption[]
  label?: string
  helperText?: string
  errorMessage?: string
  required?: boolean
}

const EnhancedRadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  EnhancedRadioGroupProps
>(({ 
  className,
  options,
  label,
  helperText,
  errorMessage,
  required,
  orientation,
  size,
  variant,
  id,
  value,
  onValueChange,
  disabled,
  "aria-describedby": ariaDescribedBy,
  ...props 
}, ref) => {
  const radioGroupId = React.useId()
  const helperTextId = React.useId()
  const errorId = React.useId()
  
  const finalId = id || radioGroupId
  const hasError = !!errorMessage
  const finalVariant = hasError ? "destructive" : variant
  
  // Build aria-describedby for accessibility
  const describedByIds = []
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
  
  return (
    <div className="space-y-2">
      {label && (
        <label className={cn(
          "text-sm font-medium leading-none",
          hasError && "text-destructive",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <RadioGroup
        ref={ref}
        id={finalId}
        orientation={orientation}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={finalAriaDescribedBy}
        className={className}
        {...props}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${finalId}-${option.value}`}
              size={size}
              variant={finalVariant}
              disabled={disabled || option.disabled}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor={`${finalId}-${option.value}`}
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  hasError && "text-destructive",
                  (disabled || option.disabled) && "opacity-50 cursor-not-allowed"
                )}
              >
                {option.label}
              </label>
              {option.description && (
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>
      
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

EnhancedRadioGroup.displayName = "EnhancedRadioGroup"

export { 
  RadioGroup, 
  RadioGroupItem, 
  EnhancedRadioGroup,
  radioGroupVariants,
  radioItemVariants 
}