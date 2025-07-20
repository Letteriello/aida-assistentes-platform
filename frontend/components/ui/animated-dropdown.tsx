/**
 * AIDA Platform - Animated Dropdown Component
 * Enhanced dropdown with Framer Motion animations
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { forwardRef, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import { cn } from '@/lib/utils';

interface AnimatedDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  animationType?: 'scale' | 'slide' | 'fade';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export const AnimatedDropdown = forwardRef<
  HTMLDivElement,
  AnimatedDropdownProps
>(({ 
  trigger,
  children,
  className,
  contentClassName,
  animationType = 'scale',
  side = 'bottom',
  align = 'start',
  ...props 
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const getAnimationVariants = () => {
    switch (animationType) {
      case 'slide':
        return {
          hidden: { 
            opacity: 0, 
            y: side === 'top' ? 10 : -10,
            scale: 0.95
          },
          visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: {
              duration: 0.2,
              ease: 'easeOut'
            }
          },
          exit: { 
            opacity: 0, 
            y: side === 'top' ? 10 : -10,
            scale: 0.95,
            transition: {
              duration: 0.15,
              ease: 'easeIn'
            }
          }
        };
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: {
              duration: 0.2,
              ease: 'easeOut'
            }
          },
          exit: { 
            opacity: 0,
            transition: {
              duration: 0.15,
              ease: 'easeIn'
            }
          }
        };
      default: // scale
        return {
          hidden: { 
            opacity: 0, 
            scale: 0.95,
            transformOrigin: align === 'start' ? 'top left' : align === 'end' ? 'top right' : 'top center'
          },
          visible: { 
            opacity: 1, 
            scale: 1,
            transition: {
              duration: 0.2,
              ease: 'easeOut'
            }
          },
          exit: { 
            opacity: 0, 
            scale: 0.95,
            transition: {
              duration: 0.15,
              ease: 'easeIn'
            }
          }
        };
    }
  };

  return (
    <DropdownMenu onOpenChange={setIsOpen} {...props}>
      <DropdownMenuTrigger asChild className={className}>
        {trigger}
      </DropdownMenuTrigger>
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent asChild side={side} align={align}>
            <motion.div
              ref={ref}
              className={cn(
                'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
                contentClassName
              )}
              variants={getAnimationVariants()}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {children}
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
});

AnimatedDropdown.displayName = 'AnimatedDropdown';

// Animated Dropdown Item
export const AnimatedDropdownItem = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DropdownMenuItem> & { delay?: number }
>(({ className, children, delay = 0, ...props }, ref) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2, ease: 'easeOut' }}
    >
      <DropdownMenuItem
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
          'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          'hover:bg-accent hover:text-accent-foreground',
          className
        )}
        {...props}
      >
        {children}
      </DropdownMenuItem>
    </motion.div>
  );
});

AnimatedDropdownItem.displayName = 'AnimatedDropdownItem';

// User Profile Dropdown
export function UserProfileDropdown({ 
  user, 
  onLogout 
}: { 
  user: { name: string; email: string; avatar?: string }; 
  onLogout: () => void;
}) {
  return (
    <AnimatedDropdown
      trigger={
        <motion.button
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </motion.button>
      }
      animationType="scale"
      align="end"
    >
      <AnimatedDropdownItem delay={0}>
        <span>Perfil</span>
      </AnimatedDropdownItem>
      <AnimatedDropdownItem delay={0.05}>
        <span>Configurações</span>
      </AnimatedDropdownItem>
      <AnimatedDropdownItem delay={0.1}>
        <span>Ajuda</span>
      </AnimatedDropdownItem>
      <motion.div
        className="h-px bg-border my-1"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.15, duration: 0.2 }}
      />
      <AnimatedDropdownItem delay={0.2} onClick={onLogout}>
        <span className="text-destructive">Sair</span>
      </AnimatedDropdownItem>
    </AnimatedDropdown>
  );
}

// Context Menu with animations
export function AnimatedContextMenu({
  trigger,
  items,
  className
}: {
  trigger: React.ReactNode;
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }>;
  className?: string;
}) {
  return (
    <AnimatedDropdown
      trigger={trigger}
      animationType="scale"
      className={className}
    >
      {items.map((item, index) => (
        <AnimatedDropdownItem
          key={item.label}
          delay={index * 0.05}
          onClick={item.onClick}
          className={item.destructive ? 'text-destructive focus:text-destructive' : ''}
        >
          <div className="flex items-center space-x-2">
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            <span>{item.label}</span>
          </div>
        </AnimatedDropdownItem>
      ))}
    </AnimatedDropdown>
  );
}