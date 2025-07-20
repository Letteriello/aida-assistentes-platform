/**
 * AIDA Platform - Render Patterns
 * Render props, slots, and flexible composition patterns
 */

'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// === RENDER PROPS PATTERNS ===

// Data Fetcher with Render Props
interface DataFetcherProps<T> {
  url: string;
  children: (state: {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
  }) => React.ReactNode;
}

export function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return <>{children({ data, loading, error, refetch: fetchData })}</>;
}

// Mouse Position Tracker
interface MouseTrackerProps {
  children: (position: { x: number; y: number }) => React.ReactNode;
}

export function MouseTracker({ children }: MouseTrackerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return <>{children(position)}</>;
}

// Intersection Observer with Render Props
interface IntersectionObserverProps {
  children: (isIntersecting: boolean) => React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function IntersectionObserver({ 
  children, 
  threshold = 0.1, 
  rootMargin = '0px' 
}: IntersectionObserverProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new window.IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {children(isIntersecting)}
    </div>
  );
}

// Form State Manager with Render Props
interface FormStateProps<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  children: (state: {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    touched: Partial<Record<keyof T, boolean>>;
    setValue: (field: keyof T, value: any) => void;
    setError: (field: keyof T, error: string) => void;
    handleSubmit: (onSubmit: (values: T) => void) => (e: React.FormEvent) => void;
    reset: () => void;
    isValid: boolean;
  }) => React.ReactNode;
}

export function FormState<T extends Record<string, any>>({ 
  initialValues, 
  validate, 
  children 
}: FormStateProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const setError = (field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = (onSubmit: (values: T) => void) => (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }
    
    onSubmit(values);
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const isValid = Object.keys(errors).length === 0;

  return (
    <>
      {children({
        values,
        errors,
        touched,
        setValue,
        setError,
        handleSubmit,
        reset,
        isValid
      })}
    </>
  );
}

// === SLOT-BASED COMPOSITION ===

// Slot Context
interface SlotContextType {
  slots: Record<string, React.ReactNode>;
  setSlot: (name: string, content: React.ReactNode) => void;
}

const SlotContext = createContext<SlotContextType | null>(null);

// Slot Provider
interface SlotProviderProps {
  children: React.ReactNode;
}

export function SlotProvider({ children }: SlotProviderProps) {
  const [slots, setSlots] = useState<Record<string, React.ReactNode>>({});

  const setSlot = (name: string, content: React.ReactNode) => {
    setSlots(prev => ({ ...prev, [name]: content }));
  };

  return (
    <SlotContext.Provider value={{ slots, setSlot }}>
      {children}
    </SlotContext.Provider>
  );
}

// Slot Component
interface SlotProps {
  name: string;
  fallback?: React.ReactNode;
  className?: string;
}

export function Slot({ name, fallback, className }: SlotProps) {
  const context = useContext(SlotContext);
  const content = context?.slots[name] || fallback;

  if (!content) return null;

  return <div className={className}>{content}</div>;
}

// Fill Slot Component
interface FillSlotProps {
  name: string;
  children: React.ReactNode;
}

export function FillSlot({ name, children }: FillSlotProps) {
  const context = useContext(SlotContext);
  
  useEffect(() => {
    context?.setSlot(name, children);
    return () => context?.setSlot(name, null);
  }, [name, children, context]);

  return null;
}

// Layout with Slots
interface LayoutWithSlotsProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutWithSlots({ children, className }: LayoutWithSlotsProps) {
  return (
    <SlotProvider>
      <div className={cn('min-h-screen flex flex-col', className)}>
        {/* Header Slot */}
        <Slot name="header" className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
        
        <div className="flex flex-1">
          {/* Sidebar Slot */}
          <Slot name="sidebar" className="w-64 border-r bg-muted/50" />
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            <Slot name="breadcrumb" className="mb-4" />
            <div className="space-y-6">
              {children}
            </div>
          </main>
          
          {/* Right Panel Slot */}
          <Slot name="rightPanel" className="w-80 border-l bg-muted/50" />
        </div>
        
        {/* Footer Slot */}
        <Slot name="footer" className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
      </div>
    </SlotProvider>
  );
}

// === FLEXIBLE COMPONENT PATTERNS ===

// Polymorphic Component
interface PolymorphicProps<T extends React.ElementType> {
  as?: T;
  children: React.ReactNode;
  className?: string;
}

type PolymorphicComponentProps<T extends React.ElementType> = PolymorphicProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof PolymorphicProps<T>>;

export function Polymorphic<T extends React.ElementType = 'div'>({
  as,
  children,
  className,
  ...props
}: PolymorphicComponentProps<T>) {
  const Component = as || 'div';
  
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}

// Conditional Wrapper
interface ConditionalWrapperProps {
  condition: boolean;
  wrapper: (children: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
}

export function ConditionalWrapper({ condition, wrapper, children }: ConditionalWrapperProps) {
  return condition ? <>{wrapper(children)}</> : <>{children}</>;
}

// Render If
interface RenderIfProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RenderIf({ condition, children, fallback }: RenderIfProps) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

// List Renderer with Render Props
interface ListRendererProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  isLoading?: boolean;
  className?: string;
  itemClassName?: string;
}

export function ListRenderer<T>({
  items,
  renderItem,
  renderEmpty,
  renderLoading,
  isLoading = false,
  className,
  itemClassName
}: ListRendererProps<T>) {
  if (isLoading && renderLoading) {
    return <>{renderLoading()}</>;
  }

  if (items.length === 0 && renderEmpty) {
    return <>{renderEmpty()}</>;
  }

  return (
    <div className={className}>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
            className={itemClassName}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Higher Order Component for Animation
export function withAnimation<P extends object>(
  Component: React.ComponentType<P>,
  animationProps?: {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
  }
) {
  return function AnimatedComponent(props: P) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        {...animationProps}
      >
        <Component {...props} />
      </motion.div>
    );
  };
}

// Compound Component Builder
export function createCompoundComponent<T extends Record<string, React.ComponentType<any>>>(
  components: T
) {
  const CompoundComponent = components.Root;
  
  Object.keys(components).forEach(key => {
    if (key !== 'Root') {
      (CompoundComponent as any)[key] = components[key];
    }
  });
  
  return CompoundComponent as typeof components.Root & Omit<T, 'Root'>;
}