/**
 * AIDA Platform - Lazy Loading Components
 * Optimized loading for images and heavy components
 */

'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton-loader';

// Lazy Image with blur-to-sharp transition
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  blurDataURL?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  blurDataURL,
  priority = false,
  fill = false,
  sizes,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-muted text-muted-foreground',
        className
      )}>
        <span className="text-sm">Erro ao carregar imagem</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Loading skeleton */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            className="absolute inset-0 bg-muted animate-pulse"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Intersection Observer Hook
function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Lazy Component Loader
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function LazyComponent({
  children,
  fallback = <Skeleton className="h-32 w-full" />,
  className,
  threshold = 0.1,
  rootMargin = '50px',
  once = true
}: LazyComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(ref, {
    threshold,
    rootMargin
  });
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isIntersecting, hasLoaded]);

  const shouldRender = once ? hasLoaded : isIntersecting;

  return (
    <div ref={ref} className={className}>
      <AnimatePresence mode="wait">
        {shouldRender ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {fallback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Lazy List for large datasets
interface LazyListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function LazyList<T>({
  items,
  renderItem,
  itemHeight = 60,
  containerHeight = 400,
  className,
  loadingComponent = <Skeleton className="h-15 w-full" />,
  emptyComponent = <div className="text-center text-muted-foreground py-8">Nenhum item encontrado</div>
}: LazyListProps<T>) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const visibleStart = Math.floor(scrollTop / itemHeight);
      const visibleEnd = Math.min(
        visibleStart + Math.ceil(containerHeight / itemHeight) + 2,
        items.length
      );

      setVisibleRange({ start: visibleStart, end: visibleEnd });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [items.length, itemHeight, containerHeight]);

  if (items.length === 0) {
    return <div className={className}>{emptyComponent}</div>;
  }

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const actualIndex = visibleRange.start + index;
          return (
            <motion.div
              key={actualIndex}
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              {renderItem(item, actualIndex)}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Progressive Image Loading
export function ProgressiveImage({
  src,
  lowQualitySrc,
  alt,
  className,
  ...props
}: {
  src: string;
  lowQualitySrc: string;
  alt: string;
  className?: string;
} & Omit<LazyImageProps, 'src' | 'alt'>) {
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {/* Low quality image */}
      <LazyImage
        src={lowQualitySrc}
        alt={alt}
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          isHighQualityLoaded ? 'opacity-0' : 'opacity-100'
        )}
        {...props}
      />
      
      {/* High quality image */}
      <LazyImage
        src={src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isHighQualityLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setIsHighQualityLoaded(true)}
        {...props}
      />
    </div>
  );
}

// Lazy Background Image
export function LazyBackgroundImage({
  src,
  children,
  className,
  fallbackColor = 'bg-muted'
}: {
  src: string;
  children?: React.ReactNode;
  className?: string;
  fallbackColor?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(ref);

  useEffect(() => {
    if (!isIntersecting) return;

    const img = new window.Image();
    img.onload = () => setIsLoaded(true);
    img.src = src;
  }, [isIntersecting, src]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500',
        isLoaded ? '' : fallbackColor,
        className
      )}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {children}
    </div>
  );
}

// Lazy Module Loader (for code splitting)
export function LazyModule({
  loader,
  fallback = <Skeleton className="h-32 w-full" />,
  className
}: {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        <LazyModuleInner loader={loader} />
      </Suspense>
    </div>
  );
}

function LazyModuleInner({
  loader
}: {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
}) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    loader().then(module => {
      setComponent(() => module.default);
    });
  }, [loader]);

  if (!Component) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Component />
    </motion.div>
  );
}