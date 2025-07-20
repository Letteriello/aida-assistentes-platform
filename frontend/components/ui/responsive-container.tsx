/**
 * AIDA Platform - Responsive Container Components
 * Adaptive layouts and responsive design utilities
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Responsive container with adaptive padding and max-width
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  centered?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'lg',
  padding = 'md',
  centered = true,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        // Base styles
        'w-full',
        
        // Max width variants
        maxWidth === 'xs' && 'max-w-xs',
        maxWidth === 'sm' && 'max-w-sm',
        maxWidth === 'md' && 'max-w-md',
        maxWidth === 'lg' && 'max-w-lg',
        maxWidth === 'xl' && 'max-w-xl',
        maxWidth === '2xl' && 'max-w-2xl',
        maxWidth === 'full' && 'max-w-full',
        
        // Padding variants
        padding === 'none' && 'px-0',
        padding === 'sm' && 'px-3 sm:px-4',
        padding === 'md' && 'px-4 sm:px-6',
        padding === 'lg' && 'px-4 sm:px-6 md:px-8',
        
        // Centered option
        centered && 'mx-auto',
        
        className
      )}
    >
      {children}
    </div>
  );
}

// Responsive grid with configurable columns
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}

export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 'md',
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        // Base styles
        'grid w-full',
        
        // Grid columns for different breakpoints
        `grid-cols-${cols.xs || 1}`,
        cols.sm && `sm:grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`,
        
        // Gap variants
        gap === 'none' && 'gap-0',
        gap === 'xs' && 'gap-2',
        gap === 'sm' && 'gap-3 sm:gap-4',
        gap === 'md' && 'gap-4 sm:gap-6',
        gap === 'lg' && 'gap-6 sm:gap-8',
        
        className
      )}
    >
      {children}
    </div>
  );
}

// Responsive two-column layout with configurable split
interface ResponsiveSplitProps {
  children: [React.ReactNode, React.ReactNode]; // Exactly two children
  className?: string;
  split?: 'equal' | 'sidebar-left' | 'sidebar-right' | 'content-priority';
  reverse?: boolean;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  stackBelow?: 'sm' | 'md' | 'lg' | 'xl' | 'never';
}

export function ResponsiveSplit({
  children,
  className,
  split = 'equal',
  reverse = false,
  gap = 'md',
  stackBelow = 'md',
}: ResponsiveSplitProps) {
  const [firstChild, secondChild] = children;
  
  // Determine column widths based on split type
  const getColumnClasses = () => {
    switch (split) {
      case 'equal':
        return ['w-full lg:w-1/2', 'w-full lg:w-1/2'];
      case 'sidebar-left':
        return ['w-full lg:w-1/3', 'w-full lg:w-2/3'];
      case 'sidebar-right':
        return ['w-full lg:w-2/3', 'w-full lg:w-1/3'];
      case 'content-priority':
        return ['w-full lg:w-3/4', 'w-full lg:w-1/4'];
      default:
        return ['w-full lg:w-1/2', 'w-full lg:w-1/2'];
    }
  };
  
  const [firstColClass, secondColClass] = getColumnClasses();
  
  // Determine stack breakpoint
  const stackClass = {
    sm: 'sm:flex-row',
    md: 'md:flex-row',
    lg: 'lg:flex-row',
    xl: 'xl:flex-row',
    never: 'flex-row',
  }[stackBelow];
  
  // Determine gap
  const gapClass = {
    none: 'gap-0',
    sm: 'gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
  }[gap];
  
  return (
    <div
      className={cn(
        'flex flex-col',
        stackClass,
        gapClass,
        reverse && 'flex-col-reverse md:flex-row-reverse',
        className
      )}
    >
      <div className={firstColClass}>{firstChild}</div>
      <div className={secondColClass}>{secondChild}</div>
    </div>
  );
}

// Responsive typography component
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  responsive?: boolean;
}

export function ResponsiveText({
  children,
  className,
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
  align = 'left',
  responsive = true,
}: ResponsiveTextProps) {
  return (
    <Component
      className={cn(
        // Base styles
        'max-w-full',
        
        // Text size variants with responsive scaling
        size === 'xs' && 'text-xs',
        size === 'sm' && 'text-sm',
        size === 'base' && 'text-base',
        size === 'lg' && 'text-lg',
        size === 'xl' && responsive ? 'text-lg md:text-xl' : 'text-xl',
        size === '2xl' && responsive ? 'text-xl md:text-2xl' : 'text-2xl',
        size === '3xl' && responsive ? 'text-2xl md:text-3xl' : 'text-3xl',
        size === '4xl' && responsive ? 'text-3xl md:text-4xl' : 'text-4xl',
        
        // Font weight variants
        weight === 'normal' && 'font-normal',
        weight === 'medium' && 'font-medium',
        weight === 'semibold' && 'font-semibold',
        weight === 'bold' && 'font-bold',
        
        // Text alignment
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        
        className
      )}
    >
      {children}
    </Component>
  );
}

// Responsive spacing component
interface ResponsiveSpacerProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

export function ResponsiveSpacer({
  className,
  size = 'md',
  responsive = true,
}: ResponsiveSpacerProps) {
  return (
    <div
      className={cn(
        // Spacing variants with responsive scaling
        size === 'xs' && 'h-2',
        size === 'sm' && responsive ? 'h-3 md:h-4' : 'h-4',
        size === 'md' && responsive ? 'h-4 md:h-6' : 'h-6',
        size === 'lg' && responsive ? 'h-6 md:h-8' : 'h-8',
        size === 'xl' && responsive ? 'h-8 md:h-12' : 'h-12',
        
        className
      )}
      aria-hidden="true"
    />
  );
}

// Responsive visibility component
interface ResponsiveVisibilityProps {
  children: React.ReactNode;
  hideOn?: ('xs' | 'sm' | 'md' | 'lg' | 'xl')[];
  showOn?: ('xs' | 'sm' | 'md' | 'lg' | 'xl')[];
  className?: string;
}

export function ResponsiveVisibility({
  children,
  hideOn = [],
  showOn = [],
  className,
}: ResponsiveVisibilityProps) {
  // Convert breakpoint arrays to class names
  const hideClasses = hideOn.map(breakpoint => {
    switch (breakpoint) {
      case 'xs': return 'xs:hidden';
      case 'sm': return 'sm:hidden';
      case 'md': return 'md:hidden';
      case 'lg': return 'lg:hidden';
      case 'xl': return 'xl:hidden';
      default: return '';
    }
  });
  
  const showClasses = showOn.map(breakpoint => {
    switch (breakpoint) {
      case 'xs': return 'hidden xs:block';
      case 'sm': return 'hidden sm:block';
      case 'md': return 'hidden md:block';
      case 'lg': return 'hidden lg:block';
      case 'xl': return 'hidden xl:block';
      default: return '';
    }
  });
  
  return (
    <div
      className={cn(
        hideClasses.join(' '),
        showClasses.join(' '),
        className
      )}
    >
      {children}
    </div>
  );
}

// Mobile-only component
export function MobileOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('md:hidden', className)}>
      {children}
    </div>
  );
}

// Desktop-only component
export function DesktopOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('hidden md:block', className)}>
      {children}
    </div>
  );
}

// Responsive aspect ratio container
interface ResponsiveAspectRatioProps {
  children: React.ReactNode;
  ratio?: '1:1' | '4:3' | '16:9' | '21:9';
  className?: string;
}

export function ResponsiveAspectRatio({
  children,
  ratio = '16:9',
  className,
}: ResponsiveAspectRatioProps) {
  // Calculate padding-bottom based on ratio
  const getPaddingBottom = () => {
    switch (ratio) {
      case '1:1': return 'pb-[100%]';
      case '4:3': return 'pb-[75%]';
      case '16:9': return 'pb-[56.25%]';
      case '21:9': return 'pb-[42.85%]';
      default: return 'pb-[56.25%]';
    }
  };
  
  return (
    <div className={cn('relative w-full', getPaddingBottom(), className)}>
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}