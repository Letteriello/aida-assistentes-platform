/**
 * AIDA Platform - Animated Modal Component
 * Enhanced modal with Framer Motion animations
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef } from 'react';
import { Dialog, DialogContent, DialogProps } from './dialog';
import { modalVariants, backdropVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedModalProps extends DialogProps {
  className?: string;
  overlayClassName?: string;
  animationType?: 'scale' | 'slide' | 'fade';
}

export const AnimatedModal = forwardRef<
  HTMLDivElement,
  AnimatedModalProps
>(({ 
  className,
  overlayClassName,
  animationType = 'scale',
  children,
  open,
  onOpenChange,
  ...props 
}, ref) => {
  const getModalVariants = () => {
    switch (animationType) {
      case 'slide':
        return {
          hidden: { opacity: 0, y: -50 },
          visible: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -50 }
        };
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 }
        };
      default:
        return modalVariants;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <AnimatePresence>
        {open && (
          <>
            {/* Animated backdrop */}
            <motion.div
              className={cn(
                'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
                overlayClassName
              )}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => onOpenChange?.(false)}
            />
            
            {/* Animated modal content */}
            <motion.div
              ref={ref}
              className={cn(
                'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
                'w-full max-w-lg gap-4 border bg-background p-6 shadow-lg',
                'sm:rounded-lg',
                className
              )}
              variants={getModalVariants()}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Dialog>
  );
});

AnimatedModal.displayName = 'AnimatedModal';

// Confirmation Modal with animations
export function AnimatedConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title = 'Confirmar ação',
  description = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default'
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}) {
  return (
    <AnimatedModal open={open} onOpenChange={onOpenChange}>
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <motion.div 
          className="flex justify-end space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            onClick={() => onOpenChange(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {cancelText}
          </motion.button>
          <motion.button
            className={cn(
              'px-4 py-2 text-sm rounded-md transition-colors',
              variant === 'destructive' 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {confirmText}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatedModal>
  );
}