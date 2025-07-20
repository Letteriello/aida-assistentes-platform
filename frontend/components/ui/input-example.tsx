"use client"

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from './input'
import { Button } from './button'
import { Search, Mail, Eye, EyeOff, User } from 'lucide-react'

// Validation schema
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  search: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof formSchema>

export function InputExample() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      search: '',
    },
  })
  
  const onSubmit = async (data: FormData) => {
    console.log('Form submitted:', data)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Custom validators for real-time validation
  const emailValidator = (value: string) => {
    if (!value) return undefined
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? undefined : 'Please enter a valid email'
  }
  
  const passwordValidator = (value: string) => {
    if (!value) return undefined
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (!/(?=.*[a-z])/.test(value)) return 'Password must contain lowercase letter'
    if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain uppercase letter'
    if (!/(?=.*\d)/.test(value)) return 'Password must contain a number'
    return undefined
  }
  
  const confirmPasswordValidator = (value: string) => {
    const password = watch('password')
    if (!value) return undefined
    return value === password ? undefined : "Passwords don't match"
  }
  
  return (
    <div className="max-w-md mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Input Component Examples</h1>
        <p className="text-muted-foreground mt-2">
          Demonstrating Origin UI Input with various features
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Search Input with Leading Icon */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Search Input</h3>
          <Controller
            name="search"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="search"
                placeholder="Search..."
                leadingIcon={<Search className="h-4 w-4" />}
                variant="filled"
                helperText="Search with leading icon and filled variant"
              />
            )}
          />
        </div>
        
        {/* Email Input with Floating Label */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Email with Floating Label</h3>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                label="Email Address"
                floatingLabel
                leadingIcon={<Mail className="h-4 w-4" />}
                validator={emailValidator}
                validationMode="onChange"
                errorMessage={errors.email?.message}
                variant="underline"
              />
            )}
          />
        </div>
        
        {/* Username Input with Real-time Validation */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Username with Validation</h3>
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                label="Username"
                leadingIcon={<User className="h-4 w-4" />}
                validator={(value) => {
                  if (!value) return undefined
                  if (value.length < 3) return 'Username must be at least 3 characters'
                  if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores'
                  return undefined
                }}
                validationMode="onChange"
                errorMessage={errors.username?.message}
                helperText="Letters, numbers, and underscores only"
                size="lg"
              />
            )}
          />
        </div>
        
        {/* Password Input with Toggle Visibility */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Password with Toggle</h3>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type={showPassword ? "text" : "password"}
                label="Password"
                validator={passwordValidator}
                validationMode="onChange"
                errorMessage={errors.password?.message}
                trailingIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                helperText="Must contain uppercase, lowercase, number, and be 8+ characters"
              />
            )}
          />
        </div>
        
        {/* Confirm Password */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Confirm Password</h3>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm Password"
                validator={confirmPasswordValidator}
                validationMode="onChange"
                errorMessage={errors.confirmPassword?.message}
                trailingIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                variant="minimal"
              />
            )}
          />
        </div>
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
      
      {/* Additional Examples */}
      <div className="space-y-4 pt-8 border-t">
        <h3 className="text-lg font-semibold">Additional Examples</h3>
        
        {/* Different Sizes */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Different Sizes</h4>
          <Input size="sm" placeholder="Small input" />
          <Input size="md" placeholder="Medium input (default)" />
          <Input size="lg" placeholder="Large input" />
        </div>
        
        {/* Different States */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Different States</h4>
          <Input 
            placeholder="Success state" 
            state="success" 
            helperText="This field is valid"
          />
          <Input 
            placeholder="Warning state" 
            state="warning" 
            helperText="Please review this field"
          />
          <Input 
            placeholder="Error state" 
            state="error" 
            errorMessage="This field has an error"
          />
        </div>
        
        {/* Different Variants */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Different Variants</h4>
          <Input variant="default" placeholder="Default variant" />
          <Input variant="filled" placeholder="Filled variant" />
          <Input variant="underline" placeholder="Underline variant" />
          <Input variant="minimal" placeholder="Minimal variant" />
        </div>
        
        {/* Disabled State */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Disabled State</h4>
          <Input 
            disabled 
            placeholder="Disabled input" 
            helperText="This input is disabled"
          />
        </div>
      </div>
    </div>
  )
}

export default InputExample