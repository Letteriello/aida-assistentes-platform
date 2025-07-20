/**
 * AIDA Platform - Performance Optimization Components
 * Components and utilities for optimizing application performance
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useWebVitals, useRenderPerformance } from '@/lib/performance-monitoring';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton-loader';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  RefreshCw
} from 'lucide-react';

// Performance Metrics Display Component
export function PerformanceMetricsDisplay({ className }: { className?: string }) {
  const metrics = useWebVitals();
  useRenderPerformance('PerformanceMetricsDisplay');
  
  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good': return 'text-green-500';
      case 'needs-improvement': return 'text-amber-500';
      case 'poor': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };
  
  const getRatingIcon = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs-improvement': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'poor': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };
  
  const getMetricName = (name: string) => {
    switch (name) {
      case 'FCP': return 'First Contentful Paint';
      case 'LCP': return 'Largest Contentful Paint';
      case 'FID': return 'First Input Delay';
      case 'CLS': return 'Cumulative Layout Shift';
      case 'TTFB': return 'Time to First Byte';
      case 'TTI': return 'Time to Interactive';
      default: return name;
    }
  };
  
  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return `${value.toFixed(0)}ms`;
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getRatingIcon(metric.rating)}
                    <span className="text-sm font-medium">{getMetricName(metric.name)}</span>
                  </div>
                  <span className={cn('text-sm font-medium', getRatingColor(metric.rating))}>
                    {formatValue(metric.name, metric.value)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className={cn(
                      'h-1.5 rounded-full',
                      metric.rating === 'good' ? 'bg-green-500' :
                      metric.rating === 'needs-improvement' ? 'bg-amber-500' :
                      'bg-red-500'
                    )}
                    style={{ 
                      width: `${Math.max(5, Math.min(100, 100 - (metric.value / 
                        (metric.name === 'CLS' ? 0.5 : 5000) * 100)))}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Memoized Component Example
interface MemoizedListProps {
  items: Array<{ id: string; name: string }>;
  onItemClick: (id: string) => void;
  className?: string;
}

export function MemoizedList({ items, onItemClick, className }: MemoizedListProps) {
  useRenderPerformance('MemoizedList');
  
  // Memoize the list to prevent unnecessary re-renders
  const memoizedItems = useMemo(() => items, [items]);
  
  // Memoize the click handler
  const handleItemClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);
  
  return (
    <div className={cn('space-y-2', className)}>
      {memoizedItems.map(item => (
        <div 
          key={item.id}
          className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => handleItemClick(item.id)}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}

// Virtualized List for Large Datasets
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  height: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  height,
  className
}: VirtualizedListProps<T>) {
  useRenderPerformance('VirtualizedList');
  
  const [scrollTop, setScrollTop] = useState(0);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  // Calculate visible items
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight)
  );
  
  // Add buffer for smoother scrolling
  const visibleStartIndex = Math.max(0, startIndex - 5);
  const visibleEndIndex = Math.min(items.length - 1, endIndex + 5);
  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex + 1);
  
  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStartIndex * itemHeight;
  
  return (
    <div
      className={cn('overflow-auto', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          {visibleItems.map((item, index) => (
            <div key={index + visibleStartIndex} style={{ height: itemHeight }}>
              {renderItem(item, index + visibleStartIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Deferred Rendering Component
interface DeferredRenderingProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
  className?: string;
}

export function DeferredRendering({
  children,
  delay = 100,
  fallback = <Skeleton className="h-32 w-full" />,
  className
}: DeferredRenderingProps) {
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div className={className}>
      {shouldRender ? children : fallback}
    </div>
  );
}

// Progressive Hydration Component
interface ProgressiveHydrationProps {
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  fallback?: React.ReactNode;
  className?: string;
}

export function ProgressiveHydration({
  children,
  priority = 'medium',
  fallback = <Skeleton className="h-32 w-full" />,
  className
}: ProgressiveHydrationProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    // Determine delay based on priority
    const delay = priority === 'high' ? 0 : priority === 'medium' ? 200 : 1000;
    
    // Use requestIdleCallback for low priority or setTimeout for others
    if (priority === 'low' && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => {
        setIsHydrated(true);
      });
      
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(() => {
        setIsHydrated(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [priority]);
  
  return (
    <div className={className}>
      {isHydrated ? children : fallback}
    </div>
  );
}

// Performance Testing Component
export function PerformanceTester({ className }: { className?: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Array<{ test: string; duration: number }>>([]);
  
  const runTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    
    // Test 1: DOM Manipulation
    const startDOM = performance.now();
    const container = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
      const element = document.createElement('div');
      element.textContent = `Item ${i}`;
      container.appendChild(element);
    }
    const endDOM = performance.now();
    
    setResults(prev => [...prev, { 
      test: 'DOM Manipulation (1000 elements)', 
      duration: endDOM - startDOM 
    }]);
    
    // Test 2: Array Operations
    const startArray = performance.now();
    const array = Array.from({ length: 100000 }, (_, i) => i);
    const filtered = array.filter(n => n % 2 === 0);
    const mapped = filtered.map(n => n * 2);
    const reduced = mapped.reduce((acc, n) => acc + n, 0);
    const endArray = performance.now();
    
    setResults(prev => [...prev, { 
      test: 'Array Operations (100,000 items)', 
      duration: endArray - startArray 
    }]);
    
    // Test 3: JSON Parsing
    const startJSON = performance.now();
    const data = Array.from({ length: 10000 }, (_, i) => ({ 
      id: i, 
      name: `Item ${i}`,
      value: Math.random() * 1000
    }));
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);
    const endJSON = performance.now();
    
    setResults(prev => [...prev, { 
      test: 'JSON Parse/Stringify (10,000 objects)', 
      duration: endJSON - startJSON 
    }]);
    
    // Test 4: Layout Thrashing
    const startLayout = performance.now();
    const div = document.createElement('div');
    document.body.appendChild(div);
    for (let i = 0; i < 100; i++) {
      div.style.width = `${100 + i}px`;
      const width = div.offsetWidth; // Forces layout recalculation
      div.style.height = `${width / 2}px`;
      const height = div.offsetHeight; // Forces layout recalculation
    }
    document.body.removeChild(div);
    const endLayout = performance.now();
    
    setResults(prev => [...prev, { 
      test: 'Layout Thrashing (100 iterations)', 
      duration: endLayout - startLayout 
    }]);
    
    setIsRunning(false);
  }, []);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Performance Test Suite
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Performance Tests
              </>
            )}
          </Button>
          
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-3 border rounded-md"
                >
                  <span className="text-sm">{result.test}</span>
                  <span className={cn(
                    'text-sm font-medium',
                    result.duration < 50 ? 'text-green-500' :
                    result.duration < 200 ? 'text-amber-500' :
                    'text-red-500'
                  )}>
                    {result.duration.toFixed(2)}ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Suspense Boundary with Fallback
interface SuspenseBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function SuspenseBoundary({
  children,
  fallback = <Skeleton className="h-32 w-full" />,
  className
}: SuspenseBoundaryProps) {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
}

// Optimized List Rendering with Windowing
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemHeight?: number;
  height?: number | string;
}

export function OptimizedList<T>({
  items,
  renderItem,
  className,
  itemHeight = 50,
  height = 400
}: OptimizedListProps<T>) {
  // For small lists, render normally
  if (items.length <= 100) {
    return (
      <div className={cn('space-y-1', className)}>
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02, duration: 0.2 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </div>
    );
  }
  
  // For large lists, use virtualization
  return (
    <VirtualizedList
      items={items}
      renderItem={renderItem}
      itemHeight={itemHeight}
      height={typeof height === 'number' ? height : 400}
      className={className}
    />
  );
}