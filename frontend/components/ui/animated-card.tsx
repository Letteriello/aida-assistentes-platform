/**
 * AIDA Platform - Animated Card Component
 * Enhanced card with Framer Motion animations
 */

'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { Card, CardProps } from './card';
import { cardHoverVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends CardProps {
  animationType?: 'hover' | 'entrance' | 'both';
  hoverEffect?: boolean;
  delay?: number;
}

export const AnimatedCard = forwardRef<
  HTMLDivElement,
  AnimatedCardProps
>(({ 
  className, 
  animationType = 'both',
  hoverEffect = true,
  delay = 0,
  children,
  ...props 
}, ref) => {
  const MotionCard = motion(Card);

  const getAnimationProps = (): HTMLMotionProps<'div'> => {
    const baseProps: HTMLMotionProps<'div'> = {};

    // Entrance animation
    if (animationType === 'entrance' || animationType === 'both') {
      baseProps.initial = { opacity: 0, y: 20 };
      baseProps.animate = { opacity: 1, y: 0 };
      baseProps.transition = { 
        duration: 0.4, 
        ease: 'easeOut',
        delay 
      };
    }

    // Hover animation
    if (hoverEffect && (animationType === 'hover' || animationType === 'both')) {
      baseProps.whileHover = {
        y: -4,
        scale: 1.02,
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        transition: { duration: 0.3, ease: 'easeOut' }
      };
    }

    return baseProps;
  };

  return (
    <MotionCard
      ref={ref}
      className={cn(
        'transition-shadow duration-300',
        hoverEffect && 'cursor-pointer',
        className
      )}
      {...getAnimationProps()}
      {...props}
    >
      {children}
    </MotionCard>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

// Metric Card with enhanced animations
export const AnimatedMetricCard = forwardRef<
  HTMLDivElement,
  AnimatedCardProps & { 
    value?: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }
>(({ 
  className,
  value,
  change,
  changeType = 'neutral',
  children,
  ...props 
}, ref) => {
  return (
    <AnimatedCard
      ref={ref}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      <div className="relative z-10">
        {children}
        
        {/* Animated value */}
        {value && (
          <motion.div
            className="text-2xl font-bold"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {value}
          </motion.div>
        )}
        
        {/* Animated change indicator */}
        {change && (
          <motion.div
            className={cn(
              'text-sm flex items-center gap-1',
              changeType === 'positive' && 'text-green-600',
              changeType === 'negative' && 'text-red-600',
              changeType === 'neutral' && 'text-muted-foreground'
            )}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {change}
          </motion.div>
        )}
      </div>
    </AnimatedCard>
  );
});

AnimatedMetricCard.displayName = 'AnimatedMetricCard';