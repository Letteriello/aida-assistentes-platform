/**
 * AIDA Platform - Animated Button Component
 * Enhanced button with Framer Motion animations
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { Button, ButtonProps } from './button';
import { buttonHoverVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends Omit<ButtonProps, 'asChild'> {
  animationType?: 'hover' | 'tap' | 'both';
  ripple?: boolean;
}

export const AnimatedButton = forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(({ 
  className, 
  animationType = 'both',
  ripple = false,
  children,
  disabled,
  ...props 
}, ref) => {
  const MotionButton = motion(Button);

  const getAnimationProps = () => {
    if (disabled) return {};

    const baseProps: HTMLMotionProps<'button'> = {
      whileTap: animationType === 'tap' || animationType === 'both' ? { scale: 0.98 } : undefined,
      whileHover: animationType === 'hover' || animationType === 'both' ? { scale: 1.02 } : undefined,
      transition: { duration: 0.2, ease: 'easeOut' }
    };

    return baseProps;
  };

  return (
    <MotionButton
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        ripple && 'ripple-effect',
        className
      )}
      disabled={disabled}
      {...getAnimationProps()}
      {...props}
    >
      {children}
      {ripple && (
        <motion.span
          className="absolute inset-0 bg-white/20 rounded-full scale-0"
          initial={{ scale: 0, opacity: 0.5 }}
          whileTap={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </MotionButton>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

// Floating Action Button with animation
export const FloatingActionButton = forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps & { position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' }
>(({ 
  className, 
  position = 'bottom-right',
  children,
  ...props 
}, ref) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  return (
    <motion.div
      className={cn(positionClasses[position], 'z-50')}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <AnimatedButton
        ref={ref}
        className={cn(
          'rounded-full w-14 h-14 shadow-lg hover:shadow-xl',
          className
        )}
        {...props}
      >
        {children}
      </AnimatedButton>
    </motion.div>
  );
});

FloatingActionButton.displayName = 'FloatingActionButton';