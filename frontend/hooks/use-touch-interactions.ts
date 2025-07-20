/**
 * AIDA Platform - Touch Interactions Hook
 * Optimized touch gestures and interactions for mobile devices
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeDirection {
  horizontal: 'left' | 'right' | null;
  vertical: 'up' | 'down' | null;
}

interface UseSwipeOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

/**
 * Hook for detecting swipe gestures on touch devices
 */
export function useSwipe(options: UseSwipeOptions = {}) {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown
  } = options;

  const touchStartRef = useRef<TouchPosition | null>(null);
  const touchEndRef = useRef<TouchPosition | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>({
    horizontal: null,
    vertical: null
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    touchEndRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    touchEndRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;

    const newDirection: SwipeDirection = {
      horizontal: null,
      vertical: null
    };

    // Determine horizontal swipe
    if (Math.abs(deltaX) > threshold) {
      newDirection.horizontal = deltaX > 0 ? 'right' : 'left';
      
      if (newDirection.horizontal === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (newDirection.horizontal === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    }

    // Determine vertical swipe
    if (Math.abs(deltaY) > threshold) {
      newDirection.vertical = deltaY > 0 ? 'down' : 'up';
      
      if (newDirection.vertical === 'up' && onSwipeUp) {
        onSwipeUp();
      } else if (newDirection.vertical === 'down' && onSwipeDown) {
        onSwipeDown();
      }
    }

    setSwipeDirection(newDirection);
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    swipeDirection,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}

interface UsePinchOptions {
  onPinchStart?: () => void;
  onPinch?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
}

/**
 * Hook for detecting pinch gestures on touch devices
 */
export function usePinch(options: UsePinchOptions = {}) {
  const { onPinchStart, onPinch, onPinchEnd } = options;
  const [scale, setScale] = useState(1);
  const initialDistanceRef = useRef<number | null>(null);
  const isPinchingRef = useRef(false);

  const getDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistanceRef.current = getDistance(e.touches);
      isPinchingRef.current = true;
      onPinchStart?.();
    }
  }, [onPinchStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPinchingRef.current || !initialDistanceRef.current || e.touches.length < 2) return;

    const currentDistance = getDistance(e.touches);
    const newScale = currentDistance / initialDistanceRef.current;
    
    setScale(newScale);
    onPinch?.(newScale);
  }, [onPinch]);

  const handleTouchEnd = useCallback(() => {
    if (isPinchingRef.current) {
      isPinchingRef.current = false;
      onPinchEnd?.(scale);
    }
    initialDistanceRef.current = null;
  }, [scale, onPinchEnd]);

  return {
    scale,
    isPinching: isPinchingRef.current,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}

interface UseLongPressOptions {
  delay?: number;
  onLongPress?: () => void;
  onPress?: () => void;
}

/**
 * Hook for detecting long press gestures on touch devices
 */
export function useLongPress(options: UseLongPressOptions = {}) {
  const { delay = 500, onLongPress, onPress } = options;
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressedRef = useRef(false);

  const handleTouchStart = useCallback(() => {
    isLongPressedRef.current = false;
    setIsLongPressing(true);
    
    timerRef.current = setTimeout(() => {
      isLongPressedRef.current = true;
      onLongPress?.();
    }, delay);
  }, [delay, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    setIsLongPressing(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (!isLongPressedRef.current) {
      onPress?.();
    }
  }, [onPress]);

  const handleTouchMove = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    isLongPressing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove
    }
  };
}

/**
 * Hook for optimizing touch targets to meet accessibility standards
 */
export function useTouchTarget(minSize: number = 44) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const { width, height } = element.getBoundingClientRect();
    
    // Apply minimum touch target size if needed
    if (width < minSize || height < minSize) {
      const originalStyles = element.getAttribute('style') || '';
      
      // Calculate necessary padding to reach minimum size
      const paddingX = Math.max(0, (minSize - width) / 2);
      const paddingY = Math.max(0, (minSize - height) / 2);
      
      element.style.padding = `${paddingY}px ${paddingX}px`;
      
      // Store original styles for cleanup
      element.dataset.originalStyles = originalStyles;
    }

    return () => {
      if (element && element.dataset.originalStyles !== undefined) {
        element.setAttribute('style', element.dataset.originalStyles);
        delete element.dataset.originalStyles;
      }
    };
  }, [minSize]);

  return ref;
}

/**
 * Hook for implementing pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const pullThreshold = 80; // Pixels to pull before triggering refresh

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh at the top of the page
    if (window.scrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchStartRef.current === null || window.scrollY > 0) return;

    const touchY = e.touches[0].clientY;
    const pullDistance = touchY - touchStartRef.current;
    
    // Only allow pulling down, not up
    if (pullDistance > 0) {
      // Apply resistance to make the pull feel natural
      const resistance = 0.4;
      const progress = Math.min(pullDistance * resistance, pullThreshold);
      
      setPullProgress(progress);
      setIsPulling(true);
      
      // Prevent default scrolling behavior
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    if (pullProgress >= pullThreshold) {
      setIsRefreshing(true);
      setPullProgress(0);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullProgress(0);
    touchStartRef.current = null;
  }, [isPulling, pullProgress, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullProgress,
    pullThreshold
  };
}