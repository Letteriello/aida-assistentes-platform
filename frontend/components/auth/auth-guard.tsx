'use client';

import { useAuthStore } from '@/lib/stores';
import { LoginForm } from '@/components/auth/login-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Rotas que não precisam de autenticação
const publicRoutes = ['/', '/register'];

export function AuthGuard({ children }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false);
  
  // Always call hooks at the top level
  const { isAuthenticated, isLoading } = useAuthStore();
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR ou antes do mount, renderiza as crianças diretamente
  if (!mounted) {
    return <>{children}</>;
  }
  
  // Se a rota é pública, não aplica o guard
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute) {
    return <LoginForm />;
  }

  return <>{children}</>;
}