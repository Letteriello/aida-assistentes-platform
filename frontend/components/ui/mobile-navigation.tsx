/**
 * AIDA Platform - Mobile Navigation Component
 * Optimized navigation for mobile devices with cross-browser compatibility
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  MessageSquare, 
  Bot, 
  FileText, 
  Settings, 
  User, 
  Menu, 
  X, 
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsive } from './responsive-wrapper';
import { Button } from './button';

interface MobileNavigationProps {
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

export function MobileNavigation({ className, user, onLogout }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const pathname = usePathname();
  const { isMobile, isTablet, isTouch, deviceInfo } = useResponsive();

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle swipe gestures for cross-browser compatibility
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && isOpen) {
      setIsOpen(false);
    }
  };

  // Prevent body scroll when drawer is open (iOS Safari fix)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Assistentes', href: '/assistants', icon: Bot },
    { name: 'Conversas', href: '/conversations', icon: MessageSquare },
    { name: 'Documentos', href: '/documents', icon: FileText },
    { name: 'Configurações', href: '/settings', icon: Settings },
    { name: 'Perfil', href: '/profile', icon: User },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-background/95 backdrop-blur-sm border-t',
        'safe-area-inset-bottom', // iOS notch support
        'md:hidden',
        // Cross-browser backdrop blur fallback
        'supports-[backdrop-filter]:bg-background/95',
        'supports-[not(backdrop-filter)]:bg-background',
        className
      )}>
        <div className="flex items-center justify-between px-2">
          {navigationItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3',
                  'min-w-[60px] min-h-[60px]', // Adequate touch target
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'active:scale-95', // Touch feedback
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  // Enhanced touch targets for different devices
                  {
                    'min-h-[64px]': isTouch && deviceInfo?.screen.width < 375, // Small screens
                    'min-h-[72px]': isTouch && deviceInfo?.isIOS, // iOS devices
                  }
                )}
                aria-label={item.name}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 h-1 w-12 bg-primary rounded-t-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center py-2 px-3',
              'min-w-[60px] min-h-[60px]',
              'text-muted-foreground hover:text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'active:scale-95',
              {
                'min-h-[64px]': isTouch && deviceInfo?.screen.width < 375,
                'min-h-[72px]': isTouch && deviceInfo?.isIOS,
              }
            )}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </Button>
        </div>
      </div>

      {/* Drawer Navigation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className={cn(
                'fixed inset-0 z-50 bg-black/50 md:hidden',
                'supports-[backdrop-filter]:backdrop-blur-sm'
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />

            {/* Drawer */}
            <motion.div
              className={cn(
                'fixed inset-y-0 right-0 z-50 bg-background shadow-xl md:hidden',
                'w-3/4 max-w-xs',
                // Full width on very small screens
                {
                  'w-full max-w-none': isMobile && deviceInfo?.screen.width < 375,
                }
              )}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ 
                type: 'spring', 
                damping: 25, 
                stiffness: 300,
                // Reduce motion for users who prefer it
                duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.1 : undefined
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0"
                    aria-label="Fechar menu"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-2">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center px-4 py-3 text-sm font-medium',
                          'transition-colors duration-200',
                          isActive 
                            ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                            : 'text-foreground hover:bg-accent/50'
                        )}
                      >
                        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>{item.name}</span>
                        <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                      </Link>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">Usuário AIDA</p>
                      <p className="text-xs text-muted-foreground">usuario@exemplo.com</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      aria-label="Configurações de perfil"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Bottom Sheet Component for Mobile
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}: BottomSheetProps) {
  const { handlers } = useSwipe({
    onSwipeDown: onClose,
  });

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />

          {/* Sheet */}
          <motion.div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-xl max-h-[90vh] overflow-hidden md:hidden',
              className
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            {...handlers}
          >
            {/* Drag Handle */}
            <div className="flex justify-center p-2">
              <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h2 className="text-lg font-semibold">{title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 max-h-[calc(90vh-80px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Touch-optimized Card Component
interface TouchCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
}

export function TouchCard({ 
  children, 
  onPress, 
  onLongPress, 
  className 
}: TouchCardProps) {
  const [isTouching, setIsTouching] = useState(false);
  
  const handleTouchStart = () => {
    setIsTouching(true);
  };
  
  const handleTouchEnd = () => {
    setIsTouching(false);
    onPress?.();
  };
  
  // Long press detection
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleTouchStartLongPress = () => {
    handleTouchStart();
    
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
      }, 500);
      
      setLongPressTimer(timer);
    }
  };
  
  const handleTouchEndLongPress = () => {
    handleTouchEnd();
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  return (
    <motion.div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden',
        'active:scale-[0.98] transition-transform duration-200',
        isTouching && 'bg-muted/50',
        className
      )}
      animate={isTouching ? { scale: 0.98 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
      onTouchStart={handleTouchStartLongPress}
      onTouchEnd={handleTouchEndLongPress}
      onTouchCancel={handleTouchEndLongPress}
    >
      {children}
    </motion.div>
  );
}