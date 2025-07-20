/**
 * AIDA Platform - Touch Optimized Components
 * UI components optimized for touch interactions on mobile devices
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSwipe, useLongPress, usePinch } from '@/hooks/use-touch-interactions';
import { Button } from './button';
import { X, Plus, Minus, MoreHorizontal, Check } from 'lucide-react';

// Touch-optimized button with proper touch target size
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  ripple?: boolean;
}

export function TouchButton({
  children,
  variant = 'default',
  size = 'default',
  className,
  ripple = true,
  ...props
}: TouchButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!ripple) return;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const touch = e.touches[0];
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  };
  
  return (
    <button
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        'touch-manipulation', // Disable double-tap zoom
        
        // Variant styles
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        
        // Size styles - ensuring minimum touch target size of 44px
        size === 'default' && 'h-11 min-h-[44px] px-4 py-2',
        size === 'sm' && 'h-11 min-h-[44px] px-3 text-sm',
        size === 'lg' && 'h-12 min-h-[44px] px-8',
        size === 'icon' && 'h-11 w-11 min-h-[44px] min-w-[44px] p-0',
        
        className
      )}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {/* Ripple effect */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          initial={{ width: 0, height: 0, opacity: 0.5, x: ripple.x, y: ripple.y, transform: 'translate(-50%, -50%)' }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
      
      {children}
    </button>
  );
}

// Touch-optimized card with swipe actions
interface TouchSwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  className?: string;
}

export function TouchSwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className
}: TouchSwipeCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const swipeThreshold = 0.4; // 40% of card width to trigger action
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeDirection(null);
    setSwipeProgress(0);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const card = e.currentTarget;
    const cardWidth = card.offsetWidth;
    
    // Calculate swipe distance as percentage of card width
    const touchX = touch.clientX;
    const cardRect = card.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    
    const swipeDistance = touchX - cardCenterX;
    const swipePercentage = swipeDistance / (cardWidth / 2);
    
    // Limit swipe progress to range [-1, 1]
    const clampedProgress = Math.max(-1, Math.min(1, swipePercentage));
    
    setSwipeProgress(clampedProgress);
    setSwipeDirection(clampedProgress > 0 ? 'right' : 'left');
  };
  
  const handleTouchEnd = () => {
    // Check if swipe exceeds threshold
    if (Math.abs(swipeProgress) >= swipeThreshold) {
      if (swipeDirection === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (swipeDirection === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    }
    
    // Reset swipe state
    setSwipeProgress(0);
  };
  
  return (
    <div className="relative overflow-hidden">
      {/* Left action background */}
      {leftAction && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4"
          style={{
            backgroundColor: leftAction.color,
            opacity: swipeDirection === 'left' ? Math.abs(swipeProgress) : 0,
            width: '100%'
          }}
        >
          <div className="flex flex-col items-center text-white">
            {leftAction.icon}
            <span className="text-xs mt-1">{leftAction.label}</span>
          </div>
        </div>
      )}
      
      {/* Right action background */}
      {rightAction && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center px-4"
          style={{
            backgroundColor: rightAction.color,
            opacity: swipeDirection === 'right' ? Math.abs(swipeProgress) : 0,
            width: '100%'
          }}
        >
          <div className="flex flex-col items-center text-white">
            {rightAction.icon}
            <span className="text-xs mt-1">{rightAction.label}</span>
          </div>
        </div>
      )}
      
      {/* Card content */}
      <motion.div
        className={cn(
          'bg-card border rounded-lg shadow-sm',
          className
        )}
        animate={{
          x: `${swipeProgress * 100}px`,
          opacity: 1 - Math.abs(swipeProgress) * 0.5
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 40
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Touch-optimized list with swipe actions
interface TouchListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onSwipeLeft?: (item: T, index: number) => void;
  onSwipeRight?: (item: T, index: number) => void;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  className?: string;
  itemClassName?: string;
}

export function TouchList<T>({
  items,
  renderItem,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
  itemClassName
}: TouchListProps<T>) {
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, index) => (
        <TouchSwipeCard
          key={index}
          onSwipeLeft={onSwipeLeft ? () => onSwipeLeft(item, index) : undefined}
          onSwipeRight={onSwipeRight ? () => onSwipeRight(item, index) : undefined}
          leftAction={leftAction}
          rightAction={rightAction}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </TouchSwipeCard>
      ))}
    </div>
  );
}

