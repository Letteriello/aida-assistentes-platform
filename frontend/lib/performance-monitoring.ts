/**
 * AIDA Platform - Performance Monitoring
 * Utilities for monitoring and optimizing application performance
 */

'use client';

import { useEffect, useState } from 'react';

// Web Vitals types
interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Performance metrics thresholds
const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  TTI: { good: 3800, poor: 7300 }  // Time to Interactive
};

/**
 * Measures and reports Core Web Vitals metrics
 */
export function useWebVitals(onReport?: (metrics: WebVitalsMetric[]) => void) {
  const [metrics, setMetrics] = useState<WebVitalsMetric[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Import web-vitals library dynamically to reduce bundle size
    import('web-vitals').then(({ getFCP, getLCP, getFID, getCLS, getTTFB }) => {
      const reportMetric = (name: string, value: number) => {
        // Determine rating based on thresholds
        let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
        const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
        
        if (threshold) {
          if (value >= threshold.poor) {
            rating = 'poor';
          } else if (value >= threshold.good) {
            rating = 'needs-improvement';
          }
        }

        const metric = { name, value, rating };
        setMetrics(prev => [...prev, metric]);
        onReport?.([...metrics, metric]);
      };

      // Measure Core Web Vitals
      getFCP(metric => reportMetric('FCP', metric.value));
      getLCP(metric => reportMetric('LCP', metric.value));
      getFID(metric => reportMetric('FID', metric.value));
      getCLS(metric => reportMetric('CLS', metric.value));
      getTTFB(metric => reportMetric('TTFB', metric.value));
    });
  }, [onReport, metrics]);

  return metrics;
}

/**
 * Monitors component render performance
 */
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log render time if it exceeds threshold (e.g., 16ms for 60fps)
      if (renderTime > 16) {
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

/**
 * Monitors network requests and reports slow responses
 */
export function useNetworkMonitoring(threshold = 3000) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource' && entry.duration > threshold) {
            console.warn(`Slow network request: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      return () => observer.disconnect();
    } catch (error) {
      console.error('Performance monitoring not supported:', error);
    }
  }, [threshold]);
}

/**
 * Monitors memory usage
 */
export function useMemoryUsage() {
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window) || !('memory' in performance)) {
      return;
    }

    // TypeScript doesn't know about the memory property
    const memory = (performance as any).memory;
    if (!memory) return;

    const checkMemory = () => {
      setMemoryUsage(memory.usedJSHeapSize / (1024 * 1024)); // Convert to MB
    };

    // Check memory usage periodically
    checkMemory();
    const interval = setInterval(checkMemory, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
}

/**
 * Reports performance metrics to an analytics service
 */
export function reportPerformanceMetrics(metrics: WebVitalsMetric[]) {
  // In a real application, this would send data to an analytics service
  console.log('Performance metrics:', metrics);
  
  // Example implementation for sending to an analytics endpoint
  /*
  fetch('/api/analytics/performance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ metrics }),
  });
  */
}

/**
 * Detects long tasks that might cause UI jank
 */
export function detectLongTasks() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
    return () => observer.disconnect();
  } catch (error) {
    console.error('Long task detection not supported:', error);
  }
}

/**
 * Monitors interaction to next paint (INP)
 */
export function monitorINP() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  try {
    let maxINP = 0;
    
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // @ts-ignore - TypeScript doesn't know about the interactionId property
        if (entry.interactionId && entry.duration > maxINP) {
          maxINP = entry.duration;
          
          if (maxINP > 200) {
            console.warn(`High INP detected: ${maxINP.toFixed(2)}ms`);
          }
        }
      });
    });

    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
    return () => observer.disconnect();
  } catch (error) {
    console.error('INP monitoring not supported:', error);
  }
}

/**
 * Component that displays performance metrics
 */
export function PerformanceMonitor({ 
  showMetrics = false 
}: { 
  showMetrics?: boolean 
}) {
  const metrics = useWebVitals();
  useNetworkMonitoring();
  const memoryUsage = useMemoryUsage();

  useEffect(() => {
    detectLongTasks();
    monitorINP();
  }, []);

  if (!showMetrics) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background/90 backdrop-blur-sm p-4 rounded-lg border shadow-lg max-w-xs">
      <h3 className="text-sm font-medium mb-2">Performance Metrics</h3>
      <div className="space-y-1 text-xs">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between">
            <span>{metric.name}:</span>
            <span className={
              metric.rating === 'good' ? 'text-green-500' :
              metric.rating === 'needs-improvement' ? 'text-amber-500' :
              'text-red-500'
            }>
              {metric.value.toFixed(2)}
            </span>
          </div>
        ))}
        {memoryUsage !== null && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span>{memoryUsage.toFixed(2)} MB</span>
          </div>
        )}
      </div>
    </div>
  );
}