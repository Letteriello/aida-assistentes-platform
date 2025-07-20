"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Form context for managing form state
interface FormContextValue {
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  setFieldError: (name: string, error: string | undefined) => void
  setFieldTouched: (name: string, touched: boolean) => void
  validateField: (name: string, value: any) => Promise<string | undefined>
}

const FormContext = React.createContext<FormContextValue | undefined>(undefined)

export const useFormContext = () => {
  const context = React.useContext(FormContext)
  if (!context) {
    throw new Error("useFormContext deve ser usado dentro de um FormProvider")
  }
  return context
}

// Form provider component
interface FormProviderProps {
  children: React.ReactNode
  onSubmit?: (data: Record<string, any>) => void | Promise<void>
  validationSchema?: Record<string, (value: any) => string | undefined>
  initialValues?: Record<string, any>
  className?: string
}

export const FormProvider = React.forwardRef<HTMLFormElement, FormProviderProps>(
  ({ children, onSubmit, validationSchema, initialValues = {}, className, ...props }, ref) => {
    const [errors, setErrors] = React.useState<Record<string, string>>({})
    const [touched, setTouched] = React.useState<Record<string, boolean>>({})
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [values, setValues] = React.useState(initialValues)

    const setFieldError = React.useCallback((name: string, error: string | undefined) => {
      setErrors(prev => {
        if (error) {
          return { ...prev, [name]: error }
        } else {
          const { [name]: _, ...rest } = prev
          return rest
        }
      })
    }, [])

    const setFieldTouched = React.useCallback((name: string, touched: boolean) => {
      setTouched(prev => ({ ...prev, [name]: touched }))
    }, [])

    const validateField = React.useCallback(async (name: string, value: any): Promise<string | undefined> => {
      if (validationSchema && validationSchema[name]) {
        const error = validationSchema[name](value)
        setFieldError(name, error)
        return error
      }
      return undefined
    }, [validationSchema, setFieldError])

    const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
      e.preventDefault()
      if (!onSubmit) return

      setIsSubmitting(true)
      
      // Validate all fields
      const validationPromises = Object.keys(values).map(async (name) => {
        const error = await validateField(name, values[name])
        return { name, error }
      })

      const validationResults = await Promise.all(validationPromises)
      const hasErrors = validationResults.some(result => result.error)

      if (!hasErrors) {
        try {
          await onSubmit(values)
        } catch (error) {
          console.error("Erro no envio do formulario:", error)
        }
      }

      setIsSubmitting(false)
    }, [values, validateField, onSubmit])

    const contextValue: FormContextValue = {
      errors,
      touched,
      isSubmitting,
      setFieldError,
      setFieldTouched,
      validateField
    }

    return (
      <FormContext.Provider value={contextValue}>
        <form
          ref={ref}
          onSubmit={handleSubmit}
          className={cn("space-y-4", className)}
          {...props}
        >
          {children}
        </form>
      </FormContext.Provider>
    )
  }
)

FormProvider.displayName = "FormProvider"

// Form field wrapper component
interface FormFieldProps {
  name: string
  children: React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({ name, children, className }) => {
  const { errors, touched } = useFormContext()
  const hasError = touched[name] && errors[name]

  return (
    <div className={cn("space-y-1", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            name,
            errorMessage: hasError ? errors[name] : undefined,
            "aria-invalid": hasError,
          })
        }
        return child
      })}
    </div>
  )
}

// Form section component for grouping related fields
interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  description, 
  children, 
  className 
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Form actions component for submit/cancel buttons
interface FormActionsProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export const FormActions: React.FC<FormActionsProps> = ({ 
  children, 
  className,
  align = "right"
}) => {
  return (
    <div className={cn(
      "flex gap-2 pt-4",
      align === "left" && "justify-start",
      align === "center" && "justify-center", 
      align === "right" && "justify-end",
      className
    )}>
      {children}
    </div>
  )
}

// Form error summary component
interface FormErrorSummaryProps {
  className?: string
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({ className }) => {
  const { errors, touched } = useFormContext()
  
  const visibleErrors = Object.keys(errors)
    .filter(key => touched[key] && errors[key])
    .map(key => ({ field: key, message: errors[key] }))

  if (visibleErrors.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "rounded-md border border-destructive/20 bg-destructive/10 p-4",
          className
        )}
      >
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-destructive">
              Existem erros no formulario
            </h3>
            <div className="mt-2 text-sm text-destructive">
              <ul className="list-disc space-y-1 pl-5">
                {visibleErrors.map(({ field, message }) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Form loading overlay
interface FormLoadingOverlayProps {
  isLoading: boolean
  message?: string
}

export const FormLoadingOverlay: React.FC<FormLoadingOverlayProps> = ({ 
  isLoading, 
  message = "Enviando..." 
}) => {
  if (!isLoading) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export {
  FormProvider as Form,
  FormField,
  FormSection,
  FormActions,
  FormErrorSummary,
  FormLoadingOverlay
}