// Touch-optimized slider component
interface TouchSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  thumbSize?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function TouchSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
  thumbSize = 'md',
  showLabels = true
}: TouchSliderProps) {
  const thumbSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  return (
    <div className={cn('w-full', className)}>
      <div className="relative pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'w-full h-2 appearance-none rounded-full bg-muted outline-none',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            '[&::-webkit-slider-thumb]:appearance-none',
            `[&::-webkit-slider-thumb]:${thumbSizes[thumbSize]}`,
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-primary',
            '[&::-webkit-slider-thumb]:border-4',
            '[&::-webkit-slider-thumb]:border-background',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:border-0',
            `[&::-moz-range-thumb]:${thumbSizes[thumbSize]}`,
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-primary',
            '[&::-moz-range-thumb]:border-4',
            '[&::-moz-range-thumb]:border-background',
            '[&::-moz-range-thumb]:cursor-pointer',
            'touch-manipulation' // Disable double-tap zoom
          )}
        />
        
        {/* Progress fill */}
        <div 
          className="absolute h-2 bg-primary rounded-full top-[9px] left-0"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        
        {showLabels && (
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">{min}</span>
            <span className="text-xs text-muted-foreground">{max}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Touch-optimized number input with increment/decrement buttons
interface TouchNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
}

export function TouchNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  label
}: TouchNumberInputProps) {
  const increment = () => {
    if (max !== undefined && value + step > max) return;
    onChange(value + step);
  };
  
  const decrement = () => {
    if (min !== undefined && value - step < min) return;
    onChange(value - step);
  };
  
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1">{label}</label>
      )}
      <div className="flex items-center">
        <TouchButton
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={min !== undefined && value <= min}
          aria-label="Decrease"
        >
          <Minus className="h-4 w-4" />
        </TouchButton>
        
        <div className="flex-1 mx-2">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              if (min !== undefined && newValue < min) return;
              if (max !== undefined && newValue > max) return;
              onChange(newValue);
            }}
            min={min}
            max={max}
            step={step}
            className={cn(
              'w-full h-11 px-3 py-2 text-center',
              'border rounded-md bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'touch-manipulation' // Disable double-tap zoom
            )}
          />
        </div>
        
        <TouchButton
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={max !== undefined && value >= max}
          aria-label="Increase"
        >
          <Plus className="h-4 w-4" />
        </TouchButton>
      </div>
    </div>
  );
}

// Touch-optimized action sheet (bottom sheet menu)
interface TouchActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
  className?: string;
}

export function TouchActionSheet({
  isOpen,
  onClose,
  title,
  actions,
  className
}: TouchActionSheetProps) {
  const { handlers } = useSwipe({
    onSwipeDown: onClose,
  });
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 touch-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Action Sheet */}
          <motion.div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-xl overflow-hidden',
              className
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            {...handlers}
          >
            {/* Drag handle */}
            <div className="flex justify-center p-2">
              <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
            </div>
            
            {/* Title */}
            {title && (
              <div className="px-4 py-2 border-b">
                <h3 className="text-center font-medium">{title}</h3>
              </div>
            )}
            
            {/* Actions */}
            <div className="p-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className={cn(
                    'flex items-center w-full px-4 py-3 min-h-[44px] text-left',
                    'hover:bg-muted/50 active:bg-muted transition-colors rounded-lg',
                    action.variant === 'destructive' && 'text-destructive',
                    'touch-manipulation' // Disable double-tap zoom
                  )}
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                >
                  {action.icon && (
                    <span className="mr-3">{action.icon}</span>
                  )}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
            
            {/* Cancel button */}
            <div className="p-2 pt-0">
              <TouchButton
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                Cancelar
              </TouchButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Touch-optimized segmented control
interface TouchSegmentedControlProps {
  options: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TouchSegmentedControl({
  options,
  value,
  onChange,
  className
}: TouchSegmentedControlProps) {
  return (
    <div 
      className={cn(
        'flex p-1 bg-muted rounded-lg',
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        
        return (
          <button
            key={option.value}
            className={cn(
              'flex items-center justify-center flex-1 min-h-[44px] px-3 py-2 text-sm font-medium',
              'transition-colors relative',
              'touch-manipulation', // Disable double-tap zoom
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
            onClick={() => onChange(option.value)}
          >
            {option.icon && (
              <span className="mr-2">{option.icon}</span>
            )}
            {option.label}
            
            {isActive && (
              <motion.div
                layoutId="segmentedControlActive"
                className="absolute inset-0 bg-background rounded-md shadow-sm"
                transition={{ type: 'spring', duration: 0.5 }}
                style={{ zIndex: -1 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Touch-optimized checkbox with larger touch target
interface TouchCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function TouchCheckbox({
  checked,
  onChange,
  label,
  className
}: TouchCheckboxProps) {
  return (
    <button
      className={cn(
        'flex items-center min-h-[44px] px-2',
        'touch-manipulation', // Disable double-tap zoom
        className
      )}
      onClick={() => onChange(!checked)}
      aria-checked={checked}
      role="checkbox"
    >
      <div className={cn(
        'h-6 w-6 rounded-md border flex items-center justify-center',
        checked ? 'bg-primary border-primary' : 'bg-background'
      )}>
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="h-4 w-4 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {label && (
        <span className="ml-3 text-sm">{label}</span>
      )}
    </button>
  );
}

// Touch-optimized context menu (long press menu)
interface TouchContextMenuProps {
  children: React.ReactNode;
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }>;
  className?: string;
}

export function TouchContextMenu({
  children,
  actions,
  className
}: TouchContextMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { isLongPressing, handlers } = useLongPress({
    onLongPress: () => setIsMenuOpen(true),
  });
  
  return (
    <>
      <div
        className={cn(
          'relative',
          isLongPressing && 'opacity-70',
          className
        )}
        {...handlers}
      >
        {children}
      </div>
      
      <TouchActionSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        actions={actions}
      />
    </>
  );
}