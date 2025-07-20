/**
 * AIDA Platform - Container Adaptive Components
 * Components that adapt to their container size using container queries
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';

// Container Adaptive Card that changes layout based on container width
interface ContainerAdaptiveCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ContainerAdaptiveCard({
  title,
  description,
  icon,
  content,
  footer,
  className
}: ContainerAdaptiveCardProps) {
  return (
    <Card className={cn('@container', className)}>
      <CardHeader className="@md:flex-row @md:items-start @md:justify-between @md:space-y-0">
        <div className="flex items-center space-x-2">
          {icon && (
            <div className="@sm:h-8 @sm:w-8 @md:h-10 @md:w-10 flex items-center justify-center rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="@sm:text-lg @md:text-xl">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground @md:text-base">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="@sm:p-6">
        {content}
      </CardContent>
      {footer && (
        <CardFooter className="@sm:flex-row @sm:items-center @sm:justify-between">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

// Container Adaptive Grid that changes columns based on container width
interface ContainerAdaptiveGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ContainerAdaptiveGrid({
  children,
  className
}: ContainerAdaptiveGridProps) {
  return (
    <div className={cn(
      '@container grid gap-4',
      '@sm:grid-cols-2',
      '@lg:grid-cols-3',
      '@2xl:grid-cols-4',
      className
    )}>
      {children}
    </div>
  );
}

// Container Adaptive Layout that changes from vertical to horizontal based on container width
interface ContainerAdaptiveLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function ContainerAdaptiveLayout({
  sidebar,
  content,
  className
}: ContainerAdaptiveLayoutProps) {
  return (
    <div className={cn('@container', className)}>
      <div className={cn(
        'flex flex-col gap-4',
        '@md:flex-row'
      )}>
        <div className={cn(
          'w-full',
          '@md:w-1/3 @lg:w-1/4'
        )}>
          {sidebar}
        </div>
        <div className={cn(
          'w-full',
          '@md:w-2/3 @lg:w-3/4'
        )}>
          {content}
        </div>
      </div>
    </div>
  );
}

// Container Adaptive Typography that changes size based on container width
interface ContainerAdaptiveTypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function ContainerAdaptiveTypography({
  children,
  className,
  as: Component = 'p'
}: ContainerAdaptiveTypographyProps) {
  return (
    <div className="@container">
      <Component className={cn(
        'text-base',
        '@sm:text-lg',
        '@md:text-xl',
        '@lg:text-2xl',
        className
      )}>
        {children}
      </Component>
    </div>
  );
}

// Container Adaptive Data Display that changes layout based on container width
interface ContainerAdaptiveDataDisplayProps {
  items: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export function ContainerAdaptiveDataDisplay({
  items,
  className
}: ContainerAdaptiveDataDisplayProps) {
  return (
    <div className={cn('@container', className)}>
      <div className={cn(
        'grid gap-4',
        '@sm:grid-cols-2',
        '@lg:grid-cols-3',
        '@xl:grid-cols-4'
      )}>
        {items.map((item, index) => (
          <div 
            key={index} 
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-lg border bg-card text-card-foreground',
              '@md:flex-row @md:justify-between'
            )}
          >
            <div className="flex items-center mb-2 @md:mb-0">
              {item.icon && (
                <div className="mr-2 text-muted-foreground">
                  {item.icon}
                </div>
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <span className="text-2xl font-bold @sm:text-xl @md:text-2xl">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Container Adaptive Button that changes size based on container width
interface ContainerAdaptiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}

export function ContainerAdaptiveButton({
  children,
  variant = 'default',
  className,
  ...props
}: ContainerAdaptiveButtonProps) {
  return (
    <div className="@container inline-block">
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
          'h-8 px-3 text-xs @sm:h-9 @sm:px-4 @sm:text-sm @md:h-10 @md:px-5 @md:text-base',
          className
        )}
        {...props}
      >
        {children}
      </button>
    </div>
  );
}

// Container Adaptive Form that changes layout based on container width
interface ContainerAdaptiveFormProps {
  children: React.ReactNode;
  className?: string;
}

export function ContainerAdaptiveForm({
  children,
  className
}: ContainerAdaptiveFormProps) {
  return (
    <div className={cn('@container', className)}>
      <form className="space-y-4">
        <div className={cn(
          'grid gap-4',
          '@md:grid-cols-2'
        )}>
          {children}
        </div>
      </form>
    </div>
  );
}

// Container Adaptive Table that changes display based on container width
interface ContainerAdaptiveTableProps {
  headers: string[];
  rows: Array<string[]>;
  className?: string;
}

export function ContainerAdaptiveTable({
  headers,
  rows,
  className
}: ContainerAdaptiveTableProps) {
  return (
    <div className={cn('@container', className)}>
      {/* Table view for larger containers */}
      <div className="hidden @md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left text-sm font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card view for smaller containers */}
      <div className="@md:hidden space-y-4">
        {rows.map((row, rowIndex) => (
          <Card key={rowIndex}>
            <CardContent className="p-4">
              {row.map((cell, cellIndex) => (
                <div key={cellIndex} className="flex justify-between py-1 border-b last:border-0">
                  <span className="font-medium text-sm">{headers[cellIndex]}</span>
                  <span className="text-sm">{cell}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}