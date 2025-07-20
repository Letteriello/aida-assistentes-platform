"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const techInputVariants = cva(
  "flex w-full rounded-lg border transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-input bg-input px-3 py-2 text-sm focus-visible:ring-tech-blue-500 hover:border-tech-blue-300 focus-visible:border-tech-blue-500",
        outline:
          "border-2 border-tech-blue-500 bg-transparent px-3 py-2 text-sm focus-visible:ring-tech-blue-500 hover:border-tech-blue-600 focus-visible:border-tech-blue-600",
        ghost:
          "border-transparent bg-tech-dark-50 dark:bg-tech-dark-800 px-3 py-2 text-sm text-tech-dark-800 dark:text-tech-dark-100 focus-visible:ring-tech-blue-500 focus-visible:border-tech-blue-500 hover:bg-tech-dark-100 dark:hover:bg-tech-dark-700",
        tech:
          "border-tech-dark-200 dark:border-tech-dark-700 bg-tech-dark-50 dark:bg-tech-dark-800 px-3 py-2 text-sm text-tech-dark-800 dark:text-tech-dark-100 focus-visible:ring-tech-blue-500 focus-visible:border-tech-blue-500 hover:border-tech-blue-300 dark:hover:border-tech-blue-600",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3 py-2 text-sm",
        lg: "h-12 px-4 py-3 text-base",
        xl: "h-14 px-5 py-4 text-lg",
      },
      state: {
        default: "",
        error: "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500",
        success: "border-green-500 focus-visible:ring-green-500 focus-visible:border-green-500",
        warning: "border-yellow-500 focus-visible:ring-yellow-500 focus-visible:border-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)

export interface TechInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof techInputVariants> {
  label?: string
  helperText?: string
  errorText?: string
}

const TechInput = React.forwardRef<HTMLInputElement, TechInputProps>(
  ({ className, variant, size, state, label, helperText, errorText, type, ...props }, ref) => {
    const inputState = errorText ? "error" : state
    
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(techInputVariants({ variant, size, state: inputState, className }))}
          ref={ref}
          {...props}
        />
        {(helperText || errorText) && (
          <p className={cn(
            "text-xs",
            errorText ? "text-red-500" : "text-muted-foreground"
          )}>
            {errorText || helperText}
          </p>
        )}
      </div>
    )
  }
)
TechInput.displayName = "TechInput"

const TechTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string
    helperText?: string
    errorText?: string
  }
>(({ className, label, helperText, errorText, ...props }, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-input bg-input px-3 py-2 text-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue-500 focus-visible:ring-offset-2 focus-visible:border-tech-blue-500 hover:border-tech-blue-300 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
      {(helperText || errorText) && (
        <p className={cn(
          "text-xs",
          errorText ? "text-red-500" : "text-muted-foreground"
        )}>
          {errorText || helperText}
        </p>
      )}
    </div>
  )
})
TechTextarea.displayName = "TechTextarea"

export { TechInput, TechTextarea, techInputVariants }