/**
 * AIDA Platform - Theme Provider Component
 * Provides theme context and prevents hydration mismatches
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDesignSystem, Theme, ColorScheme } from '@/hooks/use-design-system';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'aida-theme',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const designSystem = useDesignSystem();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Disable transitions during theme change if requested
  useEffect(() => {
    if (disableTransitionOnChange && mounted) {
      const css = document.createElement('style');
      css.appendChild(
        document.createTextNode(
          `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
        )
      );
      document.head.appendChild(css);

      return () => {
        // Force reflow
        (() => window.getComputedStyle(document.body))();
        
        // Re-enable transitions
        document.head.removeChild(css);
      };
    }
  }, [designSystem.colorScheme, disableTransitionOnChange, mounted]);

  const contextValue: ThemeContextValue = {
    theme: designSystem.theme,
    colorScheme: designSystem.colorScheme,
    setTheme: designSystem.setTheme,
    toggleTheme: designSystem.toggleTheme,
    isHydrated: designSystem.isHydrated && mounted,
  };

  // Prevent flash of unstyled content
  if (!mounted || !designSystem.isHydrated) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * Theme toggle button component
 */
interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function ThemeToggle({ 
  className = '', 
  size = 'md',
  variant = 'ghost' 
}: ThemeToggleProps) {
  const { colorScheme, toggleTheme, isHydrated } = useThemeContext();
  
  // Don't render until hydrated to prevent mismatch
  if (!isHydrated) {
    return (
      <div 
        className={`inline-flex items-center justify-center rounded-md ${
          size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
        } ${className}`}
        aria-hidden="true"
      />
    );
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  };

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center rounded-md
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        transition-colors focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${className}
      `}
      aria-label={`Switch to ${colorScheme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${colorScheme === 'light' ? 'dark' : 'light'} theme`}
    >
      {colorScheme === 'light' ? (
        <svg
          className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        <svg
          className={size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * System theme indicator component
 */
export function SystemThemeIndicator({ className = '' }: { className?: string }) {
  const { theme, colorScheme } = useThemeContext();
  
  if (theme !== 'system') return null;
  
  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <span>System ({colorScheme})</span>
      </div>
    </div>
  );
}