/**
 * AIDA Platform - Design System Hook
 * Centralized access to design tokens, theme management, and responsive utilities
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { designTokens, getColorValue, getSpacingValue, getFontSize } from '@/lib/design-tokens';
import { aidaTokens } from '@/lib/design-system';

// Theme types
export type Theme = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

// Responsive breakpoint types
export type Breakpoint = 'mobile-s' | 'mobile-m' | 'mobile-l' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Animation preference types
export type MotionPreference = 'no-preference' | 'reduce';

interface DesignSystemState {
  theme: Theme;
  colorScheme: ColorScheme;
  currentBreakpoint: Breakpoint;
  motionPreference: MotionPreference;
  isHydrated: boolean;
}

interface DesignSystemActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  getToken: (path: string) => string;
  getColor: (path: string) => string;
  getSpacing: (key: string) => string;
  getFontSize: (size: string) => [string, { lineHeight: string }];
  isBreakpoint: (breakpoint: Breakpoint) => boolean;
  isBreakpointUp: (breakpoint: Breakpoint) => boolean;
  isBreakpointDown: (breakpoint: Breakpoint) => boolean;
}

// Breakpoint values in pixels
const BREAKPOINT_VALUES: Record<Breakpoint, number> = {
  'mobile-s': 320,
  'mobile-m': 375,
  'mobile-l': 425,
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
};

// Get current breakpoint based on window width
function getCurrentBreakpoint(width: number): Breakpoint {
  const breakpoints = Object.entries(BREAKPOINT_VALUES)
    .sort(([, a], [, b]) => b - a); // Sort descending
  
  for (const [breakpoint, value] of breakpoints) {
    if (width >= value) {
      return breakpoint as Breakpoint;
    }
  }
  
  return 'mobile-s';
}

// Get system color scheme preference
function getSystemColorScheme(): ColorScheme {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Get motion preference
function getMotionPreference(): MotionPreference {
  if (typeof window === 'undefined') return 'no-preference';
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference';
}

// Theme persistence
const THEME_STORAGE_KEY = 'aida-theme';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }
  
  return 'system';
}

function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }
}

// Apply theme to document
function applyTheme(colorScheme: ColorScheme): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  
  // Add new theme class
  root.classList.add(colorScheme);
  
  // Update color-scheme CSS property for better browser integration
  root.style.colorScheme = colorScheme;
}

/**
 * Main design system hook
 * Provides access to design tokens, theme management, and responsive utilities
 */
