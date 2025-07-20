/**
 * AIDA Platform - Page Transition Hook
 * Custom hook for managing page transitions and loading states
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface UsePageTransitionOptions {
  delay?: number;
  duration?: number;
}

export function usePageTransition(options: UsePageTransitionOptions = {}) {
  const { delay = 100, duration = 300 } = options;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handle route changes
  useEffect(() => {
    setIsTransitioning(true);
    
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [pathname, duration]);

  // Navigate with transition
  const navigateWithTransition = async (href: string) => {
    setIsLoading(true);
    setIsTransitioning(true);

    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, delay));
    
    router.push(href);
    
    // Reset loading state after navigation
    setTimeout(() => {
      setIsLoading(false);
      setIsTransitioning(false);
    }, duration);
  };

  return {
    isTransitioning,
    isLoading,
    navigateWithTransition,
    currentPath: pathname
  };
}

// Hook for managing loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const startLoading = (message?: string) => {
    setIsLoading(true);
    if (message) setLoadingMessage(message);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingMessage('');
  };

  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(message);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
}

// Hook for stagger animations
export function useStaggerAnimation(itemCount: number, delay = 0.1) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const timer = setTimeout(() => {
        setVisibleItems(prev => [...prev, i]);
      }, i * delay * 1000);
      
      timers.push(timer);
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [itemCount, delay]);

  const isItemVisible = (index: number) => visibleItems.includes(index);
  
  const reset = () => setVisibleItems([]);

  return {
    visibleItems,
    isItemVisible,
    reset
  };
}

// Hook for scroll-based animations
export function useScrollAnimation() {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolling(true);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const scrollToTop = (smooth = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  const scrollToElement = (elementId: string, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const top = element.offsetTop - offset;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    }
  };

  return {
    scrollY,
    isScrolling,
    scrollToTop,
    scrollToElement
  };
}