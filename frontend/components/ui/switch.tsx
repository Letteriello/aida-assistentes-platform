"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { motion, AnimatePresence } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Switch variants for consistent styling
const switchVariants = cva(
  [
    // Base styles
    "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
    "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
  ],
  {
    variants: {
      size: {
        sm: "h-4 w-7",
        md: "h-6 w-11",
        lg: "h-8 w-14"
      },
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        destructive: "data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input",
        success: "data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-input",
        warning: "data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-input"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
)

const switchThumbVariants = cva(
  [
    "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200"
  ],
  {
    variants: {
      size: {
        sm: "h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0",
        md: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        lg: "h-7 w-7 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
)

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> &
    VariantProps<typeof switchVariants>
>(({ className, size, variant, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(switchVariants({ size, variant }), className)}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(switchThumbVariants({ size }))}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

// Enhanced switch with form features
interface EnhancedSwitchProps 
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  label?: string
  description?: string
  helperText?: string
  errorMessage?: string
  required?: boolean
}

const EnhancedSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  EnhancedSwitchProps
>(({ 
  className,
  label,
  description,
  helperText,
  errorMessage,
  required,
  size,
  variant,
  id,
  checked,
  onCheckedChange,
  disabled,
  "aria-describedby": ariaDescribedBy,
  ...props 
}, ref) => {
  const switchId = React.useId()
  const helperTextId = React.useId()
  const errorId = React.useId()
  const descriptionId = React.useId()
  
  const finalId = id || switchId
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
  
  const switchElement = (
    <Switch
      ref={ref}
      id={finalId}
      size={size}
      variant={finalVariant}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-invalid={hasError}
      aria-describedby={finalAriaDescribedBy}
      className={className}
      {...props}
    />
  )
  
  // Simple switch without label
  if (!label && !description && !helperText && !errorMessage) {
    return switchElement
  }
  
  // Enhanced switch with label and form features
  return (
    <div className="space-y-1">
      <div className="flex items-start space-x-2">
        {switchElement}
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
            className="text-xs text-destructive font-medium ml-8"
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
            className="text-xs text-muted-foreground ml-8"
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

EnhancedSwitch.displayName = "EnhancedSwitch"

export { Switch, EnhancedSwitch, switchVariants }