'use client';

import { usePathname } from 'next/navigation';
import { DashboardLayout } from './dashboard-layout';
import { useAuthStore } from '@/lib/stores';
import { useEffect, useState } from 'react';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

// Rotas que não precisam do DashboardLayout
const publicRoutes = ['/', '/register'];

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Sempre chama useAuthStore para seguir rules of hooks
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR ou antes do mount, renderiza apenas children
  if (!mounted) {
    return <>{children}</>;
  }
  
  // Se a rota é pública ou o usuário não está autenticado, não aplica o DashboardLayout
  const isPublicRoute = publicRoutes.includes(pathname);
  const shouldUseDashboardLayout = isAuthenticated && !isPublicRoute;

  if (shouldUseDashboardLayout) {
    return (
      <DashboardLayout>
        {children}
      </DashboardLayout>
    );
  }

  // Para páginas públicas, retorna apenas o children sem layout
  return <>{children}</>;
}