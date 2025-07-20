'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores';
import { Crown, Sparkles } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export function AppLayout({ 
  children, 
  className, 
  showSidebar = true, 
  sidebarCollapsed = false,
  onSidebarToggle
}: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(sidebarCollapsed);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    onSidebarToggle?.();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-aida-gold-50 to-white flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <Crown className="w-12 h-12 text-aida-gold-600 mx-auto animate-pulse" />
            <Sparkles className="w-6 h-6 text-aida-gold-500 absolute -top-2 -right-2 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold aida-text-gold">AIDA Platform</h1>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-aida-gold-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-aida-gold-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-aida-gold-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-aida-neutral-600">Carregando sua plataforma...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aida-neutral-50">
      <Header />
      
      <div className="flex">
        <AnimatePresence mode="wait">
          {showSidebar && (
            <Sidebar 
              isCollapsed={isSidebarCollapsed}
              onToggle={handleSidebarToggle}
            />
          )}
        </AnimatePresence>
        
        <main 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            showSidebar ? (isSidebarCollapsed ? "ml-20" : "ml-70") : "ml-0",
            className
          )}
          style={{
            marginLeft: showSidebar ? (isSidebarCollapsed ? '80px' : '280px') : '0'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-[calc(100vh-64px)] p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// Wrapper para páginas que precisam de layout completo
export function withAppLayout<T extends object>(
  Component: React.ComponentType<T>,
  options: {
    showSidebar?: boolean;
    requireAuth?: boolean;
  } = {}
) {
  const { showSidebar = true, requireAuth = true } = options;

  return function WrappedComponent(props: T) {
    const { isAuthenticated } = useAuthStore();

    if (requireAuth && !isAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-aida-gold-50 to-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <Crown className="w-12 h-12 text-aida-gold-600 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold aida-text-gold">Acesso Restrito</h1>
              <p className="text-aida-neutral-600">Faça login para acessar esta página</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <AppLayout showSidebar={showSidebar}>
        <Component {...props} />
      </AppLayout>
    );
  };
}

// Hook para controlar o layout
export function useAppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleSidebarVisibility = () => setShowSidebar(!showSidebar);

  return {
    sidebarCollapsed,
    showSidebar,
    toggleSidebar,
    toggleSidebarVisibility,
    setSidebarCollapsed,
    setShowSidebar
  };
}