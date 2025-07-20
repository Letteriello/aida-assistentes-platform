"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const techButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-tech-blue-500 text-white shadow hover:bg-tech-blue-600 hover:shadow-lg hover:scale-105 active:scale-95",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-lg hover:scale-105 active:scale-95",
        outline:
          "border-2 border-tech-blue-500 bg-transparent text-tech-blue-500 shadow-sm hover:bg-tech-blue-50 hover:text-tech-blue-600 dark:hover:bg-tech-blue-950 dark:hover:text-tech-blue-400 hover:scale-105 active:scale-95",
        secondary:
          "bg-tech-dark-100 text-tech-dark-800 shadow-sm hover:bg-tech-dark-200 dark:bg-tech-dark-800 dark:text-tech-dark-100 dark:hover:bg-tech-dark-700 hover:scale-105 active:scale-95",
        ghost:
          "text-tech-blue-500 hover:bg-tech-blue-50 hover:text-tech-blue-600 dark:hover:bg-tech-blue-950 dark:hover:text-tech-blue-400 hover:scale-105 active:scale-95",
        link:
          "text-tech-blue-500 underline-offset-4 hover:underline hover:text-tech-blue-600 dark:hover:text-tech-blue-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TechButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof techButtonVariants> {
  asChild?: boolean
}

const TechButton = React.forwardRef<HTMLButtonElement, TechButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(techButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
TechButton.displayName = "TechButton"

export { TechButton, techButtonVariants }