export function useDesignSystem(): DesignSystemState & DesignSystemActions {
  const [state, setState] = useState<DesignSystemState>({
    theme: 'system',
    colorScheme: 'light',
    currentBreakpoint: 'lg',
    motionPreference: 'no-preference',
    isHydrated: false,
  });

  // Initialize theme and preferences
  useEffect(() => {
    const storedTheme = getStoredTheme();
    const systemColorScheme = getSystemColorScheme();
    const motionPreference = getMotionPreference();
    const currentBreakpoint = getCurrentBreakpoint(window.innerWidth);
    
    const colorScheme = storedTheme === 'system' ? systemColorScheme : storedTheme as ColorScheme;
    
    setState({
      theme: storedTheme,
      colorScheme,
      currentBreakpoint,
      motionPreference,
      isHydrated: true,
    });
    
    applyTheme(colorScheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (state.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newColorScheme = e.matches ? 'dark' : 'light';
      setState(prev => ({ ...prev, colorScheme: newColorScheme }));
      applyTheme(newColorScheme);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.theme]);

  // Listen for motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newMotionPreference = e.matches ? 'reduce' : 'no-preference';
      setState(prev => ({ ...prev, motionPreference: newMotionPreference }));
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      const newBreakpoint = getCurrentBreakpoint(window.innerWidth);
      setState(prev => ({ ...prev, currentBreakpoint: newBreakpoint }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme management actions
  const setTheme = useCallback((theme: Theme) => {
    const colorScheme = theme === 'system' ? getSystemColorScheme() : theme as ColorScheme;
    
    setState(prev => ({ ...prev, theme, colorScheme }));
    setStoredTheme(theme);
    applyTheme(colorScheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = state.colorScheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [state.colorScheme, setTheme]);

  // Token access utilities
  const getToken = useCallback((path: string): string => {
    return getColorValue(path);
  }, []);

  const getColor = useCallback((path: string): string => {
    return getColorValue(path);
  }, []);

  const getSpacing = useCallback((key: string): string => {
    return getSpacingValue(key);
  }, []);

  const getFontSizeToken = useCallback((size: string): [string, { lineHeight: string }] => {
    return getFontSize(size);
  }, []);

  // Responsive utilities
  const isBreakpoint = useCallback((breakpoint: Breakpoint): boolean => {
    return state.currentBreakpoint === breakpoint;
  }, [state.currentBreakpoint]);

  const isBreakpointUp = useCallback((breakpoint: Breakpoint): boolean => {
    const currentValue = BREAKPOINT_VALUES[state.currentBreakpoint];
    const targetValue = BREAKPOINT_VALUES[breakpoint];
    return currentValue >= targetValue;
  }, [state.currentBreakpoint]);

  const isBreakpointDown = useCallback((breakpoint: Breakpoint): boolean => {
    const currentValue = BREAKPOINT_VALUES[state.currentBreakpoint];
    const targetValue = BREAKPOINT_VALUES[breakpoint];
    return currentValue <= targetValue;
  }, [state.currentBreakpoint]);

  return {
    ...state,
    setTheme,
    toggleTheme,
    getToken,
    getColor,
    getSpacing,
    getFontSize: getFontSizeToken,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
  };
}

/**
 * Hook for accessing design tokens directly
 */
export function useDesignTokens() {
  return useMemo(() => ({
    ...designTokens,
    aida: aidaTokens,
  }), []);
}

/**
 * Hook for responsive design utilities
 */
export function useResponsive() {
  const { currentBreakpoint, isBreakpoint, isBreakpointUp, isBreakpointDown } = useDesignSystem();
  
  return useMemo(() => ({
    currentBreakpoint,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isMobile: isBreakpointDown('sm'),
    isTablet: isBreakpoint('md') || isBreakpoint('lg'),
    isDesktop: isBreakpointUp('lg'),
    isLargeScreen: isBreakpointUp('xl'),
  }), [currentBreakpoint, isBreakpoint, isBreakpointUp, isBreakpointDown]);
}

/**
 * Hook for theme management
 */
export function useTheme() {
  const { theme, colorScheme, setTheme, toggleTheme, isHydrated } = useDesignSystem();
  
  return useMemo(() => ({
    theme,
    colorScheme,
    setTheme,
    toggleTheme,
    isHydrated,
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light',
  }), [theme, colorScheme, setTheme, toggleTheme, isHydrated]);
}

/**
 * Hook for animation preferences
 */
export function useMotion() {
  const { motionPreference } = useDesignSystem();
  
  return useMemo(() => ({
    motionPreference,
    prefersReducedMotion: motionPreference === 'reduce',
    shouldAnimate: motionPreference === 'no-preference',
  }), [motionPreference]);
}

/**
 * Hook for accessing color utilities
 */
export function useColors() {
  const { getColor } = useDesignSystem();
  
  return useMemo(() => ({
    getColor,
    primary: getColor('primary.600'),
    secondary: getColor('secondary.400'),
    accent: getColor('accent.cyan.500'),
    success: getColor('semantic.success.500'),
    warning: getColor('semantic.warning.500'),
    error: getColor('semantic.error.500'),
    info: getColor('semantic.info.500'),
  }), [getColor]);
}

/**
 * Hook for accessing spacing utilities
 */
export function useSpacing() {
  const { getSpacing } = useDesignSystem();
  
  return useMemo(() => ({
    getSpacing,
    xs: getSpacing('1'),
    sm: getSpacing('2'),
    md: getSpacing('4'),
    lg: getSpacing('6'),
    xl: getSpacing('8'),
    '2xl': getSpacing('12'),
  }), [getSpacing]);
}