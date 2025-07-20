"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AnimatedTechBackgroundProps {
  className?: string
  variant?: "particles" | "grid" | "circuit" | "hybrid"
  intensity?: "subtle" | "medium" | "strong"
  children?: React.ReactNode
}

const AnimatedTechBackground = React.forwardRef<HTMLDivElement, AnimatedTechBackgroundProps>(
  ({ className, variant = "hybrid", intensity = "subtle", children, ...props }, ref) => {
    const particleCount = intensity === "subtle" ? 30 : intensity === "medium" ? 50 : 80
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-tech-dark-900 via-tech-dark-800 to-black",
          className
        )}
        {...props}
      >
        {/* Animated Grid Background */}
        {(variant === "grid" || variant === "hybrid") && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,102,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,102,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,102,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,102,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px] animate-pulse [animation-delay:1s]" />
          </div>
        )}

        {/* Floating Particles */}
        {(variant === "particles" || variant === "hybrid") && (
          <div className="absolute inset-0">
            {Array.from({ length: particleCount }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-tech-blue-400 rounded-full opacity-60 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${8 + Math.random() * 8}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Circuit Lines */}
        {(variant === "circuit" || variant === "hybrid") && (
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0066FF" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#0066FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0066FF" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Lines */}
              <line x1="0" y1="200" x2="1000" y2="200" stroke="url(#circuitGradient)" strokeWidth="2" className="animate-pulse" />
              <line x1="0" y1="400" x2="1000" y2="400" stroke="url(#circuitGradient)" strokeWidth="1" className="animate-pulse [animation-delay:2s]" />
              <line x1="0" y1="600" x2="1000" y2="600" stroke="url(#circuitGradient)" strokeWidth="2" className="animate-pulse [animation-delay:4s]" />
              <line x1="0" y1="800" x2="1000" y2="800" stroke="url(#circuitGradient)" strokeWidth="1" className="animate-pulse [animation-delay:6s]" />
              
              {/* Vertical Lines */}
              <line x1="200" y1="0" x2="200" y2="1000" stroke="url(#circuitGradient)" strokeWidth="1" className="animate-pulse [animation-delay:1s]" />
              <line x1="400" y1="0" x2="400" y2="1000" stroke="url(#circuitGradient)" strokeWidth="2" className="animate-pulse [animation-delay:3s]" />
              <line x1="600" y1="0" x2="600" y2="1000" stroke="url(#circuitGradient)" strokeWidth="1" className="animate-pulse [animation-delay:5s]" />
              <line x1="800" y1="0" x2="800" y2="1000" stroke="url(#circuitGradient)" strokeWidth="2" className="animate-pulse [animation-delay:7s]" />
              
              {/* Circuit Nodes */}
              <circle cx="200" cy="200" r="4" fill="#0066FF" className="animate-ping" />
              <circle cx="400" cy="400" r="3" fill="#0066FF" className="animate-ping [animation-delay:2s]" />
              <circle cx="600" cy="600" r="4" fill="#0066FF" className="animate-ping [animation-delay:4s]" />
              <circle cx="800" cy="800" r="3" fill="#0066FF" className="animate-ping [animation-delay:6s]" />
            </svg>
          </div>
        )}

        {/* Glowing Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-tech-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-tech-blue-400/10 rounded-full blur-3xl animate-pulse [animation-delay:3s]" />
          <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-tech-blue-600/10 rounded-full blur-2xl animate-pulse [animation-delay:6s]" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
    )
  }
)
AnimatedTechBackground.displayName = "AnimatedTechBackground"

export { AnimatedTechBackground }
export type { AnimatedTechBackgroundProps }