/**
 * AIDA Platform - Animated Tooltip Component
 * Enhanced tooltip with Framer Motion animations
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delay?: number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function AnimatedTooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 500,
  className,
  contentClassName,
  disabled = false
}: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    let x = 0;
    let y = 0;

    switch (side) {
      case 'top':
        x = rect.left + scrollX + (align === 'start' ? 0 : align === 'end' ? rect.width : rect.width / 2);
        y = rect.top + scrollY - 8;
        break;
      case 'bottom':
        x = rect.left + scrollX + (align === 'start' ? 0 : align === 'end' ? rect.width : rect.width / 2);
        y = rect.bottom + scrollY + 8;
        break;
      case 'left':
        x = rect.left + scrollX - 8;
        y = rect.top + scrollY + (align === 'start' ? 0 : align === 'end' ? rect.height : rect.height / 2);
        break;
      case 'right':
        x = rect.right + scrollX + 8;
        y = rect.top + scrollY + (align === 'start' ? 0 : align === 'end' ? rect.height : rect.height / 2);
        break;
    }

    setPosition({ x, y });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        updatePosition();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  const getAnimationVariants = () => {
    const distance = 8;
    
    switch (side) {
      case 'top':
        return {
          hidden: { opacity: 0, y: distance, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1 }
        };
      case 'bottom':
        return {
          hidden: { opacity: 0, y: -distance, scale: 0.95 },
          visible: { opacity: 1, y: 0, scale: 1 }
        };
      case 'left':
        return {
          hidden: { opacity: 0, x: distance, scale: 0.95 },
          visible: { opacity: 1, x: 0, scale: 1 }
        };
      case 'right':
        return {
          hidden: { opacity: 0, x: -distance, scale: 0.95 },
          visible: { opacity: 1, x: 0, scale: 1 }
        };
    }
  };

  const getTransformOrigin = () => {
    switch (side) {
      case 'top':
        return align === 'start' ? 'bottom left' : align === 'end' ? 'bottom right' : 'bottom center';
      case 'bottom':
        return align === 'start' ? 'top left' : align === 'end' ? 'top right' : 'top center';
      case 'left':
        return align === 'start' ? 'top right' : align === 'end' ? 'bottom right' : 'center right';
      case 'right':
        return align === 'start' ? 'top left' : align === 'end' ? 'bottom left' : 'center left';
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-block', className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed z-50 pointer-events-none"
            style={{
              left: position.x,
              top: position.y,
              transformOrigin: getTransformOrigin()
            }}
            variants={getAnimationVariants()}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{
              duration: 0.2,
              ease: 'easeOut'
            }}
          >
            <div
              className={cn(
                'px-3 py-2 text-sm text-popover-foreground bg-popover border rounded-md shadow-md max-w-xs',
                'transform',
                side === 'top' && align === 'center' && '-translate-x-1/2 -translate-y-full',
                side === 'top' && align === 'start' && '-translate-y-full',
                side === 'top' && align === 'end' && '-translate-x-full -translate-y-full',
                side === 'bottom' && align === 'center' && '-translate-x-1/2',
                side === 'bottom' && align === 'start' && '',
                side === 'bottom' && align === 'end' && '-translate-x-full',
                side === 'left' && align === 'center' && '-translate-x-full -translate-y-1/2',
                side === 'left' && align === 'start' && '-translate-x-full',
                side === 'left' && align === 'end' && '-translate-x-full -translate-y-full',
                side === 'right' && align === 'center' && '-translate-y-1/2',
                side === 'right' && align === 'start' && '',
                side === 'right' && align === 'end' && '-translate-y-full',
                contentClassName
              )}
            >
              {content}
              
              {/* Arrow */}
              <div
                className={cn(
                  'absolute w-2 h-2 bg-popover border transform rotate-45',
                  side === 'top' && 'bottom-[-4px] border-t-0 border-l-0',
                  side === 'bottom' && 'top-[-4px] border-b-0 border-r-0',
                  side === 'left' && 'right-[-4px] border-t-0 border-l-0',
                  side === 'right' && 'left-[-4px] border-b-0 border-r-0',
                  align === 'center' && (side === 'top' || side === 'bottom') && 'left-1/2 -translate-x-1/2',
                  align === 'center' && (side === 'left' || side === 'right') && 'top-1/2 -translate-y-1/2',
                  align === 'start' && (side === 'top' || side === 'bottom') && 'left-3',
                  align === 'start' && (side === 'left' || side === 'right') && 'top-3',
                  align === 'end' && (side === 'top' || side === 'bottom') && 'right-3',
                  align === 'end' && (side === 'left' || side === 'right') && 'bottom-3'
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Quick tooltip for simple text
export function QuickTooltip({
  text,
  children,
  ...props
}: Omit<AnimatedTooltipProps, 'content'> & { text: string }) {
  return (
    <AnimatedTooltip content={text} {...props}>
      {children}
    </AnimatedTooltip>
  );
}

// Rich tooltip with title and description
export function RichTooltip({
  title,
  description,
  children,
  ...props
}: Omit<AnimatedTooltipProps, 'content'> & { 
  title: string; 
  description?: string;
}) {
  return (
    <AnimatedTooltip
      content={
        <div className="space-y-1">
          <div className="font-medium">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </div>
      }
      {...props}
    >
      {children}
    </AnimatedTooltip>
  );
}

// Keyboard shortcut tooltip
export function KeyboardTooltip({
  shortcut,
  description,
  children,
  ...props
}: Omit<AnimatedTooltipProps, 'content'> & { 
  shortcut: string; 
  description: string;
}) {
  return (
    <AnimatedTooltip
      content={
        <div className="flex items-center justify-between gap-3">
          <span>{description}</span>
          <kbd className="px-2 py-1 text-xs bg-muted rounded border">
            {shortcut}
          </kbd>
        </div>
      }
      {...props}
    >
      {children}
    </AnimatedTooltip>
  );
}