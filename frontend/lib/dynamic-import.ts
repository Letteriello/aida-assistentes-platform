/**
 * AIDA Platform - Dynamic Import Utilities
 * Utilities for code splitting and dynamic imports
 */

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton-loader';

/**
 * Creates a dynamically imported component with custom loading state
 * @param importFn - Dynamic import function
 * @param loadingComponent - Component to show while loading
 * @param errorComponent - Component to show on error
 */
export function createDynamicComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent: React.ReactNode = <Skeleton className="h-32 w-full" />,
  errorComponent: React.ReactNode = <div className="p-4 text-destructive">Failed to load component</div>
) {
  const LazyComponent = lazy(importFn);

  return function DynamicComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={loadingComponent}>
        <ErrorBoundary fallback={errorComponent}>
          <LazyComponent {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  };
}

/**
 * Simple error boundary component
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Preloads a component for faster rendering
 * @param importFn - Dynamic import function
 */
export function preloadComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  importFn();
}

/**
 * Creates a route component with preloading on hover
 * @param importFn - Dynamic import function
 */
export function createRouteComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const DynamicComponent = createDynamicComponent(importFn);
  
  // Preload function for navigation links
  DynamicComponent.preload = () => preloadComponent(importFn);
  
  return DynamicComponent;
}

/**
 * Creates a link that preloads the target route component on hover
 */
export function PreloadLink({
  href,
  preloadFn,
  children,
  ...props
}: {
  href: string;
  preloadFn: () => void;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handleMouseEnter = () => {
    preloadFn();
  };

  return (
    <a href={href} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </a>
  );
}